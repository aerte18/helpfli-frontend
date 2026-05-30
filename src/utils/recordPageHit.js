import { apiUrl } from '@/lib/apiUrl';

/**
 * Anonimowy licznik wejść (dzienne sumy per ścieżka, bez IP).
 * Działa bez zgody na cookies analityczne — uzupełnia telemetrię page_view.
 */
export function recordPageHit(path) {
  if (typeof window === 'undefined') return;
  const pathname =
    typeof path === 'string' && path
      ? path.split('?')[0]
      : window.location.pathname || '/';
  try {
    fetch(apiUrl('/api/telemetry/public/page-hit'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      keepalive: true
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
