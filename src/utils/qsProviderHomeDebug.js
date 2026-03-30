/**
 * Debug panelu wykonawcy (/provider-home). W produkcji wyłączony domyślnie.
 *
 * Włączenie:
 * - URL: ?qsDebugProviderHome=1 (działa też przy nawigacji SPA — patrz sync w App.jsx)
 * - lub localStorage: qsDebugProviderHome = "1"
 */

function applyDebugParamFromSearch(search) {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(search || "").get("qsDebugProviderHome");
    if (q === "1" || q === "true") {
      localStorage.setItem("qsDebugProviderHome", "1");
      window.__QS_PROVIDER_HOME_DEBUG_FLAG__ = true;
    }
  } catch (_) {}
}

function refreshFlagFromStorage() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("qsDebugProviderHome") === "1") {
      window.__QS_PROVIDER_HOME_DEBUG_FLAG__ = true;
    }
  } catch (_) {}
}

/** Wywołaj raz przy starcie aplikacji (main.jsx), zanim wstanie React. */
export function bootstrapQsProviderHomeDebug() {
  if (typeof window === "undefined") return;
  applyDebugParamFromSearch(window.location.search);
  refreshFlagFromStorage();
  if (readQsProviderDebug()) {
    console.warn(
      "[qsProviderHome] debug ON — pełne logi po wejściu na /provider-home; stan: window.__QS_PROVIDER_HOME_DEBUG__"
    );
  }
}

/** Przy każdej zmianie trasy (React Router) — query nie było w pierwszym loadzie. */
export function syncQsProviderHomeDebugFromSearch(search) {
  const was = readQsProviderDebug();
  applyDebugParamFromSearch(search);
  refreshFlagFromStorage();
  if (readQsProviderDebug() && !was) {
    console.warn(
      "[qsProviderHome] debug ON (nawigacja SPA / zmiana query) — szczegóły po załadowaniu chunku provider-home"
    );
  }
}

export function readQsProviderDebug() {
  try {
    if (Boolean(import.meta.env?.DEV)) return true;
    if (typeof window !== "undefined") {
      if (window.__QS_PROVIDER_HOME_DEBUG_FLAG__ === true) return true;
      const q = new URLSearchParams(window.location.search).get("qsDebugProviderHome");
      if (q === "1" || q === "true") return true;
    }
    return localStorage.getItem("qsDebugProviderHome") === "1";
  } catch {
    return Boolean(import.meta.env?.DEV);
  }
}

/** Krótki tekst obok „Object” w konsoli — bez rozwijania widać liczby i URL. */
function compactSummary(d) {
  if (!d || typeof d !== "object") return "";
  const parts = [];
  const add = (k, v) => {
    if (v === undefined || v === null || v === "") return;
    const s =
      typeof v === "object" ? JSON.stringify(v).slice(0, 100) : String(v).slice(0, 200);
    parts.push(`${k}=${s}`);
  };
  add("url", d.url);
  add("count", d.count);
  add("demandLen", d.demandLen);
  add("filteredLen", d.filteredLen);
  add("sortedLen", d.sortedLen);
  add("showAllServices", d.showAllServices);
  add("clientMaxDistance", d.clientMaxDistance);
  add("effectiveMaxDistance", d.effectiveMaxDistance);
  add("firstService", d.firstService);
  add("firstId", d.firstId);
  add(
    "providerServiceSlugs",
    Array.isArray(d.providerServiceSlugs) ? d.providerServiceSlugs.length + " slugs" : d.providerServiceSlugs
  );
  add("userServicesLen", d.userServicesLen);
  add("allServicesLen", d.allServicesLen);
  add("service", d.service);
  add("id", d.id);
  add("distance", d.distance);
  add("match", d.match);
  return parts.length ? " " + parts.join(" ") : "";
}

/**
 * @param {string} message
 * @param {Record<string, unknown>} [detail] — drugi argument: pełny obiekt (rozwijany w konsoli); w pierwszej linii skrót z compactSummary
 */
export function qsProviderHomeDebug(message, detail) {
  if (!readQsProviderDebug()) return;
  const suffix = compactSummary(detail);
  if (detail !== undefined) {
    console.warn("[qsProviderHome] " + message + suffix, detail);
  } else {
    console.warn("[qsProviderHome] " + message);
  }
}
