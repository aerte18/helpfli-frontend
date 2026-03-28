import { apiUrl } from "@/lib/apiUrl";
import { useCallback, useEffect, useState } from "react";
import SponsorAdBanner from "../components/SponsorAdBanner";
import { Clock, AlertCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function clientIdOf(order) {
  const c = order?.client;
  if (c == null) return null;
  return typeof c === "object" && c._id != null ? String(c._id) : String(c);
}

/** Zgodnie z POST /api/orders/:id/cancel — tylko klient, przed akceptacją oferty / płatnością. */
function canClientCancelOrder(order, userId) {
  if (!userId || !order) return false;
  if (clientIdOf(order) !== String(userId)) return false;
  if (order.status === "cancelled") return false;
  if (!["open", "collecting_offers", "draft"].includes(order.status)) return false;
  if (order.paymentStatus === "succeeded" || order.paidInSystem) return false;
  if (order.acceptedOfferId) return false;
  return true;
}

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [extendingOrderId, setExtendingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const navigate = useNavigate();

  const refreshOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/orders/my?limit=50"), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Błąd pobierania zleceń");
      const list = Array.isArray(data?.orders)
        ? data.orders
        : data?.items ?? (Array.isArray(data) ? data : []);
      setOrders(list);
    } catch (err) {
      console.error("Błąd pobierania zleceń:", err);
    }
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const handleExtend = async (orderId, hours = 24) => {
    if (!confirm(`Czy na pewno chcesz wydłużyć czas zlecenia o ${hours} godzin?`)) {
      return;
    }

    setExtendingOrderId(orderId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/orders/${orderId}/extend`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ hours, reason: "Wydłużone przez klienta" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Błąd wydłużania zlecenia");

      await refreshOrders();

      alert(`✅ Czas zlecenia został wydłużony o ${hours} godzin`);
    } catch (err) {
      console.error("Błąd wydłużania zlecenia:", err);
      alert(`❌ Nie udało się wydłużyć zlecenia: ${err.message}`);
    } finally {
      setExtendingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (
      !confirm(
        "Czy na pewno chcesz anulować to zlecenie? Możliwe tylko zanim wybierzesz ofertę i opłacisz zlecenie — zniknie z aktywnych i wykonawcy zobaczą je jako odrzucone."
      )
    ) {
      return;
    }
    setCancellingOrderId(orderId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/orders/${orderId}/cancel`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Nie udało się anulować zlecenia");
      await refreshOrders();
      alert("✅ Zlecenie zostało anulowane");
    } catch (err) {
      console.error("Błąd anulowania zlecenia:", err);
      alert(`❌ ${err.message}`);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const formatTimeUntilExpiry = (order) => {
    if (!order.expiresAt) return null;
    
    if (order.isExpired) {
      return "Wygasło";
    }
    
    if (order.hoursUntilExpiry !== null) {
      if (order.hoursUntilExpiry > 24) {
        const days = Math.floor(order.hoursUntilExpiry / 24);
        const hours = order.hoursUntilExpiry % 24;
        return `${days}d ${hours}h`;
      }
      return `${order.hoursUntilExpiry}h ${order.minutesUntilExpiry || 0}m`;
    }
    
    return "Aktywne";
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Moje zlecenia</h2>
      <ul className="space-y-3">
        {orders.map((order, index) => (
          <li key={order._id}>
            <div className={`border p-4 rounded-lg ${
              order.isExpired ? 'bg-red-50 border-red-200' : 'bg-white'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-lg">Usługa: {order.service}</p>
                  {order.serviceDetails && (
                    <p className="text-indigo-700 font-medium mt-1">Doprecyzowanie: {order.serviceDetails}</p>
                  )}
                  <p className="text-gray-700 mt-2">Opis: {order.description}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Status: <span className="font-medium">{order.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Wykonawca: {order.provider?.name || "jeszcze nie wybrano"}
                  </p>
                </div>
                
                {/* Status wygaśnięcia */}
                {order.expiresAt && (order.status === 'open' || order.status === 'collecting_offers') && (
                  <div className={`ml-4 px-3 py-2 rounded-lg flex items-center gap-2 ${
                    order.isExpired 
                      ? 'bg-red-100 text-red-700' 
                      : order.hoursUntilExpiry !== null && order.hoursUntilExpiry < 6
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.isExpired ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {formatTimeUntilExpiry(order)}
                      {order.extendedCount > 0 && ` (${order.extendedCount}x)`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Nawigacja do szczegółów / ofert / czatu */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${order._id}?tab=details`)}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Szczegóły
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${order._id}?tab=chat`)}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Czat
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${order._id}?tab=offers`)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Oferty
                  {typeof order.offersCount === "number" ? ` (${order.offersCount})` : ""}
                </button>
                {user && canClientCancelOrder(order, user._id || user.id) && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={cancellingOrderId === order._id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-700 bg-white rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    {cancellingOrderId === order._id ? "…" : "Usuń zlecenie"}
                  </button>
                )}
              </div>

              {/* Przycisk wydłużenia dla aktywnych zleceń */}
              {order.expiresAt && (order.status === 'open' || order.status === 'collecting_offers') && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {order.isExpired ? "Zlecenie wygasło" : "Wydłuż czas zlecenia"}
                    </span>
                    <div className="flex gap-2">
                      {!order.isExpired && (
                        <>
                          <button
                            onClick={() => handleExtend(order._id, 24)}
                            disabled={extendingOrderId === order._id}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {extendingOrderId === order._id ? '...' : '+24h'}
                          </button>
                          <button
                            onClick={() => handleExtend(order._id, 72)}
                            disabled={extendingOrderId === order._id}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {extendingOrderId === order._id ? '...' : '+3d'}
                          </button>
                        </>
                      )}
                      {order.isExpired && (
                        <button
                          onClick={() => handleExtend(order._id, 24)}
                          disabled={extendingOrderId === order._id}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {extendingOrderId === order._id ? '...' : 'Przywróć (+24h)'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Reklama co 3 zlecenia */}
            {index > 0 && (index + 1) % 3 === 0 && (
              <div className="my-4">
                <SponsorAdBanner
                  position="between-items"
                  page="my_orders"
                  context={{
                    keywords: order.description
                      ? order.description.toLowerCase().split(/\s+/)
                      : [],
                    serviceCategory: order.service,
                    orderType: order.status,
                  }}
                  limit={1}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyOrders;