/** Canonical production origin for Helpfli SEO tags. */
export const SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' && window.__HELPFLI_SITE_URL__) ||
  'https://helpfli.pl'
).replace(/\/$/, '');

export function absoluteUrl(path = '/') {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
