import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import L from 'leaflet';

export default function AdminAnalytics() {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');

  const [from, setFrom] = useState(() => new Date(Date.now()-30*864e5).toISOString().slice(0,10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const [data, setData] = useState(null);
  const [monetization, setMonetization] = useState(null);
  const [segDim, setSegDim] = useState('city');
  const [segments, setSegments] = useState([]);
  const [funnel, setFunnel] = useState([]);

  const load = async () => {
    const res = await fetch(`${API}/api/admin/analytics/summary?from=${from}&to=${to}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d = await res.json();
    setData(d);
    setTimeout(drawMap, 0);

    // Monetization summary
    try {
      const mRes = await fetch(`${API}/api/admin/analytics/monetization-summary?from=${from}&to=${to}`, {
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
      const funnelRes = await fetch(
        `${API}/api/telemetry/funnel?startDate=${from}T00:00:00.000Z&endDate=${to}T23:59:59.999Z`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (funnelRes.ok) {
        const f = await funnelRes.json();
        setFunnel(Array.isArray(f) ? f : []);
      } else {
        setFunnel([]);
      }
    } catch {
      setFunnel([]);
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

    const maxCount = Math.max(...(data.heatmap?.map(h=>h.count)||[1]));
    (data.heatmap||[]).forEach(h => {
      const r = 500 + (h.count / maxCount) * 2500;
      const opacity = Math.min(0.75, 0.2 + (h.count / maxCount)*0.6);
      L.circle([h.lat, h.lon], { radius: r, color: '#7c3aed', weight: 1, fillOpacity: opacity }).addTo(map);
    });
    mapEl._leaflet = map;
  };

  const downloadCsv = async (dataset) => {
    const url = `${API}/api/admin/analytics/export?dataset=${dataset}&from=${from}&to=${to}`;
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
    const url = `${API}/api/admin/reports/monthly.pdf?month=${month}`;
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
    const url = `${API}/api/admin/reports/monthly_cities.pdf?month=${month}&limit=${limit}`;
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
    const url = `${API}/api/admin/reports/monthly_services.pdf?month=${month}&limit=${limit}&lang=${lang}`;
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
    const res = await fetch(`${API}/api/admin/analytics/segment?dim=${segDim}&from=${from}&to=${to}`, {
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
      const res = await fetch(`${API}/api/payments/refund`, {
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
  const daily = (data.daily||[]).map(x=>({ date:x._id, orders:x.orders, paid:x.paid, revenue: Math.round((x.revenue||0)/100) }));

  const funnelSteps = useMemo(() => {
    if (!Array.isArray(funnel) || funnel.length === 0) return [];
    const byType = Object.fromEntries(
      funnel.map((item) => [item._id || item.type || item.eventType, item.count || 0])
    );
    const get = (key) => byType[key] || 0;

    const steps = [
      {
        key: 'search',
        label: 'Wejście / wyszukiwanie',
        description: 'Użytkownicy, którzy zaczęli szukać usługi',
        count: get('search'),
      },
      {
        key: 'provider_view',
        label: 'Podgląd wykonawców',
        description: 'Użytkownicy, którzy przeglądali profile / listę wykonawców',
        count: get('provider_view'),
      },
      {
        key: 'order_form_start',
        label: 'Start formularza zlecenia',
        description: 'Użytkownicy, którzy rozpoczęli wypełnianie CreateOrder',
        count: get('order_form_start'),
      },
      {
        key: 'order_form_success',
        label: 'Zlecenie utworzone',
        description: 'Zlecenia utworzone przez użytkowników (wysłany formularz)',
        count: get('order_form_success'),
      },
      {
        key: 'offer_form_start',
        label: 'Start formularza oferty',
        description: 'Wykonawcy, którzy zaczęli pisać ofertę',
        count: get('offer_form_start'),
      },
      {
        key: 'offer_form_submit',
        label: 'Oferta wysłana',
        description: 'Oferty faktycznie wysłane do klientów',
        count: get('offer_form_submit'),
      },
      {
        key: 'order_accepted',
        label: 'Oferta zaakceptowana',
        description: 'Oferty zaakceptowane przez klientów',
        count: get('order_accepted'),
      },
      {
        key: 'payment_succeeded',
        label: 'Płatność w systemie',
        description: 'Zlecenia z opłaconą płatnością w Helpfli',
        count: get('payment_succeeded'),
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
  }, [funnel]);

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
          <div className="font-semibold">Lejek konwersji (CreateOrder → oferta → płatność)</div>
          <div className="text-xs text-gray-500">
            Zakres: {from} – {to}
          </div>
        </div>

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
                  {step.convFromFirst != null && (
                    <div className="text-xs text-gray-600">
                      Od startu:{" "}
                      <span className="font-medium">
                        {step.convFromFirst.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {step.dropFromPrev != null && idx > 0 && (
                    <div className="text-xs text-gray-500">
                      Spadek vs poprzedni krok:{" "}
                      <span className="font-medium">
                        {step.dropFromPrev.toFixed(1)}%
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
                      <td className="p-2">
                        {step.convFromFirst == null
                          ? "—"
                          : `${step.convFromFirst.toFixed(1)}%`}
                      </td>
                      <td className="p-2">
                        {step.dropFromPrev == null
                          ? "—"
                          : `${step.dropFromPrev.toFixed(1)}%`}
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
        <KpiCard title="Zlecenia" value={z.orders}/>
        <KpiCard title="Opłacone (w systemie)" value={z.ordersPaid}/>
        <KpiCard title="Obrót (PLN)" value={(z.revenue/100).toFixed(2)}/>
        <KpiCard title="Średnia wartość (PLN)" value={(z.avgOrder/100).toFixed(2)}/>
        <KpiCard title="Udział płatnych" value={((z.paidShare*100)||0).toFixed(1)+'%'}/>
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
              value={(monetization.subscriptions?.mrrPLN ?? 0).toFixed(2)}
            />
            <KpiCard 
              title="Przychód z promocji (PLN)" 
              value={(monetization.promotions?.revenuePLN ?? 0).toFixed(2)}
            />
            <KpiCard 
              title="Kupony użyte / wystawione" 
              value={`${monetization.coupons?.used ?? 0} / ${monetization.coupons?.totalIssued ?? 0}`}
            />
            <KpiCard 
              title="Współczynnik użycia kuponów" 
              value={(((monetization.coupons?.usageRate || 0) * 100).toFixed(1)) + '%'}
            />
          </div>

          {Array.isArray(monetization.subscriptions?.byPlan) && monetization.subscriptions.byPlan.length > 0 && (
            <div className="mt-3 text-xs text-gray-600">
              <div className="font-medium mb-1">Subskrypcje wg planu:</div>
              <div className="flex flex-wrap gap-2">
                {monetization.subscriptions.byPlan.map((p, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-full border bg-gray-50">
                    {p.planKey}: {p.count}
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
        </div>
        <div className="border rounded-2xl p-4 bg-white">
          <div className="font-semibold mb-2">Przychód dzienny (PLN)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border rounded-2xl p-4 bg-white">
        <div className="font-semibold mb-2">Top usługi</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={(data.topServices||[]).map(s=>({ service: String(s._id||'—'), count:s.count, revenue: Math.round((s.revenue||0)/100) }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="service" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segments.map(s=>({ segment: s.segment || '—', orders: s.orders, revenue: Math.round((s.revenue||0)/100) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" />
              </BarChart>
            </ResponsiveContainer>
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
                {segments.map((s, i)=>(
                  <tr key={i} className="border-t">
                    <td className="p-2">{s.segment || '—'}</td>
                    <td className="p-2">{s.orders}</td>
                    <td className="p-2">{s.paidOrders}</td>
                    <td className="p-2">{((s.paidShare*100)||0).toFixed(1)}%</td>
                    <td className="p-2">{((s.revenue||0)/100).toFixed(2)}</td>
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
}

function KpiCard({ title, value }) {
  return (
    <div className="border rounded-2xl p-4 bg-white">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
