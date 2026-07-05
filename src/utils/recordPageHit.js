import { apiUrl } from '@/lib/apiUrl';

const SESSION_KEY = 'qs_site_visit_recorded';
let recordedInMemory = false;

function hasRecordedVisitThisSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return recordedInMemory;
  }
}

function markVisitRecordedThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    recordedInMemory = true;
  }
}

/**
 * Anonimowy licznik wejść (1× na sesję, dzienne sumy per landing).
 * Wywoływany tylko po zgodzie na cookies analityczne (TelemetryRouteListener).
 */
export function recordPageHit(path) {
  if (typeof window === 'undefined') return;
  if (hasRecordedVisitThisSession()) return;

  const pathname =
    typeof path === 'string' && path
      ? path.split('?')[0]
      : window.location.pathname || '/';

  markVisitRecordedThisSession();

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
