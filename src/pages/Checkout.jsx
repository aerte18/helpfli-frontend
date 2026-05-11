import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import GuaranteeBanner from "../components/GuaranteeBanner";
import CheckoutButton from "../payment/CheckoutButton";
import StripeProvider from "../payment/StripeProvider";
import CheckoutPage from "../payment/CheckoutPage";
import { apiUrl } from "@/lib/apiUrl";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiGet = async (path) => {
  const res = await fetch(apiUrl(path), { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `GET ${path} failed`);
  return data;
};

const apiPost = async (path, body) => {
  const res = await fetch(apiUrl(path), { method: "POST", headers: authHeaders(), body: JSON.stringify(body || {}) });
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
  const checkoutKind = searchParams.get('kind'); // commission = tylko opłata serwisowa (poza systemem)
  const showMobilePayBar = order?.status === 'accepted' && paymentMethod === 'system' && !paymentIntentId;

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
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-5">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4">
          <div className="qs-skeleton h-7 w-48 rounded mb-4" />
          <div className="qs-skeleton h-4 w-full rounded mb-2" />
          <div className="qs-skeleton h-4 w-2/3 rounded mb-6" />
          <div className="qs-skeleton h-28 w-full rounded-xl" />
        </div>
        <p className="text-sm text-gray-500 text-center">Ładowanie płatności…</p>
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
    const isCommissionOnly = checkoutKind === 'commission';
    const displayAmount = isCommissionOnly
      ? (order.pricing?.platformFee != null ? Number(order.pricing.platformFee) : null)
      : (order.pricing?.total != null ? Number(order.pricing.total) : null);
    return (
      <StripeProvider clientSecret={clientSecret}>
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-5">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4">
              <h1 className="text-2xl font-bold mb-2">
                {isCommissionOnly ? 'Opłata serwisowa Helpfli' : 'Płatność za zlecenie'}
              </h1>
              <p className="text-gray-600 mb-4">{order.service}</p>
              {displayAmount != null && !Number.isNaN(displayAmount) && (
                <p className="text-lg font-semibold text-indigo-600">
                  Do zapłaty: {displayAmount.toFixed(2)} {order.pricing?.currency || 'PLN'}
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <CheckoutPage />
            </div>
          </div>
        </div>
      </StripeProvider>
    );
  }

  // Jeśli nie mamy PaymentIntent - pokaż wybór metody płatności i przycisk do utworzenia
  return (
    <div className={`min-h-screen bg-gray-50 py-6 sm:py-8 ${showMobilePayBar ? "pb-28 sm:pb-8" : ""}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-5">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4">
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
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-600">Usługa:</span>
                <span className="font-medium break-words text-right">{order.service}</span>
              </div>
              {order.serviceDetails && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-600">Szczegóły:</span>
                  <span className="font-medium text-indigo-600 break-words text-right">{order.serviceDetails}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
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
                <div className="flex items-start justify-between gap-3 pt-2 border-t border-gray-200">
                  <span className="font-semibold text-lg">Do zapłaty:</span>
                  <span className="font-bold text-xl text-indigo-600">
                    {order.pricing.total} {order.pricing.currency || 'PLN'}
                  </span>
                </div>
              )}
              {order.pricing && (
                <div className="pt-2 border-t border-gray-200 space-y-1 text-xs text-gray-500">
                  {order.pricing.baseAmount && (
                    <div className="flex items-start justify-between gap-3">
                      <span>Cena wykonawcy:</span>
                      <span>{order.pricing.baseAmount} PLN</span>
                    </div>
                  )}
                  {order.pricing.platformFee > 0 && (
                    <div className="flex items-start justify-between gap-3">
                      <span>Prowizja platformy:</span>
                      <span>+{order.pricing.platformFee} PLN</span>
                    </div>
                  )}
                  {order.pricing.guaranteeFee > 0 && (
                    <div className="flex items-start justify-between gap-3">
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
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
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
            <div className="text-center" id="checkout-payment-cta">
              <CheckoutButton orderId={order._id} requestInvoiceDefault={order.requestInvoice} />
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
      {showMobilePayBar && (
        <div className="sm:hidden fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 px-4 animate-fade-in">
          <div className="rounded-xl border border-indigo-200 bg-white/95 qs-surface-sheet px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-gray-500">Do zapłaty</div>
              <div className="text-sm font-semibold text-indigo-700 truncate">
                {order?.pricing?.total ? `${order.pricing.total} ${order.pricing.currency || 'PLN'}` : "Sprawdź kwotę"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("checkout-payment-cta")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white qs-transition-soft qs-tap-target hover:bg-indigo-700"
            >
              Zapłać teraz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


