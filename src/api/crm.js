// API helpers dla integracji CRM
const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function createCrmIntegration(data) {
  const res = await fetch(`${API_URL}/api/crm/integrations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia integracji CRM');
  }
  return res.json();
}

export async function getCrmIntegrations(companyId = null) {
  const url = companyId 
    ? `${API_URL}/api/crm/integrations?companyId=${companyId}`
    : `${API_URL}/api/crm/integrations`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania integracji');
  return res.json();
}

export async function getCrmIntegration(integrationId) {
  const res = await fetch(`${API_URL}/api/crm/integrations/${integrationId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania integracji');
  return res.json();
}

export async function updateCrmIntegration(integrationId, data) {
  const res = await fetch(`${API_URL}/api/crm/integrations/${integrationId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji integracji');
  return res.json();
}

export async function activateCrmIntegration(integrationId) {
  const res = await fetch(`${API_URL}/api/crm/integrations/${integrationId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd aktywacji integracji');
  return res.json();
}

export async function syncOrderToCrm(integrationId, orderId) {
  const res = await fetch(`${API_URL}/api/crm/integrations/${integrationId}/sync/${orderId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd synchronizacji zlecenia');
  }
  return res.json();
}

export async function deleteCrmIntegration(integrationId) {
  const res = await fetch(`${API_URL}/api/crm/integrations/${integrationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd usuwania integracji');
  return res.json();
}













