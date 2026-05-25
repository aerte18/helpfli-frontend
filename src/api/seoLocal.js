/**
 * SEO Local API client (frontend).
 * Wszystko publiczne (Google ma to crawlować), brak auth.
 */
import { apiUrl } from '@/lib/apiUrl';

async function jsonOrThrow(res) {
  let data = null;
  try { data = await res.json(); } catch { /* */ }
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchSeoLocalPage(serviceSlug, citySlug, districtSlug = null) {
  const path = districtSlug
    ? `/api/seo/local/${encodeURIComponent(serviceSlug)}/${encodeURIComponent(citySlug)}/${encodeURIComponent(districtSlug)}`
    : `/api/seo/local/${encodeURIComponent(serviceSlug)}/${encodeURIComponent(citySlug)}`;
  const res = await fetch(apiUrl(path));
  return jsonOrThrow(res);
}

export async function fetchSeoLocalDistricts(citySlug) {
  const res = await fetch(apiUrl(`/api/seo/local/districts/${encodeURIComponent(citySlug)}`));
  return jsonOrThrow(res);
}

export async function fetchSeoLocalServices() {
  const res = await fetch(apiUrl('/api/seo/local/services'));
  return jsonOrThrow(res);
}

export async function fetchSeoLocalCities() {
  const res = await fetch(apiUrl('/api/seo/local/cities'));
  return jsonOrThrow(res);
}

export async function fetchSeoLocalCity(citySlug) {
  const res = await fetch(apiUrl(`/api/seo/local/city/${encodeURIComponent(citySlug)}`));
  return jsonOrThrow(res);
}

export async function fetchSeoLocalIndex() {
  const res = await fetch(apiUrl('/api/seo/local/index'));
  return jsonOrThrow(res);
}
