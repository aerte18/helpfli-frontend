// API helpers dla zaawansowanych funkcji AI
const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * POST /api/ai/advanced/pricing-advice
 * Zaawansowane sugestie cenowe z AI
 */
export async function getPricingAdvice(orderId, proposedAmount, orderDescription = '') {
  const res = await fetch(`${API_URL}/api/ai/advanced/pricing-advice`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      orderId,
      proposedAmount: Number(proposedAmount),
      orderDescription
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd pobierania porady cenowej');
  }
  return res.json();
}

/**
 * POST /api/ai/advanced/offer-chat
 * AI chat dla wykonawców - pomoc w tworzeniu ofert
 */
export async function sendOfferChatMessage(orderId, message, conversationHistory = []) {
  const res = await fetch(`${API_URL}/api/ai/advanced/offer-chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      orderId,
      message,
      conversationHistory
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd wysyłania wiadomości');
  }
  return res.json();
}

/**
 * GET /api/ai/advanced/order-tags/:orderId
 * Pobierz automatyczne tagi zlecenia
 */
export async function getOrderTags(orderId) {
  const res = await fetch(`${API_URL}/api/ai/advanced/order-tags/${orderId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania tagów');
  return res.json();
}

/**
 * GET /api/ai/advanced/order-prediction/:orderId
 * Pobierz predykcję sukcesu zlecenia
 */
export async function getOrderPrediction(orderId) {
  const res = await fetch(`${API_URL}/api/ai/advanced/order-prediction/${orderId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania predykcji');
  return res.json();
}













