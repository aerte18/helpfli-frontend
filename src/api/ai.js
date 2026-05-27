import { apiUrl } from "@/lib/apiUrl";
import { buildAiAuthHeaders } from "@/utils/guestAi";

// src/api/ai.js
export async function postConcierge({ token, problemText, location }) {
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : buildAiAuthHeaders();
  const res = await fetch(apiUrl("/api/ai/concierge/v2"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: problemText }],
      userContext: location
        ? { location: { text: location.city, lat: location.lat, lng: location.lng } }
        : {},
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || "Błąd AI Concierge");
    err.code = data.code;
    err.requiresAuth = data.requiresAuth;
    err.usage = data.usage;
    throw err;
  }
  if (data.result || data.reply) {
    const result = data.result || {};
    const agents = data.agents || {};
    return {
      ...data,
      serviceCandidate: data.serviceCandidate || (result.detectedService
        ? { code: result.detectedService, name: result.detectedService }
        : null),
      urgency: data.urgency || result.urgency,
      dangerFlags: result.safety?.flag ? [result.safety.reason] : [],
      diySteps: agents.diy?.steps || result.diySteps || [],
      priceHints: agents.pricing || null,
      location: result.extracted?.location,
      reply: data.reply || result.reply,
      guestUsage: data.guestUsage,
    };
  }
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
  const res = await fetch(apiUrl(`/api/search?${qs.toString()}`), {
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
  const res = await fetch(apiUrl(`/api/ai/pricing?${qs.toString()}`), {
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
  const res = await fetch(apiUrl("/api/ai/triage"), {
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

