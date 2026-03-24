// API helpers dla integracji zewnętrznych
const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ========== CALENDAR INTEGRATIONS ==========

export async function connectCalendar(provider, code) {
  const res = await fetch(`${API_URL}/api/integrations/calendar/connect`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ provider, code }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd łączenia kalendarza');
  }
  return res.json();
}

export async function getCalendarIntegrations() {
  const res = await fetch(`${API_URL}/api/integrations/calendar`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania integracji');
  return res.json();
}

export async function disconnectCalendar(integrationId) {
  const res = await fetch(`${API_URL}/api/integrations/calendar/${integrationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd rozłączania kalendarza');
  return res.json();
}

export async function syncCalendar(integrationId) {
  const res = await fetch(`${API_URL}/api/integrations/calendar/${integrationId}/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd synchronizacji');
  return res.json();
}

// ========== PAYMENT INTEGRATIONS ==========

export async function getPaymentMethods() {
  const res = await fetch(`${API_URL}/api/integrations/payments/methods`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania metod płatności');
  return res.json();
}

export async function setDefaultPaymentMethod(method) {
  const res = await fetch(`${API_URL}/api/integrations/payments/default`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ method }),
  });
  if (!res.ok) throw new Error('Błąd ustawiania metody płatności');
  return res.json();
}













