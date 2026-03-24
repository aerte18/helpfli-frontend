import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import GuaranteeBanner from "../components/GuaranteeBanner";
import CheckoutButton from "../payment/CheckoutButton";
import StripeProvider from "../payment/StripeProvider";
import CheckoutPage from "../payment/CheckoutPage";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiGet = async (path) => {
  const res = await fetch(path, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `GET ${path} failed`);
  return data;
};

const apiPost = async (path, body) => {
  const res = await fetch(path, { method: "POST", headers: authHeaders(), body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `POST ${path} failed`);
  return data;
};

export default function Checkout() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("system");
  
  // Sprawdź czy mamy PaymentIntent z URL (z CheckoutButton)
  const paymentIntentId = searchParams.get('pi');
  const clientSecret = searchParams.get('cs');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/orders/${orderId}`);
      setOrder(res);
      setPaymentMethod(res.paymentMethod || "system");
    } catch (e) {
      console.error("Błąd ładowania zlecenia:", e);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (method) => {
    setPaymentMethod(method);
    try {
      await apiPost(`/api/orders/${orderId}/payment-method`, { paymentMethod: method });
      // Odśwież dane zlecenia po zmianie
      await load();
    } catch (e) {
      console.error("Błąd aktualizacji metody płatności:", e);
    }
  };

  useEffect(() => { 
    if (orderId) load(); 
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Ładowanie…</p>
      </div>
    </div>
  );
  
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 mb-4">Nie znaleziono zlecenia.</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Wróć do zleceń
        </button>
      </div>
    </div>
  );

  // Jeśli mamy PaymentIntent z URL - pokaż formularz Stripe
  if (paymentIntentId && clientSecret) {
    return (
      <StripeProvider>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h1 className="text-2xl font-bold mb-2">Płatność za zlecenie</h1>
              <p className="text-gray-600 mb-4">{order.service}</p>
              {order.pricing?.total && (
                <p className="text-lg font-semibold text-indigo-600">
                  Do zapłaty: {order.pricing.total} {order.pricing.currency || 'PLN'}
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <CheckoutPage />
            </div>
          </div>
        </div>
      </StripeProvider>
    );
  }

  // Jeśli nie mamy PaymentIntent - pokaż wybór metody płatności i przycisk do utworzenia
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold mb-4">Płatność za zlecenie</h1>

          <div className="mb-6">
            <GuaranteeBanner
              eligible={!!order.eligibleForGuarantee}
              reasons={order.guaranteeReasons || []}
            />
          </div>

          {/* Szczegóły zlecenia */}
          <div className="border border-gray-200 rounded-xl p-4 mb-6">
            <h2 className="font-semibold mb-3 text-lg">Szczegóły zlecenia</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Usługa:</span>
                <span className="font-medium">{order.service}</span>
              </div>
              {order.serviceDetails && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Szczegóły:</span>
                  <span className="font-medium text-indigo-600">{order.serviceDetails}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'funded' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status === 'accepted' ? 'Oczekuje na płatność' :
                   order.status === 'funded' ? 'Opłacone' :
                   order.status}
                </span>
              </div>
              {order.pricing?.total && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-lg">Do zapłaty:</span>
                  <span className="font-bold text-xl text-indigo-600">
                    {order.pricing.total} {order.pricing.currency || 'PLN'}
                  </span>
                </div>
              )}
              {order.pricing && (
                <div className="pt-2 border-t border-gray-200 space-y-1 text-xs text-gray-500">
                  {order.pricing.baseAmount && (
                    <div className="flex justify-between">
                      <span>Cena wykonawcy:</span>
                      <span>{order.pricing.baseAmount} PLN</span>
                    </div>
                  )}
                  {order.pricing.platformFee > 0 && (
                    <div className="flex justify-between">
                      <span>Prowizja platformy:</span>
                      <span>+{order.pricing.platformFee} PLN</span>
                    </div>
                  )}
                  {order.pricing.guaranteeFee > 0 && (
                    <div className="flex justify-between">
                      <span>Gwarancja Helpfli:</span>
                      <span>+{order.pricing.guaranteeFee} PLN</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Przełącznik metody płatności */}
          {order.status === 'accepted' && (
            <div className="mb-6 border border-gray-200 rounded-xl p-4">
              <h2 className="font-semibold mb-3">Metoda płatności</h2>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => updatePaymentMethod('system')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    paymentMethod === 'system' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💳 Płatność w systemie (zalecane)
                </button>
                <button
                  onClick={() => updatePaymentMethod('external')}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    paymentMethod === 'external' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Poza systemem
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {paymentMethod === 'system' 
                  ? '✅ Płatność w systemie aktywuje „Gwarancję Helpfli" i zabezpiecza środki w escrow.'
                  : '⚠️ Płatność poza systemem = brak gwarancji Helpfli. Rozliczasz się bezpośrednio z wykonawcą.'}
              </p>
            </div>
          )}

          {/* Przycisk płatności */}
          {order.status === 'accepted' && paymentMethod === 'system' && (
            <div className="text-center">
              <CheckoutButton orderId={order._id} methodHint="card" requestInvoiceDefault={order.requestInvoice} />
              <p className="text-xs text-gray-500 mt-3">
                Bezpieczna płatność przez Stripe. Twoje środki będą zabezpieczone w escrow do momentu zakończenia zlecenia.
              </p>
            </div>
          )}

          {order.status === 'funded' && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 font-medium">✅ Zlecenie zostało opłacone</p>
              <p className="text-sm text-green-700 mt-1">Środki są zabezpieczone w escrow. Wykonawca może rozpocząć realizację.</p>
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Przejdź do zlecenia
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


