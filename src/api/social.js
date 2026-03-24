// API helpers dla funkcji społecznościowych
const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ========== PORTFOLIO ==========

export async function uploadPortfolioImages(files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/social/portfolio/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd przesyłania zdjęć');
  }
  return res.json();
}

export async function createPortfolioItem(data) {
  const res = await fetch(`${API_URL}/api/social/portfolio`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia portfolio');
  }
  return res.json();
}

export async function getPortfolio(providerId) {
  const res = await fetch(`${API_URL}/api/social/portfolio/${providerId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania portfolio');
  return res.json();
}

export async function getMyPortfolio() {
  const res = await fetch(`${API_URL}/api/social/portfolio/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania portfolio');
  return res.json();
}

export async function updatePortfolioItem(itemId, data) {
  const res = await fetch(`${API_URL}/api/social/portfolio/${itemId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji portfolio');
  return res.json();
}

export async function deletePortfolioItem(itemId) {
  const res = await fetch(`${API_URL}/api/social/portfolio/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd usuwania portfolio');
  return res.json();
}

export async function likePortfolioItem(itemId) {
  const res = await fetch(`${API_URL}/api/social/portfolio/${itemId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd polubienia');
  return res.json();
}

// ========== REFERRALS ==========

export async function getMyReferralCode() {
  const res = await fetch(`${API_URL}/api/social/referrals/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania kodu polecającego');
  return res.json();
}

export async function getReferralStats() {
  const res = await fetch(`${API_URL}/api/social/referrals/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania statystyk');
  return res.json();
}

export async function getReferralHistory() {
  const res = await fetch(`${API_URL}/api/social/referrals/history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania historii');
  return res.json();
}

// ========== RATINGS (rozszerzone) ==========

export async function createRating(data) {
  const res = await fetch(`${API_URL}/api/social/ratings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia oceny');
  }
  return res.json();
}

export async function getRatings(userId) {
  const res = await fetch(`${API_URL}/api/social/ratings/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania ocen');
  return res.json();
}

export async function markRatingHelpful(ratingId) {
  const res = await fetch(`${API_URL}/api/social/ratings/${ratingId}/helpful`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd oznaczenia jako pomocne');
  return res.json();
}

export async function replyToRating(ratingId, reply) {
  const res = await fetch(`${API_URL}/api/social/ratings/${ratingId}/reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) throw new Error('Błąd dodawania odpowiedzi');
  return res.json();
}













