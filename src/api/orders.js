import { apiUrl } from "@/lib/apiUrl";
// src/api/orders.js
export async function createOrder({ token, payload }) {
  const res = await fetch(apiUrl("/api/orders"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd tworzenia zlecenia");
  return data;
}

