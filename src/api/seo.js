/**
 * Frontend API client for the Helpfli SEO Engine (AI Poradniki).
 * All endpoints under /api/seo. Public reads + admin writes (Bearer token).
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

// -------- public --------

export async function fetchSeoArticles({ page = 1, limit = 12, category = '', q = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (category) params.set('category', category);
  if (q) params.set('q', q);
  const res = await fetch(apiUrl(`/api/seo/articles?${params.toString()}`));
  return jsonOrThrow(res);
}

export async function fetchSeoArticle(slug) {
  const res = await fetch(apiUrl(`/api/seo/article/${encodeURIComponent(slug)}`));
  return jsonOrThrow(res);
}

export async function fetchSeoCategories() {
  const res = await fetch(apiUrl('/api/seo/categories'));
  return jsonOrThrow(res);
}

export async function fetchSeoStats({ service, city, cityName } = {}) {
  const params = new URLSearchParams();
  if (service) params.set('service', service);
  if (city) params.set('city', city);
  if (cityName) params.set('cityName', cityName);
  const res = await fetch(apiUrl(`/api/seo/stats?${params.toString()}`));
  return jsonOrThrow(res);
}

export async function fetchSeoCities() {
  const res = await fetch(apiUrl('/api/seo/cities'));
  return jsonOrThrow(res);
}

// ===== PSEO – landing pages miasto×usługa =====

export async function fetchSeoLocalPage(serviceSlug, citySlug) {
  const res = await fetch(
    apiUrl(`/api/seo/local/${encodeURIComponent(serviceSlug)}/${encodeURIComponent(citySlug)}`)
  );
  return jsonOrThrow(res);
}

export async function fetchSeoLocalList({ page = 1, limit = 30, service = '', city = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (service) params.set('service', service);
  if (city) params.set('city', city);
  const res = await fetch(apiUrl(`/api/seo/local?${params.toString()}`));
  return jsonOrThrow(res);
}

export async function adminRebuildLocalPage({ service, city, force = false } = {}) {
  const res = await fetch(apiUrl('/api/seo/admin/local/rebuild'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ service, city, force })
  });
  return jsonOrThrow(res);
}

export async function adminBulkBuildLocalPages({ services, cities, force = false } = {}) {
  const res = await fetch(apiUrl('/api/seo/admin/local/bulk-build'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ services, cities, force })
  });
  return jsonOrThrow(res);
}

export async function adminListLocalPages({ page = 1, limit = 50, service = '', city = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (service) params.set('service', service);
  if (city) params.set('city', city);
  const res = await fetch(apiUrl(`/api/seo/admin/local?${params.toString()}`), {
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}

export async function adminDeleteLocalPage(id) {
  const res = await fetch(apiUrl(`/api/seo/admin/local/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}

// -------- admin --------

export async function adminListSeoArticles({ page = 1, limit = 30, q = '', category = '', published } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (published === true || published === false) params.set('published', String(published));
  const res = await fetch(apiUrl(`/api/seo/admin/articles?${params.toString()}`), {
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}

export async function adminGetSeoArticle(id) {
  const res = await fetch(apiUrl(`/api/seo/admin/articles/${id}`), {
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}

export async function adminGenerateArticle({ topic, hints, publish = false } = {}) {
  const res = await fetch(apiUrl('/api/seo/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ topic, hints, publish })
  });
  return jsonOrThrow(res);
}

export async function adminGenerateBulk({ topics, publish = false } = {}) {
  const res = await fetch(apiUrl('/api/seo/generate-bulk'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ topics, publish })
  });
  return jsonOrThrow(res);
}

export async function adminGenerateSeed({ count = 10, publish = false } = {}) {
  const res = await fetch(apiUrl('/api/seo/generate-seed'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ count, publish })
  });
  return jsonOrThrow(res);
}

export async function adminUpdateArticle(id, patch) {
  const res = await fetch(apiUrl(`/api/seo/admin/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(patch)
  });
  return jsonOrThrow(res);
}

export async function adminDeleteArticle(id) {
  const res = await fetch(apiUrl(`/api/seo/admin/${id}`), {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}

export async function adminListSeoTopics() {
  const res = await fetch(apiUrl('/api/seo/topics'), {
    headers: { ...getAuthHeader() }
  });
  return jsonOrThrow(res);
}
