import { apiUrl } from "@/lib/apiUrl";
// src/api/changeRequests.js

export async function createChangeRequest({ token, orderId, payload }) {
  const res = await fetch(apiUrl(`/api/change-requests/orders/${orderId}/change-request`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd tworzenia propozycji dopłaty");
  return data;
}

export async function acceptChangeRequest({ token, changeRequestId, message }) {
  const res = await fetch(apiUrl(`/api/change-requests/${changeRequestId}/accept`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message: message || "" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd akceptacji dopłaty");
  return data;
}

export async function rejectChangeRequest({ token, changeRequestId, message }) {
  const res = await fetch(apiUrl(`/api/change-requests/${changeRequestId}/reject`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message: message || "" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd odrzucenia dopłaty");
  return data;
}

export async function getChangeRequests({ token, orderId }) {
  const res = await fetch(apiUrl(`/api/change-requests/order/${orderId}`), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // Brak zlecenia / brak uprawnień / endpoint niedostępny — pusta lista bez szumu w konsoli
  if (res.status === 404 || res.status === 403) {
    return [];
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Błąd pobierania dopłat");
  return data.changeRequests || [];
}

