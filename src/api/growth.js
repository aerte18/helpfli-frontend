import { api } from './client';

const FALLBACK_STATUS = {
  limit: 1000,
  used: 0,
  remaining: 1000,
  enabled: true,
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
