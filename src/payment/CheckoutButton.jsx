import { apiUrl } from "@/lib/apiUrl";
import { useState } from 'react';
import { FileText } from 'lucide-react';

export default function CheckoutButton({
  orderId,
  requestInvoiceDefault = false,
  createIntentPath = '/api/payments/create-intent',
  buttonLabel = 'Przejdź do płatności online',
  showInvoiceOption = true
}) {
  const [loading, setLoading] = useState(false);
  const [requestInvoice, setRequestInvoice] = useState(!!requestInvoiceDefault);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(createIntentPath), {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ orderId, ...(showInvoiceOption ? { requestInvoice } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd');
      const qs = new URLSearchParams({
        pi: data.paymentIntentId,
        cs: data.clientSecret,
      });
      if (String(createIntentPath || '').includes('commission')) {
        qs.set('kind', 'commission');
      }
      // /checkout/:orderId — StripeProvider musi dostać clientSecret; sama /checkout?cs= też działa po poprawce providera
      window.location.href = `/checkout/${encodeURIComponent(orderId)}?${qs.toString()}`;
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Chcę fakturę VAT – przy płatności */}
      {showInvoiceOption && (
        <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer">
          <input
            type="checkbox"
            checked={requestInvoice}
            onChange={(e) => setRequestInvoice(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Chcę fakturę VAT</span>
        </label>
      )}

      <button 
        onClick={start} 
        disabled={loading} 
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
      >
        {loading ? 'Przetwarzanie…' : buttonLabel}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Metodę płatności wybierzesz w kolejnym kroku Stripe.
      </p>
    </div>
  );
}



















