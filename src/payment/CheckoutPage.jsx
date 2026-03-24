import { useEffect, useMemo, useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function CheckoutPage() {
  const stripe = useStripe();
  const elements = useElements();
  const params = new URLSearchParams(window.location.search);
  const clientSecret = params.get('cs');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (clientSecret) setReady(true);
  }, [clientSecret]);

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Przekaż parametry z URL do return_url
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const providerId = params.get('providerId');
    const orderId = params.get('orderId');
    const price = params.get('price');
    
    let returnUrl = `${window.location.origin}/payment-result`;
    if (type) {
      returnUrl += `?type=${encodeURIComponent(type)}`;
      if (providerId) returnUrl += `&providerId=${encodeURIComponent(providerId)}`;
      if (orderId) returnUrl += `&orderId=${encodeURIComponent(orderId)}`;
      if (price) returnUrl += `&price=${encodeURIComponent(price)}`;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (error) setMessage(error.message || 'Błąd płatności');
  };

  if (!ready) return <div>Ładowanie…</div>;

  const paymentElementOptions = useMemo(() => ({
    layout: 'tabs',
    paymentMethodTypes: ['card', 'blik', 'p24'], // BLIK i Przelewy24
  }), []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Wybierz metodę płatności</h2>
        <form onSubmit={submit} className="space-y-4">
          <PaymentElement options={paymentElementOptions} />
          {message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {message}
            </div>
          )}
          <button 
            type="submit"
            disabled={!stripe || !elements}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {!stripe || !elements ? 'Ładowanie...' : 'Zapłać'}
          </button>
        </form>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Dostępne metody płatności:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>💳 Karta kredytowa/debetowa (Visa, Mastercard)</li>
          <li>📱 BLIK (płatność mobilna)</li>
          <li>🏦 Przelewy24 (przelew bankowy online)</li>
        </ul>
      </div>
    </div>
  );
}






















