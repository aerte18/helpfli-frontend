import { apiUrl } from "@/lib/apiUrl";

const STORAGE_KEY = "quicksy_guest_id";

export function getOrCreateGuestId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (id && /^guest_[a-zA-Z0-9_-]{8,80}$/.test(id)) return id;
    const uuid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    id = `guest_${uuid}`;
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** Nagłówki do AI Concierge: JWT lub identyfikator gościa */
export function buildAiAuthHeaders() {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return { "X-Guest-Id": getOrCreateGuestId() };
}

export function isGuestAiSession() {
  return !localStorage.getItem("token");
}

export async function fetchGuestAiUsage() {
  const guestId = getOrCreateGuestId();
  const res = await fetch(apiUrl("/api/ai/concierge/guest-usage"), {
    headers: { "X-Guest-Id": guestId },
  });
  const data = await res.json().catch(() => ({}));
  if (data?.usage) return data.usage;
  return null;
}

export function guestSignupPath() {
  const next = encodeURIComponent(
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/"
  );
  return `/register?next=${next}`;
}
