import { api } from './client';

/** Brak fałszywego „1000 miejsc” — UI pokazuje komunikat o niedostępności licznika. */
const FALLBACK_STATUS = {
  limit: null,
  used: null,
  remaining: null,
  enabled: false,
  unavailable: true,
  fallback: true,
};

export async function getFoundingProviderStatus() {
  try {
    return await api('/api/growth/founding-provider-status');
  } catch {
    return FALLBACK_STATUS;
  }
}

export async function activateFoundingProvider() {
  return api('/api/growth/activate-founding-provider', { method: 'POST' });
}

export async function getGrowthMe() {
  return api('/api/growth/me');
}
