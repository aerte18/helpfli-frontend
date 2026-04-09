import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from "react";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt2(v) {
  return num(v).toFixed(2);
}

function fmtRate(r) {
  if (r == null || !Number.isFinite(Number(r))) return "—";
  return `${(Number(r) * 100).toFixed(2)}%`;
}

function asText(v) {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function AdminAnalytics() {
  const token = localStorage.getItem("token");
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState({});
  const [funnel, setFunnel] = useState([]);
  const [productInsights, setProductInsights] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/analytics/summary?from=${from}&to=${to}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summaryJson = await res.json().catch(() => ({}));
      setSummary(summaryJson && typeof summaryJson === "object" ? summaryJson : {});

      const fRes = await fetch(
        apiUrl(`/api/telemetry/funnel?startDate=${from}T00:00:00.000Z&endDate=${to}T23:59:59.999Z`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const funnelJson = await fRes.json().catch(() => ([]));
      if (Array.isArray(funnelJson)) setFunnel(funnelJson);
      else setFunnel(Array.isArray(funnelJson?.overall) ? funnelJson.overall : []);

      const [piRes, healthRes] = await Promise.all([
        fetch(apiUrl(`/api/admin/analytics/product-insights?from=${from}&to=${to}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(`/api/admin/analytics/api-health?from=${from}&to=${to}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const piJson = await piRes.json().catch(() => null);
      setProductInsights(piJson && typeof piJson === "object" ? piJson : null);
      const hJson = await healthRes.json().catch(() => null);
      setApiHealth(hJson && typeof hJson === "object" ? hJson : null);
    } catch (error) {
      console.error("AdminAnalytics load error:", error);
      setSummary({});
      setFunnel([]);
      setProductInsights(null);
      setApiHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpi = summary?.kpi || {};
  const topServices = useMemo(() => (Array.isArray(summary?.topServices) ? summary.topServices : []), [summary]);
  const daily = useMemo(() => (Array.isArray(summary?.daily) ? summary.daily : []), [summary]);
  const funnelRows = useMemo(() => (Array.isArray(funnel) ? funnel : []), [funnel]);
  const traffic = productInsights?.traffic || {};
  const topPaths = useMemo(
    () => (Array.isArray(productInsights?.topPaths) ? productInsights.topPaths : []),
    [productInsights]
  );
  const dailyPv = useMemo(
    () => (Array.isArray(productInsights?.dailyPageViews) ? productInsights.dailyPageViews : []),
    [productInsights]
  );
  const topSearchesPi = useMemo(
    () => (Array.isArray(productInsights?.topSearches) ? productInsights.topSearches : []),
    [productInsights]
  );
  const zeroSearches = useMemo(
    () => (Array.isArray(productInsights?.zeroResultSearches) ? productInsights.zeroResultSearches : []),
    [productInsights]
  );
  const lowSearches = useMemo(
    () => (Array.isArray(productInsights?.lowResultSearches) ? productInsights.lowResultSearches : []),
    [productInsights]
  );
  const topReferrers = useMemo(
    () => (Array.isArray(productInsights?.topReferrers) ? productInsights.topReferrers : []),
    [productInsights]
  );
  const friction = productInsights?.friction || {};
  const conversionRates = productInsights?.conversion?.rates || {};
  const searchQualityBuckets = useMemo(
    () => (Array.isArray(productInsights?.searchQualityBuckets) ? productInsights.searchQualityBuckets : []),
    [productInsights]
  );
  const utmTop = useMemo(
    () => (Array.isArray(productInsights?.utmTop) ? productInsights.utmTop : []),
    [productInsights]
  );
  const retention = productInsights?.retention || {};
  const clientApiErrorsPi = useMemo(
    () => (Array.isArray(productInsights?.clientApiErrors) ? productInsights.clientApiErrors : []),
    [productInsights]
  );
  const searchApiHealth = apiHealth?.search || {};
  const statusCodesHealth = useMemo(
    () => (Array.isArray(searchApiHealth?.statusCodes) ? searchApiHealth.statusCodes : []),
    [searchApiHealth]
  );

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Ładowanie…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Analytics</h1>
      <p className="text-sm text-gray-600 max-w-3xl">
        Metryki biznesowe poniżej. Sekcja „Ruch i wyszukiwania” korzysta z telemetrii (zdarzenia po zgodzie na cookies;
        wyszukiwania na /home zapisują liczbę wyników — widać zapytania bez dopasowania).
      </p>

      <div className="flex gap-3 items-end">
        <label className="text-sm">Od <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded p-1" /></label>
        <label className="text-sm">Do <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded p-1" /></label>
        <button onClick={load} className="px-3 py-2 rounded bg-indigo-600 text-white">Odśwież</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Zlecenia" value={asText(num(kpi.orders))} />
        <Card title="Opłacone" value={asText(num(kpi.ordersPaid))} />
        <Card title="Obrót (PLN)" value={asText(fmt2(num(kpi.revenue) / 100))} />
        <Card title="Średnia wartość (PLN)" value={asText(fmt2(num(kpi.avgOrder) / 100))} />
      </div>

      <h2 className="text-lg font-semibold text-slate-800 pt-2">Ruch i wyszukiwania (produkt)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Odsłony (page_view)" value={asText(num(traffic.pageViews))} />
        <Card title="Sesje (szac.)" value={asText(num(traffic.distinctSessionsApprox))} />
        <Card title="Zdarzenia wyszukiwania" value={asText(num(traffic.searchEvents))} />
        <Card title="Zakres" value={productInsights?.range ? `${productInsights.range.from} → ${productInsights.range.to}` : "—"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Konwersja: wyszukiwanie / odsłona" value={fmtRate(conversionRates.searchPerPageView)} />
        <Card title="Konwersja: profil / wyszukiwanie" value={fmtRate(conversionRates.providerViewPerSearch)} />
        <Card title="Konwersja: zapytanie o wycenę / profil" value={fmtRate(conversionRates.quotePerProviderView)} />
        <Card title="Konwersja: sukces zlecenia / odsłona" value={fmtRate(conversionRates.orderSuccessPerPageView)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card
          title="Powroty (2+ dni z page_view, zalogowani)"
          value={
            retention.usersWithPageViews != null
              ? `${asText(num(retention.returningUsers))} / ${asText(num(retention.usersWithPageViews))} (${fmtRate(retention.returningRate)})`
              : "—"
          }
        />
        <Card title="GET /api/search: próbek (log)" value={asText(num(searchApiHealth.samples))} />
        <Card title="GET /api/search: śr. czas (ms)" value={asText(searchApiHealth.avgMs != null ? searchApiHealth.avgMs : "—")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Jakość wyników wyszukiwania (liczba wykonawców)">
          <SimpleTable
            headers={["Bucket", "Zdarzeń search"]}
            rows={searchQualityBuckets.map((r) => [asText(r?.bucket), asText(num(r?.count))])}
          />
        </Panel>
        <Panel title="Błędy API (klient, telemetria)">
          <SimpleTable
            headers={["Endpoint", "Razy"]}
            rows={clientApiErrorsPi.map((r) => [asText(r?.endpoint), asText(num(r?.count))])}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="UTM (top kampanie, page_view)">
          <SimpleTable
            headers={["Źródło", "Medium", "Kampania", "Wejść"]}
            rows={utmTop.map((u) => [
              asText(u?.source),
              asText(u?.medium),
              asText(u?.campaign),
              asText(num(u?.count)),
            ])}
          />
        </Panel>
        <Panel title="GET /api/search: kody HTTP (serwer)">
          <SimpleTable
            headers={["Status", "Razy"]}
            rows={statusCodesHealth.map((s) => [asText(s?.status), asText(num(s?.count))])}
          />
          <p className="text-xs text-gray-500 mt-2">
            Czasy z próbek serwera (ostatnie ~72 h w logu); zakres dat filtruje rekordy w bazie.
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Najczęstsze ścieżki (URL)">
          <SimpleTable
            headers={["Ścieżka", "Odsłony", "Unikalni (userId)"]}
            rows={topPaths.map((p) => [
              asText(p?.path || p?._id || "—"),
              asText(num(p?.views)),
              asText(num(p?.uniqueUsers)),
            ])}
          />
        </Panel>
        <Panel title="Skąd przychodzą (referrer, jeśli znany)">
          <SimpleTable
            headers={["Referrer (skrót)", "Wejść"]}
            rows={topReferrers.map((r) => [asText(r?.referrer), asText(num(r?.count))])}
          />
        </Panel>
      </div>

      <Panel title="Odsłony wg dnia">
        <SimpleTable
          headers={["Data", "Odsłony"]}
          rows={dailyPv.map((d) => [asText(d?._id), asText(num(d?.views))])}
        />
      </Panel>

      <Panel title="Najczęstsze zapytania w wyszukiwarce (Home)">
        <SimpleTable
          headers={["Zapytanie", "Razy", "Śr. wyników", "Zerowych wyników"]}
          rows={topSearchesPi.map((s) => [
            asText(s?.query),
            asText(num(s?.count)),
            asText(fmt2(num(s?.avgResults))),
            asText(num(s?.zeroHits)),
          ])}
        />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Wyszukiwania bez wyników (0 wykonawców)">
          <SimpleTable
            headers={["Zapytanie", "Razy"]}
            rows={zeroSearches.map((s) => [asText(s?.query), asText(num(s?.count))])}
          />
        </Panel>
        <Panel title="Niski wynik wyszukiwania (1–3 wykonawców)">
          <SimpleTable
            headers={["Zapytanie", "Razy"]}
            rows={lowSearches.map((s) => [asText(s?.query), asText(num(s?.count))])}
          />
        </Panel>
      </div>

      <Panel title="Tarcie: porzucenia formularza zlecenia i spory (telemetria)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Porzucenie: tworzenie zlecenia (krok)</div>
            <SimpleTable
              headers={["Krok / lastStep", "Razy"]}
              rows={(friction.orderFormAbandonByStep || []).map((r) => [asText(r?.step), asText(num(r?.count))])}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">Spory: powód (jeśli zapisany)</div>
            <SimpleTable
              headers={["Powód", "Razy"]}
              rows={(friction.disputesByReason || []).map((r) => [asText(r?.reason), asText(num(r?.count))])}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Lejek (raw)">
        <SimpleTable
          headers={["Typ", "Zdarzenia"]}
          rows={funnelRows.map((r) => [asText(r?._id || "—"), asText(num(r?.count))])}
        />
      </Panel>

      <Panel title="Top usługi">
        <SimpleTable
          headers={["Usługa", "Zlecenia", "Przychód (PLN)"]}
          rows={topServices.map((s) => [
            asText(s?._id || "—"),
            asText(num(s?.count)),
            asText(fmt2(num(s?.revenue) / 100)),
          ])}
        />
      </Panel>

      <Panel title="Trend dzienny (ostatnie 14)">
        <SimpleTable
          headers={["Data", "Zlecenia", "Opłacone", "Przychód (PLN)"]}
          rows={daily.slice(-14).map((d) => [
            asText(d?._id || "—"),
            asText(num(d?.orders)),
            asText(num(d?.paid)),
            asText(fmt2(num(d?.revenue) / 100)),
          ])}
        />
      </Panel>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="border rounded-2xl p-4 bg-white">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="border rounded-2xl p-4 bg-white">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            {headers.map((h) => <th key={h} className="p-2">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              {r.map((c, j) => <td key={j} className="p-2">{asText(c)}</td>)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="p-3 text-gray-500">Brak danych.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
