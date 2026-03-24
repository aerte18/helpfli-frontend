// API helpers dla integracji z systemami księgowymi
const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function createAccountingIntegration(data) {
  const res = await fetch(`${API_URL}/api/accounting/integrations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia integracji księgowej');
  }
  return res.json();
}

export async function getAccountingIntegrations(companyId = null) {
  const url = companyId 
    ? `${API_URL}/api/accounting/integrations?companyId=${companyId}`
    : `${API_URL}/api/accounting/integrations`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania integracji');
  return res.json();
}

export async function getAccountingIntegration(integrationId) {
  const res = await fetch(`${API_URL}/api/accounting/integrations/${integrationId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania integracji');
  return res.json();
}

export async function updateAccountingIntegration(integrationId, data) {
  const res = await fetch(`${API_URL}/api/accounting/integrations/${integrationId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji integracji');
  return res.json();
}

export async function activateAccountingIntegration(integrationId) {
  const res = await fetch(`${API_URL}/api/accounting/integrations/${integrationId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd aktywacji integracji');
  return res.json();
}

export async function syncInvoice(integrationId, paymentId) {
  const res = await fetch(`${API_URL}/api/accounting/integrations/${integrationId}/sync/${paymentId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd synchronizacji faktury');
  }
  return res.json();
}

export async function exportInvoices(integrationId, format = 'csv', params = {}) {
  const queryParams = new URLSearchParams({ format });
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);
  
  const res = await fetch(`${API_URL}/api/accounting/integrations/${integrationId}/export?${queryParams}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd eksportu faktur');
  
  if (format === 'csv' || format === 'xml') {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${Date.now()}.${format}`;
    a.click();
    return { success: true };
  }
  
  return res.json();
}

export async function deleteAccountingIntegration(integrationId) {
  const res = await fetch(`${API_URL}/api/accounting/integrations/${integrationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd usuwania integracji');
  return res.json();
}













