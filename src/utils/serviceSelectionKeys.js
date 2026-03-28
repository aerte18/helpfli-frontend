/** ObjectId Mongo (24 znaki hex) */
export function isMongoObjectId(id) {
  return id != null && /^[a-f0-9]{24}$/i.test(String(id));
}

/** Jedna forma slugów (myślniki, małe litery) — dopasowanie JSON vs Mongo. */
export function normalizeServiceSlug(s) {
  return String(s || "").replace(/_/g, "-").toLowerCase().trim();
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

const normSlug = normalizeServiceSlug;

/**
 * Czy zapisana u providera usługa (z GET /api/user-services, populate) odpowiada kluczowi z katalogu.
 */
export function userServiceMatchesSelectionKey(us, selectionKey) {
  if (!us || selectionKey == null || selectionKey === "") return false;
  const k = String(selectionKey).trim();
  if (isMongoObjectId(k)) {
    const uid = String(us._id ?? us.id ?? "");
    return uid === k;
  }
  const slug = us.slug != null ? String(us.slug) : "";
  if (!slug) return false;
  if (slug === k) return true;
  return normalizeServiceSlug(slug) === normalizeServiceSlug(k);
}

/** Czy provider ma z katalogu podusługę `sub` (po zapisie ObjectId lub slug w profilu). */
export function providerHasServiceForSub(userServices, sub) {
  const k = getServiceSelectionKey(sub);
  if (!k) return false;
  return (userServices || []).some((us) => userServiceMatchesSelectionKey(us, k));
}

/** Lista kluczy z onboardingu / stanu lokalnego — czy zawiera klucz (z normalizacją slugów). */
export function selectionKeysInclude(selectedKeys, key) {
  if (key == null || key === "") return false;
  const k = String(key);
  const list = selectedKeys || [];
  if (list.some((x) => String(x) === k)) return true;
  if (isMongoObjectId(k)) return list.some((x) => String(x) === k);
  const nk = normalizeServiceSlug(k);
  return list.some((x) => !isMongoObjectId(x) && normalizeServiceSlug(String(x)) === nk);
}

/** Dwa klucze (slug / ObjectId) wskazują tę samą pozycję w wyborze. */
export function selectionKeysEqual(a, b) {
  if (a == null || b == null) return false;
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (sa === sb) return true;
  if (isMongoObjectId(sa) || isMongoObjectId(sb)) return sa === sb;
  return normalizeServiceSlug(sa) === normalizeServiceSlug(sb);
}

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
