import { apiUrl } from "../lib/apiUrl";

/** Dwie litery (np. imię + nazwisko), polskie znaki OK */
export function getNameInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0].charAt(0);
    const b = parts[parts.length - 1].charAt(0);
    return (a + b).toLocaleUpperCase("pl-PL");
  }
  const single = parts[0] || name;
  return single.slice(0, 2).toLocaleUpperCase("pl-PL");
}

/** Zwraca pełny URL zdjęcia albo null (brak zdjęcia / placeholder / puste). */
export function resolveProviderPhotoUrl(raw) {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (/placeholder\.com|via\.placeholder|placehold\.it/i.test(t)) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return apiUrl(t.startsWith("/") ? t : `/${t}`);
}
