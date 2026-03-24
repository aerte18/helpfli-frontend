// API helpers dla white-label
const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function createWhiteLabel(data) {
  const res = await fetch(`${API_URL}/api/whitelabel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd tworzenia white-label');
  }
  return res.json();
}

export async function getWhiteLabels(companyId = null) {
  const url = companyId 
    ? `${API_URL}/api/whitelabel?companyId=${companyId}`
    : `${API_URL}/api/whitelabel`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania white-labelów');
  return res.json();
}

export async function getWhiteLabel(whitelabelId) {
  const res = await fetch(`${API_URL}/api/whitelabel/${whitelabelId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd pobierania white-label');
  return res.json();
}

export async function getWhiteLabelBySlug(slug) {
  const res = await fetch(`${API_URL}/api/whitelabel/slug/${slug}`);
  if (!res.ok) throw new Error('Błąd pobierania white-label');
  return res.json();
}

export async function getWhiteLabelByDomain(domain) {
  const res = await fetch(`${API_URL}/api/whitelabel/domain/${domain}`);
  if (!res.ok) throw new Error('Błąd pobierania white-label');
  return res.json();
}

export async function updateWhiteLabel(whitelabelId, data) {
  const res = await fetch(`${API_URL}/api/whitelabel/${whitelabelId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji white-label');
  return res.json();
}

export async function addDomain(whitelabelId, domain, isPrimary = false) {
  const res = await fetch(`${API_URL}/api/whitelabel/${whitelabelId}/domains`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ domain, isPrimary }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd dodawania domeny');
  }
  return res.json();
}

export async function verifyDomain(whitelabelId, domain) {
  const res = await fetch(`${API_URL}/api/whitelabel/${whitelabelId}/domains/${domain}/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Błąd weryfikacji domeny');
  }
  return res.json();
}

export async function getWhiteLabelCSS(whitelabelId) {
  const res = await fetch(`${API_URL}/api/whitelabel/${whitelabelId}/css`);
  if (!res.ok) throw new Error('Błąd pobierania CSS');
  return res.text();
}

export async function activateWhiteLabel(whitelabelId) {
  const res = await fetch(`${API_URL}/api/whitelabel/${whitelabelId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd aktywacji white-label');
  return res.json();
}

export async function deleteWhiteLabel(whitelabelId) {
  const res = await fetch(`${API_URL}/api/whitelabel/${whitelabelId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Błąd usuwania white-label');
  return res.json();
}













