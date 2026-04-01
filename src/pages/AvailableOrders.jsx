import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import SponsorAdBanner from "../components/SponsorAdBanner";
import { useAuth } from "../context/AuthContext";

function asText(v, fallback = "") {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    if (typeof v.name_pl === "string") return v.name_pl;
    if (typeof v.name === "string") return v.name;
    if (typeof v.label === "string") return v.label;
  }
  return fallback;
}

function AvailableOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const token = localStorage.getItem("token");

  const isProviderRole = useMemo(
    () =>
      !!user &&
      ["provider", "company_owner", "company_manager"].includes(user.role),
    [user]
  );

  useEffect(() => {
    if (authLoading) return;
    if (isProviderRole) {
      setLoadingOrders(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/orders/open"), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const list = Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data)
            ? data
            : [];
        setOrders(list);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isProviderRole, token]);

  const handleAccept = async (orderId) => {
    try {
      const res = await fetch(apiUrl(`/api/orders/${orderId}/accept`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Nie udało się przyjąć zlecenia");

      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      alert("Zlecenie przyjęte!");
    } catch (err) {
      alert(err.message);
    }
  };

  if (authLoading) {
    return <p className="text-center text-slate-600 mt-10 px-4">Ładowanie…</p>;
  }

  if (isProviderRole) {
    return <Navigate to="/provider-home" replace />;
  }

  if (loadingOrders) {
    return (
      <p className="text-center text-slate-600 mt-10 px-4">Ładowanie dostępnych zleceń…</p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 text-black bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Dostępne zlecenia</h2>
      {orders.length === 0 ? (
        <p>Brak dostępnych zleceń.</p>
      ) : (
        orders.map((order, index) => (
          <div key={order._id || index}>
            {index > 0 && index % 3 === 0 && (
              <div className="mb-4">
                <SponsorAdBanner
                  position="between-items"
                  page="available_orders"
                  context={{
                    keywords: order.description
                      ? String(order.description).toLowerCase().split(/\s+/)
                      : [],
                    serviceCategory: order.service,
                    orderType: order.status,
                  }}
                  limit={1}
                />
              </div>
            )}
            <div
              className={`border p-4 mb-4 rounded ${
                order.priority === "priority" ? "border-blue-300 bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <p>
                  <strong>Usługa:</strong> {asText(order.service, "—")}
                </p>
                {order.priority === "priority" && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    ⚡ PRIORYTET
                  </span>
                )}
              </div>
              <p>
                <strong>Opis:</strong> {asText(order.description, "—")}
              </p>
              <p>
                <strong>Adres:</strong> {asText(order.location, "—")}
              </p>
              <p>
                <strong>Status:</strong> {asText(order.status, "—")}
              </p>
              {order.priority === "priority" && order.priorityFee != null && (
                <div className="text-sm text-blue-600 mt-1">
                  <p>
                    💰 Dopłata za priorytet: {(Number(order.priorityFee) / 100).toFixed(2)} zł
                  </p>
                  {order.priorityInfo?.requestedDateTime && (
                    <p>📅 Żądana data: {String(order.priorityInfo.requestedDateTime)}</p>
                  )}
                </div>
              )}
              <button
                type="button"
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
