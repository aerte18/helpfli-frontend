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

import { apiUrl } from "@/lib/apiUrl";

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

export function setConsent(next, options = {}) {
  const { skipServerSync = false } = options;
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
  if (!skipServerSync) {
    syncConsentToServer(value);
  }
  return value;
}

/** Zapis zgód zalogowanego użytkownika na serwerze (User.consents). */
export async function syncConsentToServer(consent = getConsent()) {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(apiUrl("/api/privacy/consent"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        marketing: !!consent.marketing,
        analytics: !!consent.analytics,
        cookies: !!consent.analytics,
        preferences: !!consent.preferences,
      }),
    });
  } catch {
    /* offline / guest */
  }
}

/** Po logowaniu: nowsza wersja (local vs serwer) wygrywa; druga strona dostaje sync. */
export function mergeServerConsents(user) {
  if (!user?.consents && user?.marketingConsent == null) return;

  const local = getConsent();
  const serverTs = user.consents?.updatedAt
    ? new Date(user.consents.updatedAt).getTime()
    : 0;
  const localTs = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;

  if (serverTs > localTs) {
    setConsent(
      {
        preferences: !!user.consents?.preferences,
        analytics: !!user.consents?.analytics,
        marketing: !!user.marketingConsent,
      },
      { skipServerSync: true }
    );
  } else if (local.updatedAt && localTs >= serverTs) {
    syncConsentToServer(local);
  }
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
