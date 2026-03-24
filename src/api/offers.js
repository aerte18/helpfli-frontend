export async function getOfferHint({ token, orderId }) {
  const res = await fetch(`/api/offers/hint?orderId=${encodeURIComponent(orderId)}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd pobierania widełek");
  return data;
}

export async function postOffer({ token, payload }) {
  const res = await fetch(`/api/offers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    // Jeśli backend zwróci dane upsell, przekaż je w błędzie jako JSON string
    if (data.upsell) {
      throw new Error(JSON.stringify(data));
    }
    throw new Error(data.message || "Błąd wysyłania oferty");
  }
  return data;
}

export async function boostOffer({ token, offerId, durationHours = 24 }) {
  const res = await fetch(`/api/offers/${offerId}/boost`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ durationHours }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Błąd boostowania oferty");
  return data;
}

export async function getOffersOfOrder({ token, orderId }) {
  const res = await fetch(`/api/offers/of-order?orderId=${encodeURIComponent(orderId)}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd pobierania ofert");
  return data.offers || [];
}

export async function acceptOffer({ token, offerId }) {
  const res = await fetch(`/api/offers/${offerId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Nie udało się zaakceptować oferty");
  return data;
}

export async function updateOffer({ token, offerId, payload }) {
  const res = await fetch(`/api/offers/${offerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Nie udało się zaktualizować oferty");
  return data;
}

export async function cancelOffer({ token, offerId }) {
  const res = await fetch(`/api/offers/${offerId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Nie udało się anulować oferty");
  return data;
}

export async function getMyOffer({ token, orderId }) {
  const res = await fetch(`/api/offers/my?orderId=${encodeURIComponent(orderId)}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd pobierania oferty");
  return data.offer;
}

// Pobierz wszystkie oferty providera
export async function getMyOffers({ token }) {
  const res = await fetch(`/api/offers/my`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd pobierania ofert");
  return data.offers || [];
}
