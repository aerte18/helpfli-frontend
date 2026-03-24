// src/utils/chatFlow.js
import { useChatStore } from "../store/chatStore";

export const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

export async function startQuoteFlow({ provider, token, navigate }) {
  // Sprawdź różne możliwe lokalizacje serviceId
  let serviceId = 
    provider?.topServiceId || 
    provider?.serviceId || 
    (provider?.services?.[0]?._id ? String(provider.services[0]._id) : null) ||
    (provider?.services?.[0] ? String(provider.services[0]) : null);

  if (!serviceId) {
    alert("Brak przypisanej usługi do wyceny.");
    return;
  }

  const res = await fetch("/api/orders/quote-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ providerId: provider._id || provider.id, serviceId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err?.error || "Nie udało się utworzyć draftu wyceny.");
    return;
  }

  const { orderId, created } = await res.json();

  if (isMobile()) {
    navigate(`/orders/${orderId}/chat?mode=quote${created ? "&prefill=1" : ""}`);
  } else {
    // desktop → drawer
    useChatStore.getState().open({
      orderId,
      mode: "quote",
      prefill: !!created,
      provider: { name: provider?.name, _id: provider?._id || provider?.id },
    });
  }
}