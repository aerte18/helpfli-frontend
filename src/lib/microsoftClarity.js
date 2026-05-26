/**
 * Microsoft Clarity — heatmapy + nagrania sesji.
 *
 * Inaczej niż GA4, Clarity nie ma odpowiednika Consent Mode v2 — Microsoft
 * jasno zaleca: NIE ładuj skryptu dopóki user nie zaakceptował analityki.
 * Dokumentacja: https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-consent
 *
 * Strategia:
 *  1. initMicrosoftClarity() sprawdza, czy user już zaakceptował analitykę
 *     — jeśli tak, ładuje skrypt natychmiast.
 *  2. Niezależnie nasłuchuje 'qs-consent-changed' — gdy user kliknie
 *     "Akceptuj" później w Footerze → Ustawienia prywatności, ładuje skrypt.
 *  3. Skrypt ładujemy tylko raz (idempotentny init).
 *  4. Gdy user cofnie zgodę (analytics = false), wywołujemy `clarity.consent(false)`
 *     żeby Clarity przestał zapisywać nowe sesje (zachowuje wcześniejsze).
 */

import { getConsent, hasAnalyticsConsent } from "../utils/consent";

let scriptInjected = false;
let listenerInstalled = false;

function injectClarityScript(projectId) {
  if (scriptInjected) return;
  if (typeof document === "undefined") return;
  if (document.getElementById("ms-clarity-script")) {
    scriptInjected = true;
    return;
  }

  // Oficjalny snippet z panelu Clarity, opakowany w funkcję żeby moc go ładować
  // dynamicznie po zgodzie (zamiast na load <head>).
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    t.id = "ms-clarity-script";
    y = l.getElementsByTagName(r)[0];
    if (y && y.parentNode) {
      y.parentNode.insertBefore(t, y);
    } else {
      l.head.appendChild(t);
    }
  })(window, document, "clarity", "script", projectId);

  scriptInjected = true;
}

function setClarityConsent(granted) {
  try {
    if (typeof window.clarity === "function") {
      window.clarity("consent", !!granted);
    }
  } catch {
    /* clarity not loaded yet */
  }
}

export function initMicrosoftClarity() {
  const projectId =
    typeof import.meta !== "undefined" && import.meta?.env?.VITE_CLARITY_PROJECT_ID;
  if (!projectId || projectId === "off" || projectId === "false") {
    return;
  }
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Jeśli user wcześniej zaakceptował analitykę — załaduj od razu.
  if (hasAnalyticsConsent()) {
    injectClarityScript(projectId);
    setClarityConsent(true);
  }

  if (listenerInstalled) return;
  listenerInstalled = true;

  window.addEventListener("qs-consent-changed", (event) => {
    const next = (event && event.detail) || getConsent();
    if (next.analytics) {
      injectClarityScript(projectId);
      // Małe opóźnienie żeby clarity() global zdążył się zarejestrować.
      setTimeout(() => setClarityConsent(true), 50);
    } else {
      // User cofnął zgodę — powiedz Clarity, żeby nie zapisywał nowych sesji.
      setClarityConsent(false);
    }
  });
}

/**
 * Wyślij niestandardowe zdarzenie do Clarity (np. tag, set custom data).
 *  - clarity('set', 'role', 'provider') — tagowanie sesji wg roli usera
 *  - clarity('event', 'order_created') — zdarzenia
 */
export function clarityCall(...args) {
  if (!hasAnalyticsConsent()) return;
  try {
    if (typeof window.clarity === "function") {
      window.clarity(...args);
    }
  } catch {
    /* noop */
  }
}
