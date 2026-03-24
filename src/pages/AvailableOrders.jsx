import { useEffect, useState } from "react";
import SponsorAdBanner from "../components/SponsorAdBanner";

function AvailableOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("/api/orders/available", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAccept = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Nie udało się przyjąć zlecenia");

      // Odśwież listę zleceń
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      alert("Zlecenie przyjęte!");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-center text-white mt-10">Ładowanie dostępnych zleceń...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 text-black bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Dostępne zlecenia</h2>
      {orders.length === 0 ? (
        <p>Brak dostępnych zleceń.</p>
      ) : (
        orders.map((order, index) => (
          <div key={order._id}>
            {/* Reklama co 3 zlecenia */}
            {index > 0 && index % 3 === 0 && (
              <div className="mb-4">
                <SponsorAdBanner
                  position="between-items"
                  page="available_orders"
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
            <div className={`border p-4 mb-4 rounded ${order.priority === 'priority' ? 'border-blue-300 bg-blue-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <p><strong>Usługa:</strong> {order.service}</p>
              {order.priority === 'priority' && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
                  ⚡ PRIORYTET
                </span>
              )}
            </div>
            <p><strong>Opis:</strong> {order.description}</p>
            <p><strong>Adres:</strong> {order.location}</p>
            <p><strong>Status:</strong> {order.status}</p>
            {order.priority === 'priority' && (
              <div className="text-sm text-blue-600 mt-1">
                <p>💰 Dopłata za priorytet: {(order.priorityFee / 100).toFixed(2)} zł</p>
                {order.priorityInfo?.requestedDateTime && (
                  <p>📅 Żądana data: {order.priorityInfo.requestedDateTime}</p>
                )}
              </div>
            )}
            <button
              onClick={() => handleAccept(order._id)}
              className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Przyjmij zlecenie
            </button>
          </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AvailableOrders;