// API helpers dla zarządzania partnerami API (admin)
const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ========== ZARZĄDZANIE PARTNERAMI (ADMIN) ==========

export async function createPartner(data) {
  const res = await fetch(`${API_URL}/api/admin/partners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia partnera');
  }
  return res.json();
}

export async function getPartners() {
  const res = await fetch(`${API_URL}/api/admin/partners`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania partnerów');
  return res.json();
}

export async function getPartner(partnerId) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania partnera');
  return res.json();
}

export async function updatePartner(partnerId, data) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji partnera');
  return res.json();
}

export async function regenerateApiKey(partnerId) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}/regenerate-key`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd regeneracji API Key');
  return res.json();
}

export async function deletePartner(partnerId) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd usuwania partnera');
  return res.json();
}

// ========== WEBHOOKI ==========

export async function createWebhook(partnerId, data) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}/webhooks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia webhooka');
  }
  return res.json();
}

export async function getWebhooks(partnerId) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}/webhooks`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania webhooków');
  return res.json();
}

export async function updateWebhook(partnerId, webhookId, data) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}/webhooks/${webhookId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji webhooka');
  return res.json();
}

export async function deleteWebhook(partnerId, webhookId) {
  const res = await fetch(`${API_URL}/api/admin/partners/${partnerId}/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd usuwania webhooka');
  return res.json();
}













