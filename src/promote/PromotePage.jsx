import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';

export default function PromotePage() {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [preview, setPreview] = useState({}); // planId -> { finalAmount, discountAmount }

  const load = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(apiUrl(`/api/promote/plans`)),
        fetch(apiUrl(`/api/promote/me/status`), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setPlans((await pRes.json()).items || []);
      setStatus(await sRes.json());
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  useEffect(() => { load(); }, []);

  // Podgląd ceny po rabacie – woła /api/coupons/apply dla każdego planu
  useEffect(() => {
    const run = async () => {
      // brak kodu → czyścimy podgląd
      if (!couponCode || !couponCode.trim()) {
        setPreview({});
        return;
      }
      const code = couponCode.trim();
      const next = {};

      await Promise.all((plans || []).map(async (plan) => {
        try {
          const res = await fetch(apiUrl(`/api/coupons/apply`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              code,
              productKey: plan.code,
              baseAmount: plan.price,
            }),
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data?.ok) {
            next[plan._id] = {
              finalAmount: data.finalAmount,
              discountAmount: data.discountAmount,
            };
          }
        } catch (e) {
          // cicho – brak podglądu dla tego planu
          console.error('Coupon preview error', e);
        }
      }));

      setPreview(next);
    };

    run();
  }, [couponCode, plans, API, token]);

  const [requestInvoice, setRequestInvoice] = useState(false);

  const buy = async (planId) => {
    try {
      setLoadingId(planId);
      const res = await fetch(apiUrl(`/api/promote/create-intent`), {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId, couponCode: couponCode || undefined, requestInvoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd płatności');
      window.location.href = `/checkout?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const now = new Date();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Promowanie i pakiety PRO</h1>
      <p className="text-sm text-gray-600 mb-4">
        Zwiększ widoczność, zdobywaj punkty rankingowe i badge. Płatność w systemie Helpfli.
      </p>

      {/* Pole na kupon – wspólne dla wszystkich planów (na starcie prościej) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Kod rabatowy Helpfli (np. WELCOME20)"
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[220px]"
        />
        <span className="text-xs text-gray-500">
          Kod zostanie zastosowany przy zakupie planu, jeśli jest ważny dla wybranego pakietu.
        </span>
      </div>

      {status && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Punkty rankingowe</div>
            <div className="text-2xl font-semibold">{status.rankingPoints}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">TOP badge</div>
            <div className="text-lg">
              {status.badges?.topUntil && new Date(status.badges.topUntil) > now
                ? `Aktywne do ${new Date(status.badges.topUntil).toLocaleString()}`
                : 'Nieaktywne'}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Wyróżnienie (obwódka)</div>
            <div className="text-lg">
              {status.badges?.highlightUntil && new Date(status.badges.highlightUntil) > now
                ? `Aktywne do ${new Date(status.badges.highlightUntil).toLocaleString()}`
                : 'Nieaktywne'}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => {
          const info = preview[plan._id];
          const basePrice = plan.price;
          const final = info?.finalAmount ?? basePrice;
          const discount = info?.discountAmount ?? 0;
          return (
          <div key={plan._id} className="rounded-2xl border p-4 bg-white shadow-sm flex flex-col">
            <div className="text-lg font-semibold">{plan.name}</div>
            <div className="text-sm text-gray-600">{plan.description}</div>
            <div className="text-2xl font-bold my-3">
              {discount > 0 && (
                <span className="line-through text-gray-400 mr-2">
                  {(basePrice/100).toFixed(2)} zł
                </span>
              )}
              <span>{(final/100).toFixed(2)} zł</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-1 mb-4">
              {plan.effects?.highlight && <li>• Wyróżnienie (obwódka)</li>}
              {plan.effects?.topBadge && <li>• Badge TOP</li>}
              {plan.effects?.aiBadge && <li>• Polecane przez AI</li>}
              {plan.rankingPointsAdd > 0 && <li>• +{plan.rankingPointsAdd} pkt ranking</li>}
              <li>• Czas: {plan.durationDays} dni</li>
            </ul>
            <button
              onClick={() => buy(plan._id)}
              disabled={loadingId === plan._id}
              className="mt-auto px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loadingId === plan._id ? 'Przekierowanie…' : 'Kup / Odnów'}
            </button>
          </div>
        )})}
      </div>
    </div>
  );
}



















