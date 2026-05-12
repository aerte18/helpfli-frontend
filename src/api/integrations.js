// API helpers dla integracji zewnętrznych
import { apiUrl } from "@/lib/apiUrl";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ========== CALENDAR INTEGRATIONS ==========

export async function getCalendarAuthUrl(provider, redirectUri) {
  const params = new URLSearchParams();
  if (redirectUri) params.set('redirectUri', redirectUri);

  const res = await fetch(apiUrl(`/api/integrations/calendar/${provider}/auth-url?${params.toString()}`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd generowania linku autoryzacji');
  }
  return res.json();
}

export async function connectCalendar(provider, code, redirectUri) {
  const res = await fetch(apiUrl(`/api/integrations/calendar/${provider}/callback`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd łączenia kalendarza');
  }
  return res.json();
}

export async function getCalendarIntegrations() {
  const res = await fetch(apiUrl('/api/integrations/calendar'), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania integracji');
  return res.json();
}

export async function disconnectCalendar(integrationId) {
  const res = await fetch(apiUrl(`/api/integrations/calendar/${integrationId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd rozłączania kalendarza');
  return res.json();
}

export async function syncCalendar(integrationId) {
  const res = await fetch(apiUrl(`/api/integrations/calendar/${integrationId}/sync`), {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd synchronizacji');
  return res.json();
}

// ========== PAYMENT INTEGRATIONS ==========

export async function getPaymentMethods() {
  const res = await fetch(apiUrl('/api/integrations/payments/methods'), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania metod płatności');
  return res.json();
}

export async function setDefaultPaymentMethod(method) {
  const res = await fetch(apiUrl('/api/integrations/payments/default'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ method }),
  });
  if (!res.ok) throw new Error('Błąd ustawiania metody płatności');
  return res.json();
}













