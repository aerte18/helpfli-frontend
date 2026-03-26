import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from 'react';

export default function OrderPricingPreview({ orderId, baseAmount, extras, promoCode, pointsToUse, onFinalize }) {
  const token = localStorage.getItem('token');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const payload = useMemo(() => ({ baseAmount, extras, promoCode, pointsToUse }), [baseAmount, extras, promoCode, pointsToUse]);

  const fetchPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/checkout/preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd kalkulacji');
      setPreview(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPreview(); }, [JSON.stringify(payload)]);

  const finalize = async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/checkout/finalize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd finalizacji');
      onFinalize?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !preview) return <div>Liczenie…</div>;
  if (error) return <div className="text-rose-600">{error}</div>;
  if (!preview) return null;

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white">
      <div className="flex justify-between"><span>Kwota bazowa</span><span>{preview.baseAmount} {preview.currency}</span></div>
      <div className="flex justify-between"><span>Dopłaty</span><span>{preview.extrasCost} {preview.currency}</span></div>
      <div className="flex justify-between"><span>Prowizja platformy</span><span>{preview.platformFee} {preview.currency}</span></div>
      {preview.discountPromo > 0 && (
        <div className="flex justify-between text-emerald-600"><span>Rabat (kod)</span><span>-{preview.discountPromo} {preview.currency}</span></div>
      )}
      {preview.discountPoints > 0 && (
        <div className="flex justify-between text-emerald-600"><span>Rabat (punkty)</span><span>-{preview.discountPoints} {preview.currency}</span></div>
      )}
      <div className="flex justify-between font-semibold text-lg mt-2"><span>Do zapłaty</span><span>{preview.total} {preview.currency}</span></div>
      <button className="btn btn-primary w-full mt-4" onClick={finalize}>Zapłać (mock)</button>
    </div>
  );
}





























