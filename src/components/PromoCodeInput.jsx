import { apiUrl } from "@/lib/apiUrl";
import { useState } from 'react';

export default function PromoCodeInput({ onValidate, baseAmount = 0, serviceKey }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const handleValidate = async () => {
    setError('');
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/promo/validate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, baseAmount, serviceKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd walidacji');
      onValidate?.(data.promo);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <input
        className="input w-full px-3 py-2 rounded-xl border"
        placeholder="Kod rabatowy"
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      <button className="btn" onClick={handleValidate} disabled={loading}>
        {loading ? 'Sprawdzam…' : 'Zastosuj'}
      </button>
      {error && <div className="text-rose-600 text-sm ml-2">{error}</div>}
    </div>
  );
}


