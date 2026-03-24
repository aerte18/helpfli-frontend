import { useState } from 'react';
import { CreditCard, Smartphone, Banknote, FileText } from 'lucide-react';

export default function CheckoutButton({ orderId, methodHint = 'card', requestInvoiceDefault = false }) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(methodHint);
  const [requestInvoice, setRequestInvoice] = useState(!!requestInvoiceDefault);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ orderId, methodHint: selectedMethod, requestInvoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd');
      // redirect do /checkout?pi=<id>&cs=<client_secret>
      const url = `/checkout?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
      window.location.href = url;
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Chcę fakturę VAT – przy płatności */}
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

      {/* Wybór metody płatności */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedMethod('card')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedMethod === 'card'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <CreditCard className="w-4 h-4" />
            <span>Karta</span>
          </span>
        </button>
        <button
          onClick={() => setSelectedMethod('blik')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedMethod === 'blik'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <Smartphone className="w-4 h-4" />
            <span>BLIK</span>
          </span>
        </button>
        <button
          onClick={() => setSelectedMethod('p24')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedMethod === 'p24'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <Banknote className="w-4 h-4" />
            <span>Przelewy24</span>
          </span>
        </button>
      </div>
      
      <button 
        onClick={start} 
        disabled={loading} 
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
      >
        {loading ? 'Przetwarzanie…' : 'Przejdź do płatności online'}
      </button>
    </div>
  );
}



















