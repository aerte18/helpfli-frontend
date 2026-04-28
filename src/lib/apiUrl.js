/**
 * Bazowy URL API (bez końcowego slasha). Pusty = ten sam origin (dev + proxy Vite).
 * W produkcji ustaw VITE_API_URL=https://api.twoja-domena.pl
 */
function inferApiBaseFromWindow() {
  if (typeof window === "undefined") return "";
  if (!import.meta.env.PROD) return "";
  let host = window.location.hostname.replace(/^www\./, "");
  if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return "";
  if (host.startsWith("api.")) return "";
  const proto = window.location.protocol || "https:";
  return `${proto}//api.${host}`.replace(/\/$/, "");
}

export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim().replace(/\/$/, "");
  }
  // W produkcji puste VITE_API_URL często oznacza błędną konfigurację env.
  // Zamiast wymuszać względne /api (które może wskazywać na frontend),
  // spróbuj automatycznie użyć subdomeny api.<host>.
  if (raw === "") {
    return import.meta.env.PROD ? inferApiBaseFromWindow() : "";
  }
  return inferApiBaseFromWindow();
}

/**
 * Pełny URL do endpointu backendu. Ścieżki zaczynają się od / (np. /api/...).
 */
export function apiUrl(path) {
  if (path == null || path === "") return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
