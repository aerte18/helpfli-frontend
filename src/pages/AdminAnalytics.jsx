import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import L from 'leaflet';

export default function AdminAnalytics() {
  const token = localStorage.getItem('token');

  const [from, setFrom] = useState(() => new Date(Date.now()-30*864e5).toISOString().slice(0,10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const [data, setData] = useState(null);
  const [monetization, setMonetization] = useState(null);
  const [segDim, setSegDim] = useState('city');
  const [segments, setSegments] = useState([]);
  const [funnel, setFunnel] = useState({ overall: [], client: [], provider: [] });
  const [funnelView, setFunnelView] = useState('overall');

  const load = async () => {
    const res = await fetch(apiUrl(`/api/admin/analytics/summary?from=${from}&to=${to}`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await res.json();
    setData(d);
    setTimeout(drawMap, 0);

    // Monetization summary
    try {
      const mRes = await fetch(apiUrl(`/api/admin/analytics/monetization-summary?from=${from}&to=${to}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mRes.ok) {
        const m = await mRes.json();
        setMonetization(m);
      } else {
        setMonetization(null);
      }
    } catch {
      setMonetization(null);
    }

    // Conversion funnel (CreateOrder / OfferForm / płatności)
    try {
      const funnelRes = await fetch(apiUrl(`/api/telemetry/funnel?startDate=${from}T00:00:00.000Z&endDate=${to}T23:59:59.999Z`), {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (funnelRes.ok) {
        const f = await funnelRes.json();
        if (Array.isArray(f)) {
          setFunnel({ overall: f, client: [], provider: [] });
        } else {
          setFunnel({
            overall: Array.isArray(f?.overall) ? f.overall : [],
            client: Array.isArray(f?.client) ? f.client : [],
            provider: Array.isArray(f?.provider) ? f.provider : [],
          });
        }
      } else {
        setFunnel({ overall: [], client: [], provider: [] });
      }
    } catch {
      setFunnel({ overall: [], client: [], provider: [] });
    }
  };

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, []);
  useEffect(()=>{ if (data) drawMap(); }, [data]);

  const drawMap = () => {
    if (!data) return;
    const el = document.getElementById('heatmap');
    if (!el) return;
    if (el._leaflet_id) { el._leaflet?.remove(); el.replaceWith(el.cloneNode(true)); }
    const mapEl = document.getElementById('heatmap');
    const map = L.map(mapEl).setView([52.2297, 21.0122], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    const safeHeat = (Array.isArray(data.heatmap) ? data.heatmap : [])
      .map((h) => ({ lat: num(h?.lat), lon: num(h?.lon), count: Math.max(0, num(h?.count)) }))
      .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lon) && h.count > 0);
    const maxCount = Math.max(...(safeHeat.map((h) => h.count) || [1]));
    safeHeat.forEach((h) => {
      const r = 500 + (h.count / maxCount) * 2500;
      const opacity = Math.min(0.75, 0.2 + (h.count / maxCount) * 0.6);
      L.circle([h.lat, h.lon], { radius: r, color: '#7c3aed', weight: 1, fillOpacity: opacity }).addTo(map);
    });
    mapEl._leaflet = map;
  };

  const downloadCsv = async (dataset) => {
    const url = apiUrl(`/api/admin/analytics/export?dataset=${dataset}&from=${from}&to=${to}`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) return alert('Błąd eksportu');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `helpfli_${dataset}_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadMonthlyPdf = async (month) => {
    const url = apiUrl(`/api/admin/reports/monthly.pdf?month=${month}`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) return alert('Błąd generowania PDF');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `helpfli_monthly_${month}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadMonthlyCitiesPdf = async (month, limit=10) => {
    const url = apiUrl(`/api/admin/reports/monthly_cities.pdf?month=${month}&limit=${limit}`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) return alert('Błąd generowania PDF per miasto');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `helpfli_monthly_cities_${month}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadMonthlyServicesPdf = async (month, limit=15, lang='pl') => {
    const url = apiUrl(`/api/admin/reports/monthly_services.pdf?month=${month}&limit=${limit}&lang=${lang}`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) return alert('Błąd generowania PDF per usługa');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `helpfli_monthly_services_${month}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loadSegments = async () => {
    const res = await fetch(apiUrl(`/api/admin/analytics/segment?dim=${segDim}&from=${from}&to=${to}`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await res.json();
    setSegments(d.items || []);
  };

  const [refundId, setRefundId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMsg, setRefundMsg] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  const handleRefund = async () => {
    if (!refundId) {
      setRefundMsg("Podaj ID płatności (Payment._id).");
      return;
    }
    setRefundMsg("");
    setRefundLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/payments/refund`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: refundId,
          amount: refundAmount ? Math.round(Number(refundAmount) * 100) : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Błąd zwrotu");
      }
      setRefundMsg("✅ Zwrot zainicjowany w Stripe.");
    } catch (e) {
      setRefundMsg(e.message || "Błąd zwrotu");
    } finally {
      setRefundLoading(false);
    }
  };

  if (!data) return <div className="max-w-6xl mx-auto p-6">Ładowanie…</div>;

  const z = data.kpi || {};
  const safeDaily = Array.isArray(data.daily) ? data.daily.filter(Boolean) : [];
  const daily = safeDaily.map((x) => ({
    date: x?._id || '',
    orders: num(x?.orders),
    paid: num(x?.paid),
    revenue: Math.round(num(x?.revenue) / 100),
  }));
  const topServicesChartData = (Array.isArray(data.topServices) ? data.topServices : []).map((s) => ({
    service: String(s?._id || '—'),
    count: num(s?.count),
    revenue: Math.round(num(s?.revenue) / 100),
  }));
  const segmentChartData = (Array.isArray(segments) ? segments : []).map((s) => ({
    segment: s?.segment || '—',
    orders: num(s?.orders),
    revenue: Math.round(num(s?.revenue) / 100),
  }));

  const funnelSteps = useMemo(() => {
    const selectedFunnel = Array.isArray(funnel?.[funnelView]) ? funnel[funnelView] : [];
    if (selectedFunnel.length === 0) return [];
    const byType = Object.fromEntries(
      (Array.isArray(selectedFunnel) ? selectedFunnel : [])
        .filter(Boolean)
        .map((item) => [
        item?._id || item?.type || item?.eventType || 'unknown',
        { count: num(item?.count), uniqueUsers: num(item?.uniqueUsers) }
      ])
    );
    const get = (key) => byType[key] || { count: 0, uniqueUsers: 0 };

    const steps = [
      {
        key: 'page_view',
        label: 'Wejścia na strony',
        description: 'Wyświetlenia stron (landing/home i inne wejścia)',
        count: get('page_view').count,
        uniqueUsers: get('page_view').uniqueUsers,
      },
      {
        key: 'search',
        label: 'Wyszukiwanie',
        description: 'Użytkownicy, którzy wykonali wyszukiwanie usługi',
        count: get('search').count,
        uniqueUsers: get('search').uniqueUsers,
      },
      {
        key: 'provider_view',
        label: 'Podgląd wykonawców',
        description: 'Przegląd kart/profili wykonawców',
        count: get('provider_view').count,
        uniqueUsers: get('provider_view').uniqueUsers,
      },
      {
        key: 'provider_contact',
        label: 'Kontakt z wykonawcą',
        description: 'Kliknięcia kontaktu (telefon/wiadomość/oferta)',
        count: get('provider_contact').count,
        uniqueUsers: get('provider_contact').uniqueUsers,
      },
      {
        key: 'order_form_start',
        label: 'Start formularza zlecenia',
        description: 'Użytkownicy, którzy rozpoczęli wypełnianie CreateOrder',
        count: get('order_form_start').count,
        uniqueUsers: get('order_form_start').uniqueUsers,
      },
      {
        key: 'order_form_success',
        label: 'Zlecenie wysłane',
        description: 'Zlecenia utworzone przez użytkowników (wysłany formularz)',
        count: get('order_form_success').count,
        uniqueUsers: get('order_form_success').uniqueUsers,
      },
      {
        key: 'quote_request',
        label: 'Prośba o wycenę',
        description: 'Użytkownicy, którzy wysłali zapytanie o wycenę',
        count: get('quote_request').count,
        uniqueUsers: get('quote_request').uniqueUsers,
      },
      {
        key: 'offer_form_start',
        label: 'Start formularza oferty',
        description: 'Wykonawcy, którzy zaczęli pisać ofertę',
        count: get('offer_form_start').count,
        uniqueUsers: get('offer_form_start').uniqueUsers,
      },
      {
        key: 'offer_form_submit',
        label: 'Oferta wysłana',
        description: 'Oferty faktycznie wysłane do klientów',
        count: get('offer_form_submit').count,
        uniqueUsers: get('offer_form_submit').uniqueUsers,
      },
      {
        key: 'order_accepted',
        label: 'Oferta zaakceptowana',
        description: 'Oferty zaakceptowane przez klientów',
        count: get('order_accepted').count,
        uniqueUsers: get('order_accepted').uniqueUsers,
      },
      {
        key: 'payment_succeeded',
        label: 'Płatność w systemie',
        description: 'Zlecenia z opłaconą płatnością w Helpfli',
        count: get('payment_succeeded').count,
        uniqueUsers: get('payment_succeeded').uniqueUsers,
      },
    ];

    let firstNonZero = steps.find((s) => s.count > 0)?.count || 0;
    if (!firstNonZero) {
      return steps.map((s) => ({ ...s, dropFromPrev: null, convFromFirst: null }));
    }

    let prev = firstNonZero;
    return steps.map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          dropFromPrev: null,
          convFromFirst: 100,
        };
      }
      const count = step.count;
      const dropFromPrev =
        prev > 0 ? Math.round(((prev - count) / prev) * 1000) / 10 : null;
      const convFromFirst =
        firstNonZero > 0 ? Math.round((count / firstNonZero) * 1000) / 10 : null;
      prev = count || prev;
      return {
        ...step,
        dropFromPrev,
        convFromFirst,
      };
    });
  }, [funnel, funnelView]);

  const funnelRegressionAlert = useMemo(() => {
    const drops = funnelSteps
      .filter((step, idx) => idx > 0 && typeof step.dropFromPrev === 'number')
      .sort((a, b) => (b.dropFromPrev || 0) - (a.dropFromPrev || 0));
    const worst = drops[0];
    if (!worst || num(worst.dropFromPrev) < 35) return null;
    return `Uwaga: duży spadek w lejku (${fmt1(worst.dropFromPrev)}%) na kroku "${worst.label}".`;
  }, [funnelSteps]);

  try {
    return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Analytics</h1>
      <div className="flex gap-3 items-end">
        <label className="text-sm">Od <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded p-1"/></label>
        <label className="text-sm">Do <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded p-1"/></label>
        <button onClick={load} className="px-3 py-2 rounded bg-indigo-600 text-white">Odśwież</button>
      </div>

      <div className="flex gap-2 items-end">
        <label className="text-sm">Miesiąc
          <input type="month" value={from.slice(0,7)} onChange={e=>downloadMonthlyPdf(e.target.value)} className="border rounded p-1 ml-2"/>
        </label>
        <button onClick={()=>downloadMonthlyPdf((new Date().toISOString()).slice(0,7))} className="px-3 py-2 rounded bg-gray-200">
          Pobierz PDF (ten miesiąc)
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={()=>downloadCsv('daily')} className="px-3 py-2 rounded bg-gray-200">Eksport: Dzienny</button>
        <button onClick={()=>downloadCsv('orders')} className="px-3 py-2 rounded bg-gray-200">Eksport: Zlecenia</button>
        <button onClick={()=>downloadCsv('top-services')} className="px-3 py-2 rounded bg-gray-200">Eksport: Top usługi</button>
        <button onClick={()=>downloadMonthlyPdf((new Date().toISOString()).slice(0,7))} className="px-3 py-2 rounded bg-gray-200">PDF miesięczny (global)</button>
        <button onClick={()=>downloadMonthlyCitiesPdf((new Date().toISOString()).slice(0,7), 10)} className="px-3 py-2 rounded bg-gray-200">PDF miesięczny per miasto (Top 10)</button>
        <button onClick={()=>downloadMonthlyServicesPdf((new Date().toISOString()).slice(0,7), 15, 'pl')} className="px-3 py-2 rounded bg-gray-200">PDF miesięczny per usługa (PL)</button>
        <button onClick={()=>downloadMonthlyServicesPdf((new Date().toISOString()).slice(0,7), 15, 'en')} className="px-3 py-2 rounded bg-gray-200">PDF by service (EN)</button>
      </div>

      {/* Lejek konwersji: od wejścia po płatność */}
      <div className="border rounded-2xl p-4 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Lejek konwersji (wejście → kontakt/zlecenie → płatność)</div>
          <div className="text-xs text-gray-500">
            Zakres: {from} – {to}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFunnelView('overall')} className={`px-2.5 py-1 rounded text-xs ${funnelView === 'overall' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Wszyscy</button>
          <button onClick={() => setFunnelView('client')} className={`px-2.5 py-1 rounded text-xs ${funnelView === 'client' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Klienci</button>
          <button onClick={() => setFunnelView('provider')} className={`px-2.5 py-1 rounded text-xs ${funnelView === 'provider' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Wykonawcy</button>
        </div>
        {funnelRegressionAlert && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {funnelRegressionAlert}
          </div>
        )}

        {funnelSteps.length === 0 ? (
          <div className="text-sm text-gray-600">
            Brak danych w wybranym zakresie. Upewnij się, że wydarzenia telemetryczne są zbierane.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {funnelSteps.map((step, idx) => (
                <div
                  key={step.key}
                  className="border rounded-2xl p-3 bg-slate-50 flex flex-col gap-1"
                >
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Krok {idx + 1}
                  </div>
                  <div className="font-semibold text-sm">{step.label}</div>
                  <div className="text-xs text-gray-600">{step.description}</div>
                  <div className="mt-1 text-2xl font-semibold">{step.count}</div>
                  <div className="text-xs text-gray-600">Unikalni: <span className="font-medium">{step.uniqueUsers || 0}</span></div>
                  {step.convFromFirst != null && (
                    <div className="text-xs text-gray-600">
                      Od startu:{" "}
                      <span className="font-medium">
                        {fmt1(step.convFromFirst)}%
                      </span>
                    </div>
                  )}
                  {step.dropFromPrev != null && idx > 0 && (
                    <div className="text-xs text-gray-500">
                      Spadek vs poprzedni krok:{" "}
                      <span className="font-medium">
                        {fmt1(step.dropFromPrev)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="overflow-auto mt-3">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="p-2">Krok</th>
                    <th className="p-2">Label</th>
                    <th className="p-2">Zdarzenia</th>
                    <th className="p-2">Unikalni użytkownicy</th>
                    <th className="p-2">Konwersja od startu</th>
                    <th className="p-2">Spadek vs poprzedni</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelSteps.map((step, idx) => (
                    <tr key={step.key} className="border-b">
                      <td className="p-2 whitespace-nowrap">Krok {idx + 1}</td>
                      <td className="p-2 whitespace-nowrap">{step.label}</td>
                      <td className="p-2">{step.count}</td>
                      <td className="p-2">{step.uniqueUsers || 0}</td>
                      <td className="p-2">
                        {step.convFromFirst == null
                          ? "—"
                          : `${fmt1(step.convFromFirst)}%`}
                      </td>
                      <td className="p-2">
                        {step.dropFromPrev == null
                          ? "—"
                          : `${fmt1(step.dropFromPrev)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Zlecenia" value={z.orders} deltaPct={data.compare?.orders?.deltaPct}/>
        <KpiCard title="Opłacone (w systemie)" value={z.ordersPaid} deltaPct={data.compare?.ordersPaid?.deltaPct}/>
        <KpiCard title="Obrót (PLN)" value={fmt2(num(z.revenue) / 100)} deltaPct={data.compare?.revenue?.deltaPct}/>
        <KpiCard title="Średnia wartość (PLN)" value={fmt2(num(z.avgOrder) / 100)} deltaPct={data.compare?.avgOrder?.deltaPct}/>
        <KpiCard title="Udział płatnych" value={fmt1(num(z.paidShare) * 100) + '%'} />
        <KpiCard title="Wykonawcy" value={z.providersCount}/>
        <KpiCard title="Zweryfikowani (KYC)" value={z.providersVerified}/>
        <KpiCard title="Klienci" value={z.clientsCount}/>
      </div>

      {/* Monetization KPIs */}
      {monetization && (
        <div className="border rounded-2xl p-4 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Monetyzacja (subskrypcje, promocje, kupony)</div>
            <div className="text-xs text-gray-500">
              Zakres: {monetization.range?.from} – {monetization.range?.to}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard 
              title="Aktywne subskrypcje" 
              value={monetization.subscriptions?.activeCount ?? 0}
            />
            <KpiCard 
              title="Providerzy PRO" 
              value={monetization.subscriptions?.proProvidersCount ?? 0}
            />
            <KpiCard 
              title="MRR z subskrypcji (PLN)" 
              value={fmt2(num(monetization.subscriptions?.mrrPLN))}
            />
            <KpiCard 
              title="Przychód z promocji (PLN)" 
              value={fmt2(num(monetization.promotions?.revenuePLN))}
            />
            <KpiCard 
              title="Kupony użyte / wystawione" 
              value={`${monetization.coupons?.used ?? 0} / ${monetization.coupons?.totalIssued ?? 0}`}
            />
            <KpiCard 
              title="Współczynnik użycia kuponów" 
              value={fmt1(num(monetization.coupons?.usageRate) * 100) + '%'}
            />
          </div>

          {Array.isArray(monetization.subscriptions?.byPlan) && monetization.subscriptions.byPlan.length > 0 && (
            <div className="mt-3 text-xs text-gray-600">
              <div className="font-medium mb-1">Subskrypcje wg planu:</div>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(monetization?.subscriptions?.byPlan) ? monetization.subscriptions.byPlan : [])
                  .filter(Boolean)
                  .map((p, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-full border bg-gray-50">
                    {safeRenderValue(p?.planKey)}: {safeRenderValue(p?.count)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Narzędzie admina: szybki zwrot Stripe */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="font-semibold">Zwrot płatności Stripe (admin)</div>
        <p className="text-xs text-gray-600">
          Podaj ID dokumentu Payment z bazy (Payment._id). Opcjonalnie podaj kwotę zwrotu w PLN (dla częściowego zwrotu).
        </p>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <input
            type="text"
            placeholder="PaymentId (Mongo ObjectId)"
            value={refundId}
            onChange={(e) => setRefundId(e.target.value)}
            className="w-full sm:w-64 border rounded px-2 py-1 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Kwota zwrotu (PLN, opcjonalnie)"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            className="w-full sm:w-52 border rounded px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleRefund}
            disabled={refundLoading}
            className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {refundLoading ? "Przetwarzanie..." : "Zwróć płatność"}
          </button>
        </div>
        {refundMsg && (
          <div className="text-xs text-gray-700">
            {refundMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-4 bg-white">
          <div className="font-semibold mb-2">Zlecenia dziennie</div>
          {daily.length === 0 ? (
            <div className="text-sm text-gray-600 py-10 text-center">Brak danych do wykresu.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
                <YAxis yAxisId="l" />
                <Tooltip />
                <Line yAxisId="l" type="monotone" dataKey="orders" dot={false}/>
                <Line yAxisId="l" type="monotone" dataKey="paid" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <div className="font-semibold mb-2">Przychód dzienny (PLN)</div>
          {daily.length === 0 ? (
            <div className="text-sm text-gray-600 py-10 text-center">Brak danych do wykresu.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="border rounded-2xl p-4 bg-white">
        <div className="font-semibold mb-2">Top usługi</div>
        {topServicesChartData.length === 0 ? (
          <div className="text-sm text-gray-600 py-10 text-center">Brak danych do wykresu.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topServicesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border rounded-2xl p-4 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="font-semibold">Segmentacja</div>
          <select value={segDim} onChange={e=>setSegDim(e.target.value)} className="border rounded p-1">
            <option value="city">Miasto</option>
            <option value="service">Usługa</option>
          </select>
          <button onClick={loadSegments} className="px-3 py-1 rounded bg-indigo-600 text-white">Załaduj</button>
        </div>
        {segments.length === 0 ? (
          <div className="text-sm text-gray-600">Brak danych.</div>
        ) : (
          <>
            {segmentChartData.length === 0 ? (
              <div className="text-sm text-gray-600 py-10 text-center">Brak danych do wykresu.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="overflow-auto mt-3">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left">
                  <th className="p-2">Segment</th>
                  <th className="p-2">Zlecenia</th>
                  <th className="p-2">Opłacone</th>
                  <th className="p-2">% w systemie</th>
                  <th className="p-2">Przychód (PLN)</th>
                </tr></thead>
                <tbody>
                {(Array.isArray(segments) ? segments : []).filter(Boolean).map((s, i)=>(
                  <tr key={i} className="border-t">
                    <td className="p-2">{safeRenderValue(s?.segment ?? '—')}</td>
                    <td className="p-2">{safeRenderValue(s?.orders)}</td>
                    <td className="p-2">{safeRenderValue(s?.paidOrders)}</td>
                    <td className="p-2">{fmt1(num(s?.paidShare) * 100)}%</td>
                    <td className="p-2">{fmt2(num(s?.revenue) / 100)}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="border rounded-2xl p-4 bg-white">
        <div className="font-semibold mb-2">Mapa zleceń (heat)</div>
        <div id="heatmap" style={{ height: 420 }} className="rounded overflow-hidden border"></div>
        <p className="text-xs text-gray-500 mt-2">Kółka odpowiadają zagęszczeniu zleceń (większe/ciemniejsze = więcej).</p>
      </div>
    </div>
    );
  } catch (error) {
    console.error("AdminAnalytics render fallback:", error);
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Wystąpił błąd renderowania analityki. Odśwież stronę lub zmień zakres dat.
        </div>
      </div>
    );
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function fmt1(v) {
  return num(v).toFixed(1);
}
function fmt2(v) {
  return num(v).toFixed(2);
}

function KpiCard({ title, value, deltaPct = null }) {
  const deltaClass =
    typeof deltaPct === "number"
      ? deltaPct >= 0
        ? "text-emerald-600"
        : "text-rose-600"
      : "text-gray-400";
  return (
    <div className="border rounded-2xl p-4 bg-white">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{safeRenderValue(value)}</div>
      <div className={`text-xs mt-1 ${deltaClass}`}>
        {Number.isFinite(deltaPct)
          ? `${deltaPct >= 0 ? "+" : ""}${fmt1(deltaPct)}% vs poprzedni okres`
          : "brak porównania"}
      </div>
    </div>
  );
}

function safeRenderValue(value) {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "tak" : "nie";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
