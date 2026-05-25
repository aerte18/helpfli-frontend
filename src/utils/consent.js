/**
 * Centralny moduł zgód użytkownika (RODO).
 *
 * Kategorie:
 *  - necessary  — zawsze włączone (sesja, JWT, koszyk, security). Brak możliwości wyłączenia.
 *  - preferences — UI (motyw, język, ostatnio wybrane filtry).
 *  - analytics  — Web Vitals, Sentry breadcrumbs, telemetria odsłon.
 *  - marketing  — remarketing, banery sponsorów, OneSignal targeting.
 *
 * Pełna decyzja zapisywana jako qs_consent_v2 (z migracją z v1).
 * Po każdej zmianie emitujemy `qs-consent-changed`, żeby pozostałe moduły
 * (Sentry, OneSignal, web-vitals) mogły się dynamicznie włączyć/wyłączyć.
 */

const CONSENT_KEY = "qs_consent_v2";
const LEGACY_CONSENT_KEY = "qs_consent_v1";

const DEFAULT_CONSENT = Object.freeze({
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  updatedAt: null,
  version: 2,
});

function normalizeConsent(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CONSENT };
  return {
    necessary: true,
    preferences: !!raw.preferences,
    analytics: !!raw.analytics,
    marketing: !!raw.marketing,
    updatedAt: raw.updatedAt || null,
    version: 2,
  };
}

function readRaw() {
  try {
    const v2 = localStorage.getItem(CONSENT_KEY);
    if (v2) return JSON.parse(v2);

    const v1 = localStorage.getItem(LEGACY_CONSENT_KEY);
    if (v1) {
      const parsed = JSON.parse(v1);
      return {
        preferences: false,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
        updatedAt: parsed.updatedAt || null,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function getConsent() {
  return normalizeConsent(readRaw());
}

export function setConsent(next) {
  const value = normalizeConsent({ ...next, updatedAt: new Date().toISOString() });
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
    localStorage.removeItem(LEGACY_CONSENT_KEY);
  } catch {
    /* ignore quota */
  }
  try {
    window.dispatchEvent(new CustomEvent("qs-consent-changed", { detail: value }));
  } catch {
    /* SSR */
  }
  return value;
}

export function acceptAllConsent() {
  return setConsent({ preferences: true, analytics: true, marketing: true });
}

export function rejectAllConsent() {
  return setConsent({ preferences: false, analytics: false, marketing: false });
}

export function hasAnsweredConsent() {
  return !!getConsent().updatedAt;
}

export function hasAnalyticsConsent() {
  return getConsent().analytics === true;
}

export function hasMarketingConsent() {
  return getConsent().marketing === true;
}

export function hasPreferencesConsent() {
  return getConsent().preferences === true;
}

/**
 * Programowe otwarcie modalu ustawień prywatności (np. z Footera).
 * PermissionQueueManager nasłuchuje tego eventu.
 */
export function openPrivacySettings() {
  try {
    window.dispatchEvent(new CustomEvent("qs-open-privacy-settings"));
  } catch {
    /* SSR */
  }
}
