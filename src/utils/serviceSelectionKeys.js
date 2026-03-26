/** ObjectId Mongo (24 znaki hex) */
export function isMongoObjectId(id) {
  return id != null && /^[a-f0-9]{24}$/i.test(String(id));
}

/**
 * Klucz stanu zaznaczenia: najpierw prawdziwe _id z Mongo, inaczej slug
 * (katalog statyczny często nie ma _id — bez tego „zaznacz kategorię” nie działa).
 */
export function getServiceSelectionKey(s) {
  if (!s) return "";
  if (isMongoObjectId(s._id)) return String(s._id);
  if (s.slug) return String(s.slug);
  return "";
}

const normSlug = (s) => String(s || "").replace(/_/g, "-").toLowerCase().trim();

/**
 * Zamienia klucze (ObjectId lub slug) na listę ObjectId do POST /api/user-services.
 */
export function resolveSelectionKeysToMongoIds(keys, serviceItems) {
  const items = Array.isArray(serviceItems) ? serviceItems : [];
  const bySlug = new Map();
  for (const s of items) {
    if (!s?.slug) continue;
    bySlug.set(String(s.slug), s);
    bySlug.set(normSlug(s.slug), s);
  }
  const out = [];
  for (const key of keys || []) {
    const k = String(key);
    if (isMongoObjectId(k)) {
      out.push(k);
      continue;
    }
    const svc = bySlug.get(k) || bySlug.get(normSlug(k));
    if (svc && isMongoObjectId(svc._id)) out.push(String(svc._id));
  }
  return [...new Set(out)];
}
