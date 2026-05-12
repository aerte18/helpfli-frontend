import { apiUrl } from "@/lib/apiUrl";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getDisputeCase(orderId) {
  const res = await fetch(apiUrl(`/api/orders/${orderId}/dispute-case`), {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Nie udało się wczytać sprawy");
  return data;
}

export async function postDisputeMessage(orderId, body) {
  const res = await fetch(apiUrl(`/api/orders/${orderId}/dispute-case/message`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Nie udało się wysłać wiadomości");
  return data;
}

export async function postSettlementOffer(orderId, { amountPln, message }) {
  const res = await fetch(apiUrl(`/api/orders/${orderId}/dispute-case/settlement-offer`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ amountPln, message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Nie udało się wysłać propozycji");
  return data;
}

export async function postSettlementRespond(orderId, accept) {
  const res = await fetch(apiUrl(`/api/orders/${orderId}/dispute-case/settlement-respond`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ accept }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Nie udało się zapisać odpowiedzi");
  return data;
}

export async function postDisputeEscalate(orderId) {
  const res = await fetch(apiUrl(`/api/orders/${orderId}/dispute-case/escalate`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Nie udało się przekazać sprawy");
  return data;
}
