// src/api/ai.js
export async function postConcierge({ token, problemText, location }) {
  const res = await fetch("/api/ai/concierge/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ description: problemText, location }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd AI Concierge");
  return data;
}

export async function searchProviders({ service, city, lat, lng, limit = 3, token, verifiedOnly = false }) {
  // Zakładam, że masz już /api/search obsługujące filtr po service i lokalizacji
  const qs = new URLSearchParams({
    service: service || "",
    city: city || "",
    lat: lat ? String(lat) : "",
    lng: lng ? String(lng) : "",
    limit: String(limit),
    verifiedOnly: String(verifiedOnly),
  });
  const res = await fetch(`/api/search?${qs.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd wyszukiwania wykonawców");
  return data?.providers || data?.results || [];
}

export async function getPricing({ token, service, city, lat, lng, urgency = "normal" }) {
  const qs = new URLSearchParams({
    service: service || "",
    city: city || "",
    ...(lat != null ? { lat: String(lat) } : {}),
    ...(lng != null ? { lng: String(lng) } : {}),
    urgency,
  });
  const res = await fetch(`/api/ai/pricing?${qs.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd pobierania widełek cen");
  return data;
}

// MVP: AI Triage endpoint
export async function postTriage({ token, description, location, service }) {
  const res = await fetch("/api/ai/triage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ description, location, service }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Błąd AI Triage");
  return data;
}

