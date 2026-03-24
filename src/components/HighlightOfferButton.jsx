import { useState } from 'react';
import { Star, Sparkles } from 'lucide-react';

export default function HighlightOfferButton({ offer, orderId, onHighlighted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleHighlight = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/offers/${offer._id}/boost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          durationHours: 24
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Błąd wyróżniania oferty');
      }
      
      if (data.requiresPayment) {
        // Wymagana płatność - przekieruj do checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else if (data.paymentAmount) {
          window.location.href = `/checkout?reason=offer_boost&offerId=${offer._id}&amount=${data.paymentAmount}`;
        }
      } else {
        // Darmowe wyróżnienie
        if (onHighlighted) {
          onHighlighted(data);
        }
        alert('✅ Oferta została wyróżniona! Będzie widoczna na górze listy przez 24 godziny.');
      }
    } catch (err) {
      setError(err.message);
      console.error('Highlight error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isHighlighted = offer.highlightedUntil && new Date(offer.highlightedUntil) > new Date();
  const highlightExpiresIn = isHighlighted ? Math.ceil((new Date(offer.highlightedUntil) - new Date()) / (1000 * 60 * 60)) : null;

  if (isHighlighted) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-sm">
        <Sparkles className="w-3 h-3" />
        <span className="text-xs font-medium">
          Wyróżniona • {highlightExpiresIn}h
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleHighlight}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
      >
        <Star className="w-3 h-3" />
        <span>{loading ? 'Wyróżnianie...' : 'Wyróżnij ofertę'}</span>
      </button>
      {error && (
        <div className="mt-1 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
}

