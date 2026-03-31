const CONSENT_KEY = "qs_consent_v1";

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return { analytics: false, cookies: false, marketing: false, updatedAt: null };
    const parsed = JSON.parse(raw);
    return {
      analytics: !!parsed.analytics,
      cookies: !!parsed.cookies,
      marketing: !!parsed.marketing,
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { analytics: false, cookies: false, marketing: false, updatedAt: null };
  }
}

export function setConsent(next) {
  const value = {
    analytics: !!next.analytics,
    cookies: !!next.cookies,
    marketing: !!next.marketing,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("qs-consent-changed", { detail: value }));
  } catch {}
  return value;
}

export function hasAnalyticsConsent() {
  const c = getConsent();
  return c.analytics && c.cookies;
}

export function hasAnsweredConsent() {
  return !!getConsent().updatedAt;
}
