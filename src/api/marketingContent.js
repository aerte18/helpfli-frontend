/**
 * Frontend API client dla panelu Marketing Automation (/admin/content).
 * Endpointy backendu: /api/admin/content (tylko admin/superadmin).
 */
import { apiUrl } from '@/lib/apiUrl';

function getAuthHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function jsonOrThrow(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Lista treści (z paginacją i filtrami).
 * @param {Object} params { page, limit, status, category, platform, contentType, q }
 */
export async function listMarketingContent(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    usp.set(k, String(v));
  });
  const qs = usp.toString();
  const res = await fetch(apiUrl(`/api/admin/content${qs ? `?${qs}` : ''}`), {
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}

/**
 * Wygeneruj nową treść AI.
 * @param {Object} payload { category, contentType, platform, topic, extra? }
 */
export async function generateMarketingContent(payload) {
  const res = await fetch(apiUrl('/api/admin/content/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  return jsonOrThrow(res);
}

/**
 * Aktualizacja pól treści (status, content, hook, cta, hashtags...).
 */
export async function updateMarketingContent(id, patch) {
  const res = await fetch(apiUrl(`/api/admin/content/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(patch)
  });
  return jsonOrThrow(res);
}

export async function deleteMarketingContent(id) {
  const res = await fetch(apiUrl(`/api/admin/content/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}
