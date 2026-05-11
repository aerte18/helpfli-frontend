import { useEffect, useMemo, useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function CheckoutPage() {
  const stripe = useStripe();
  const elements = useElements();
  const params = new URLSearchParams(window.location.search);
  const clientSecret = params.get('cs');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  // Musi być przed jakimkolwiek warunkowym return — inaczej React #185 (zmienna liczba hooków)
  const paymentElementOptions = useMemo(
    () => ({ layout: { type: 'tabs', defaultCollapsed: false } }),
    []
  );

  useEffect(() => {
    if (clientSecret) setReady(true);
  }, [clientSecret]);

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Przekaż parametry z URL do return_url (Stripe dopisze payment_intent* przy redirectcie)
    const sp = new URLSearchParams(window.location.search);
    const kind = sp.get('kind');
    const type = sp.get('type') || (kind === 'commission' ? 'commission' : '');
    const providerId = sp.get('providerId');
    const price = sp.get('price');
    let orderId = sp.get('orderId');
    if (!orderId) {
      const m = window.location.pathname.match(/^\/checkout\/([^/?#]+)/);
      if (m) orderId = decodeURIComponent(m[1]);
    }

    const extra = new URLSearchParams();
    if (type) extra.set('type', type);
    if (providerId) extra.set('providerId', providerId);
    if (orderId) extra.set('orderId', orderId);
    if (price) extra.set('price', price);

    let returnUrl = `${window.location.origin}/payment-result`;
    const q = extra.toString();
    if (q) returnUrl += `?${q}`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (error) setMessage(error.message || 'Błąd płatności');
  };

  if (!ready) return <div>Ładowanie…</div>;

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
        <h3 className="font-semibold text-blue-900 mb-2">Metody płatności</h3>
        <p className="text-sm text-blue-800">
          Wybór jest w formularzu powyżej — Stripe pokazuje tylko metody włączone dla tej konkretnej płatności
          (najczęściej karta; czasem BLIK lub Przelewy24, jeśli konto platformy ma je aktywne w Stripe).
        </p>
      </div>
    </div>
  );
}






















