import { apiUrl } from "@/lib/apiUrl";
import { useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';

export default function BoostOrderButton({ order, onBoosted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleBoost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/orders/${order._id}/boost`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Błąd podbijania zlecenia');
      }
      
      if (data.requiresPayment) {
        // Wymagana płatność - przekieruj do checkout
        setShowPayment(true);
        // Tutaj można otworzyć modal płatności lub przekierować do checkout
        if (data.paymentIntent?.clientSecret) {
          // Użyj Stripe Payment Element
          window.location.href = `/checkout?paymentIntent=${data.paymentIntent.id}&orderId=${order._id}&type=boost`;
        }
      } else {
        // Darmowe podbicie
        if (onBoosted) {
          onBoosted(data);
        }
        alert('✅ Zlecenie zostało podbite! Będzie widoczne na górze listy przez 24 godziny.');
      }
    } catch (err) {
      setError(err.message);
      console.error('Boost error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isBoosted = order.boostedUntil && new Date(order.boostedUntil) > new Date();
  const boostExpiresIn = isBoosted ? Math.ceil((new Date(order.boostedUntil) - new Date()) / (1000 * 60 * 60)) : null;

  if (isBoosted) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-md">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">
          Podbite • Wygasa za {boostExpiresIn}h
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleBoost}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className="w-4 h-4" />
        <span className="text-sm font-medium">
          {loading ? 'Podbijanie...' : 'Podbij zlecenie'}
        </span>
      </button>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

