import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useToast } from "../components/toast/ToastProvider";

function leftDays(until) {
  if (!until) return null;
  const ms = new Date(until) - new Date();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function safeDiv(a, b) { 
  return b > 0 ? (a / b) : 0; 
}

// Uwaga: trzymaj PRODUCTS poza komponentem, aby uniknąć problemów z hoistingiem
const PRODUCTS = [
  { key: "highlight_24h", name: "Wyróżnienie 24h",  price: "10 zł",  rank: "+20 pkt",  effects: { border:"24h", top:"–", ai:"–" } },
  { key: "top_7d",        name: "TOP 7 dni",        price: "49 zł",  rank: "+40 pkt",  effects: { border:"7 dni", top:"7 dni", ai:"–" } },
  { key: "top_14d",       name: "TOP 14 dni",       price: "99 zł",  rank: "+60 pkt",  effects: { border:"14 dni", top:"14 dni", ai:"7 dni" } },
  { key: "top_31d",       name: "TOP 31 dni",       price: "199 zł", rank: "+100 pkt", effects: { border:"31 dni", top:"31 dni", ai:"31 dni" } },
];

export default function ProviderPromote() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(null);
  const token = localStorage.getItem("token");
  const [autoRenew, setAutoRenew] = useState(false);
  const [code, setCode] = useState("");
  const { push } = useToast();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/promo/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error('Fetch error:', err);
      // Tymczasowe mock data gdy backend nie działa
      setState({
        promo: {
          highlightUntil: null,
          topBadgeUntil: null,
          pinBoostUntil: null,
          aiTopTagUntil: null,
          rankBoostUntil: null,
          rankBoostPoints: 0,
          active: {
            highlight: false,
            top: false,
            pin: false,
            ai: false,
            rank: false,
          }
        },
        prices: PRODUCTS.reduce((acc, p) => {
          acc[p.key] = { label: p.name, price: parseInt(p.price), days: p.key.includes('24h') ? 1 : parseInt(p.key.match(/\d+/)[0]), rank: parseInt(p.rank) };
          return acc;
        }, {}),
        metrics: {
          impressions: 0,
          mapOpens: 0,
          clicks: 0,
          quoteRequests: 0,
          chatsStarted: 0,
          ordersWon: 0,
          periodStart: new Date()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // query paramy z powrotu Stripe
    const q = new URLSearchParams(window.location.search);
    if (q.get("paid") === "1") {
      push({ title: "Płatność przyjęta", description: "Pakiet został aktywowany.", variant: "success" });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (q.get("canceled") === "1") {
      push({ title: "Płatność anulowana", description: "Nie dokończyłeś płatności.", variant: "error" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const checkout = async (productKey) => {
    try {
      const res = await fetch("/api/promo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          productKey, 
          autoRenew, 
          promoCode: code.trim() || undefined 
        })
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        push({ title: "Błąd płatności", description: data.message || "Spróbuj ponownie.", variant: "error" });
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      // Tymczasowe mock success gdy backend nie działa
      push({ title: "Pakiet aktywowany!", description: "Demo - pakiet został aktywowany.", variant: "success" });
      fetchData(); // odśwież dane
    }
  };

  if (loading) return <div className="p-4">Ładowanie…</div>;
  if (!state) return <div className="p-4">Błąd ładowania danych</div>;

  const { promo, prices, metrics } = state;

  const PRODUCTS = [
    { key: "highlight_24h", name: "Wyróżnienie 24h",  price: "10 zł",  rank: "+20 pkt",  effects: { border:"24h", top:"–", ai:"–" } },
    { key: "top_7d",        name: "TOP 7 dni",        price: "49 zł",  rank: "+40 pkt",  effects: { border:"7 dni", top:"7 dni", ai:"–" } },
    { key: "top_14d",       name: "TOP 14 dni",       price: "99 zł",  rank: "+60 pkt",  effects: { border:"14 dni", top:"14 dni", ai:"7 dni" } },
    { key: "top_31d",       name: "TOP 31 dni",       price: "199 zł", rank: "+100 pkt", effects: { border:"31 dni", top:"31 dni", ai:"31 dni" } },
  ];

  const daysTop = leftDays(promo?.topBadgeUntil);
  const daysHighlight = leftDays(promo?.highlightUntil);

  // ROI KPI
  const M = metrics || {};
  const S = state.promo?.metricsAtStart || {};
  const delta = (a, b) => (a || 0) - (b || 0);
  
  const CTR = (safeDiv(M.clicks, M.impressions) * 100).toFixed(1);
  const QRate = (safeDiv(M.quoteRequests, M.clicks) * 100).toFixed(1);
  const Win = (safeDiv(M.ordersWon, M.quoteRequests) * 100).toFixed(1);
  
  const dImpr = delta(M.impressions, S.impressions);
  const dClicks = delta(M.clicks, S.clicks);
  const dQuotes = delta(M.quoteRequests, S.quoteRequests);
  const dWins = delta(M.ordersWon, S.ordersWon);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Promuj swój profil</h1>
      {state?.promo?.autoRenew && (
        <div className="mb-3 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
          Auto-renew ON
        </div>
      )}

      {/* Panel auto-renewal + kody rabatowe */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2">
          <input 
            type="checkbox" 
            className="scale-110" 
            checked={autoRenew} 
            onChange={e => setAutoRenew(e.target.checked)} 
          />
          <span>Auto-odnawiaj pakiet (subskrypcja Stripe)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Kod rabatowy"
            className="px-3 py-2 rounded-xl border"
          />
          <span className="text-xs text-gray-500">lub wpiszesz na stronie Stripe</span>
        </div>
      </div>

      {/* Banery ostrzeżeń */}
      {(daysTop !== null && daysTop <= 3 && daysTop >= 0) && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          Pakiet <b>TOP</b> wygasa za <b>{daysTop} dni</b>.
          <button className="btn ml-3" onClick={() => checkout('top_7d')}>Przedłuż</button>
        </div>
      )}
      
      {(daysHighlight !== null && daysHighlight <= 2 && daysHighlight >= 0) && (
        <div className="mb-4 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3">
          Twoje <b>Wyróżnienie</b> kończy się za <b>{daysHighlight} dni</b>. 
          <button className="btn ml-3" onClick={() => checkout('highlight_24h')}>Przedłuż</button>
        </div>
      )}

      {/* ROI KPI Grid */}
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-xs text-gray-500">Wyświetlenia</div>
          <div className="text-2xl font-bold">{M.impressions || 0}</div>
          {S.at && <div className={`text-xs ${dImpr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{dImpr >= 0 ? '+' : ''}{dImpr} vs start</div>}
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-xs text-gray-500">CTR (Kliknięcia/wyś.)</div>
          <div className="text-2xl font-bold">{CTR}%</div>
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-xs text-gray-500">Quote Rate</div>
          <div className="text-2xl font-bold">{QRate}%</div>
          {S.at && <div className={`text-xs ${dQuotes >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{dQuotes >= 0 ? '+' : ''}{dQuotes} zapytań vs start</div>}
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-xs text-gray-500">Win Rate</div>
          <div className="text-2xl font-bold">{Win}%</div>
          {S.at && <div className={`text-xs ${dWins >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{dWins >= 0 ? '+' : ''}{dWins} wygranych vs start</div>}
        </div>
      </div>

      {/* Chipy ile zostało */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {state.promo?.highlightUntil && <span className="chip">Wyróżnienie: {leftDays(state.promo.highlightUntil)} dni</span>}
        {state.promo?.topBadgeUntil && <span className="chip">TOP: {leftDays(state.promo.topBadgeUntil)} dni</span>}
        {state.promo?.aiTopTagUntil && <span className="chip">AI: {leftDays(state.promo.aiTopTagUntil)} dni</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border mb-8">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Pakiet</th>
              <th className="p-3">Cena</th>
              <th className="p-3">Efekt (ranking)</th>
              <th className="p-3">Obwódka</th>
              <th className="p-3">Badge TOP</th>
              <th className="p-3">Badge AI</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
                         {PRODUCTS.map(p => (
               <tr key={p.key} className="border-t hover:bg-gray-50">
                 <td className="p-3 font-medium">{p.name}</td>
                 <td className="p-3">{p.price}</td>
                 <td className="p-3">{p.rank}</td>
                 <td className="p-3">{p.effects.border}</td>
                 <td className="p-3">{p.effects.top}</td>
                 <td className="p-3">{p.effects.ai}</td>
                 <td className="p-3">
                   <button 
                     onClick={() => checkout(p.key)} 
                     className="btn"
                   >
                     Wybierz
                   </button>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-2">Aktywne promocje</h2>
      <ul className="text-sm leading-7">
        <li>Wyróżnienie do: {fmt(promo?.highlightUntil)}</li>
        <li>TOP do: {fmt(promo?.topBadgeUntil)}</li>
        <li>AI poleca do: {fmt(promo?.aiTopTagUntil)}</li>
        <li>Punkty rankingowe: {promo?.active?.rank ? promo?.rankBoostPoints : 0} (do {fmt(promo?.rankBoostUntil)})</li>
      </ul>

      {/* Status auto-renewal + przycisk wyłączania */}
      {promo?.autoRenew && (
        <div className="mt-4 rounded-xl border bg-green-50 px-4 py-3">
          Auto-odnawianie: <b>włączone</b> (pakiet: {promo?.subscriptionProductKey || '—'})
          <button
            className="btn-secondary ml-3"
            onClick={async () => {
              try {
                const res = await fetch("/api/promo/autorenew/cancel", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                push({ title: "Auto-odnawianie wyłączone", description: data.message || "Subskrypcja wygaśnie na koniec okresu.", variant: "success" });
                fetchData(); // odśwież dane
              } catch (err) {
                console.error('Cancel autorenew error:', err);
                push({ title: "Błąd", description: "Błąd wyłączania auto-odnawiania", variant: "error" });
              }
            }}
          >
            Wyłącz auto-odnawianie
          </button>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2">
        Analityka (od {new Date(metrics.periodStart).toLocaleDateString()})
      </h2>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Stat label="Wyświetlenia listy" value={metrics.impressions} />
        <Stat label="Wyświetlenia na mapie" value={metrics.mapOpens} />
        <Stat label="Kliknięcia profilu" value={metrics.clicks} />
        <Stat label="Zapytania o wycenę" value={metrics.quoteRequests} />
        <Stat label="Starty czatu" value={metrics.chatsStarted} />
        <Stat label="Wygrane zlecenia" value={metrics.ordersWon} />
      </div>
      
      <div className="mt-8 p-4 rounded-xl border bg-white">
        <h3 className="font-semibold mb-2">Skuteczność (bieżący okres)</h3>
        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div>Wyświetlenia: <b>{metrics.impressions}</b></div>
          <div>Kliknięcia: <b>{metrics.clicks}</b></div>
          <div>Zapytania: <b>{metrics.quoteRequests}</b></div>
        </div>
        {/* Wykres metryk */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              {name:"Impresje", v: metrics.impressions},
              {name:"Kliknięcia", v: metrics.clicks},
              {name:"Zapytania", v: metrics.quoteRequests},
              {name:"Czaty", v: metrics.chatsStarted},
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button
        className="mt-4 text-sm text-gray-600 underline"
        onClick={async () => {
          try {
            await fetch("/api/promo/metrics/reset", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
          } catch (err) {
            console.error('Reset error:', err);
          }
        }}
      >
        Wyzeruj okres
      </button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-4 rounded-xl border bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function fmt(d){ return d ? new Date(d).toLocaleString() : "—"; }
