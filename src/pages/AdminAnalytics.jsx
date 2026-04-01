import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from "react";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt2(v) {
  return num(v).toFixed(2);
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
    } catch (error) {
      console.error("AdminAnalytics load error:", error);
      setSummary({});
      setFunnel([]);
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

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Ładowanie…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Analytics</h1>

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
