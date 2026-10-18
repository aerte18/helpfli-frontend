import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/apiUrl';

const PROTECTED_UPLOAD_PATH = /^\/uploads\/(kyc|orders|chat|drafts|concierge|reports|platform)(?:\/|$)/i;

function protectedUploadRequestUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const resolved = new URL(apiUrl(rawUrl), window.location.origin);
    const apiOrigin = new URL(apiUrl('/'), window.location.origin).origin;
    if (resolved.origin !== apiOrigin) return null;
    return PROTECTED_UPLOAD_PATH.test(resolved.pathname) ? resolved.toString() : null;
  } catch {
    return null;
  }
}

export function useProtectedUploadUrl(rawUrl) {
  const [state, setState] = useState({ url: rawUrl || '', loading: false, error: null });

  useEffect(() => {
    let cancelled = false;
    let blobUrl = null;
    const protectedUrl = protectedUploadRequestUrl(rawUrl);

    if (!protectedUrl) {
      setState({ url: rawUrl ? apiUrl(rawUrl) : '', loading: false, error: null });
      return () => {};
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setState({ url: '', loading: false, error: 'Brak autoryzacji do pobrania pliku' });
      return () => {};
    }

    setState({ url: '', loading: true, error: null });
    fetch(protectedUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Nie udało się pobrać załącznika');
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        setState({ url: blobUrl, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ url: '', loading: false, error: error.message });
      });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [rawUrl]);

  return state;
}
