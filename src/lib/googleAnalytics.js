/**
 * Google Analytics 4 (gtag.js) + Google Consent Mode v2.
 *
 * Wzorzec: "default denied" → "update on consent".
 *  1. Przed załadowaniem skryptu wysyłamy gtag('consent', 'default', { ...denied })
 *     — Google wtedy działa w trybie modelowanym (bez cookies, anonimowe estymacje).
 *     To jest LEGAL bez zgody usera (potwierdzone przez Garante, CNIL, DSB).
 *  2. Po decyzji w naszym ConsentBanner wysyłamy gtag('consent', 'update', {...}),
 *     który aktywuje pełny tryb tylko gdy user zaakceptował konkretną kategorię.
 *  3. Listener na 'qs-consent-changed' aktualizuje stan przy każdej zmianie
 *     w Footerze → Ustawienia prywatności (RODO art. 7 ust. 3 — możliwość wycofania).
 *
 * Dokumentacja: https://developers.google.com/tag-platform/security/guides/consent
 */

import { getConsent } from "../utils/consent";

let initialized = false;

function pushDataLayer(...args) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  } catch {
    /* SSR / iframe sandbox */
  }
}

function gtag(...args) {
  pushDataLayer(...args);
}

function consentArgsFromState(consent) {
  return {
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    analytics_storage: consent.analytics ? "granted" : "denied",
    functionality_storage: consent.preferences ? "granted" : "denied",
    personalization_storage: consent.preferences ? "granted" : "denied",
    security_storage: "granted",
  };
}

function loadGtagScript(measurementId) {
  if (document.getElementById("ga4-gtag-js")) return;
  const s = document.createElement("script");
  s.id = "ga4-gtag-js";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(s);
}

export function initGoogleAnalytics() {
  if (initialized) return;
  const measurementId =
    typeof import.meta !== "undefined" && import.meta?.env?.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || measurementId === "off" || measurementId === "false") {
    return;
  }
  if (typeof window === "undefined" || typeof document === "undefined") return;

  initialized = true;

  // KROK 1: ustaw default DENIED dla wszystkich storage zanim cokolwiek się załaduje.
  // Bez tego GA4 zacznie zbierać dane "na surowo" i naruszamy RODO.
  // Wait for update bo nasz ConsentBanner może się jeszcze nie pojawił.
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });

  // KROK 2: jeśli user już wcześniej odpowiedział na cookies (revisit), zastosuj.
  const consent = getConsent();
  if (consent.updatedAt) {
    gtag("consent", "update", consentArgsFromState(consent));
  }

  // KROK 3: załaduj gtag.js i skonfiguruj measurement ID.
  loadGtagScript(measurementId);
  gtag("js", new Date());
  gtag("config", measurementId, {
    // anonymize_ip jest domyślnie ON w GA4, ale dodaję dla jasności
    anonymize_ip: true,
    // Nie wysyłaj page_view dopóki user nie zaakceptuje analityki —
    // pozwala uniknąć "pustego" page_view w trybie denied.
    send_page_view: consent.analytics === true,
  });

  // KROK 4: reaguj na każdą zmianę zgody (banner, modal preferencji, footer).
  window.addEventListener("qs-consent-changed", (event) => {
    const next = (event && event.detail) || getConsent();
    gtag("consent", "update", consentArgsFromState(next));
    if (next.analytics === true) {
      // User właśnie zaakceptował analitykę — wyślij brakujący page_view ręcznie.
      gtag("event", "page_view", {
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  });
}

/**
 * Wyślij page_view przy nawigacji SPA (po zgodzie na analitykę).
 */
export function trackGaPageView(path, title) {
  if (!initialized || !getConsent().analytics) return;
  const pagePath = String(path || "/").split("?")[0] || "/";
  gtag("event", "page_view", {
    page_path: pagePath,
    page_title: title || (typeof document !== "undefined" ? document.title : undefined),
    page_location:
      typeof window !== "undefined"
        ? `${window.location.origin}${path || pagePath}`
        : undefined,
  });
}

/** Mapowanie wewnętrznej telemetrii → zdarzenia GA4 */
const TELEMETRY_GA_MAP = {
  search: (p) => ({ search_term: p.query, result_count: p.resultCount }),
  provider_view: (p) => ({ provider_id: p.providerId, view_type: p.viewType }),
  provider_contact: (p) => ({ provider_id: p.providerId, contact_type: p.contactType }),
  provider_compare: (p) => ({ compare_count: p.compareCount }),
  quote_request: (p) => ({ provider_id: p.providerId, source: p.source }),
  order_form_start: (p) => ({ order_type: p.orderType }),
  order_form_success: (p) => ({ order_id: p.orderId }),
  order_created: (p) => ({ order_id: p.orderId }),
  offer_form_submit: (p) => ({ order_id: p.orderId }),
  payment_succeeded: (p) => ({ order_id: p.orderId }),
  payment_failed: (p) => ({ order_id: p.orderId }),
  login: () => ({}),
  register: (p) => ({ method: p.role || "email" }),
};

export function mirrorTelemetryToGA(eventType, properties = {}) {
  const map = TELEMETRY_GA_MAP[eventType];
  if (!map) return;
  const gaName =
    eventType === "order_form_start"
      ? "begin_checkout"
      : eventType === "payment_succeeded"
        ? "purchase"
        : eventType === "register"
          ? "sign_up"
          : eventType === "provider_view"
            ? "view_provider"
            : eventType === "provider_contact"
              ? "contact_provider"
              : eventType;
  trackEvent(gaName, map(properties));
}

/**
 * Wyślij niestandardowe zdarzenie do GA4 (np. order_created, provider_contacted).
 * No-op gdy GA nie zainicjalizowane lub gdy analityka odrzucona — bezpieczne wywołanie z dowolnego miejsca.
 */
export function trackEvent(name, params = {}) {
  if (!initialized) return;
  if (!getConsent().analytics) return;
  gtag("event", name, params);
}
