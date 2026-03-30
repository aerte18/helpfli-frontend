/**
 * Zlecenie zapisuje pole `service` jako slug z katalogu.
 * Konto providera ma `user.services` — ObjectId (po populate) lub obiekty ze slug / parent_slug.
 */
export function normalizeProviderServiceSlug(s) {
  return String(s || "").replace(/_/g, "-").toLowerCase().trim();
}

function isLikelyMongoId(s) {
  return typeof s === "string" && /^[a-f0-9]{24}$/i.test(s.trim());
}

/**
 * Buduje listę slugów z profilu providera (w tym rozwinięcie ObjectId przez katalog z /api/services).
 */
export function expandProviderServiceSlugs(providerServices, catalogItems = []) {
  const byId = new Map(
    (catalogItems || []).map((c) => [String(c._id || c.id), c])
  );
  const out = [];
  for (const s of providerServices || []) {
    if (s && typeof s === "object") {
      if (s.slug) out.push(s.slug);
      if (s.parent_slug && s.parent_slug !== s.slug) out.push(s.parent_slug);
      if (!s.slug && !s.parent_slug) {
        const np = s.name_pl || s.name || "";
        if (np) out.push(np);
      }
    } else if (typeof s === "string") {
      const t = s.trim();
      if (isLikelyMongoId(t)) {
        const doc = byId.get(t);
        if (doc?.slug) out.push(doc.slug);
        if (doc?.parent_slug && doc.parent_slug !== doc?.slug) out.push(doc.parent_slug);
      } else {
        out.push(t);
      }
    }
  }
  return [...new Set(out.map(normalizeProviderServiceSlug).filter(Boolean))];
}

function legacySlugList(providerServices) {
  return [
    ...new Set(
      (providerServices || [])
        .map((s) => {
          if (typeof s === "string") {
            if (isLikelyMongoId(s)) return "";
            return normalizeProviderServiceSlug(s);
          }
          return normalizeProviderServiceSlug(
            s.slug || s.parent_slug || s.name_pl || s.name || ""
          );
        })
        .filter(Boolean)
    ),
  ];
}

/**
 * Czy zlecenie pasuje do którejś z usług providera (slug / kategoria / liść w tej samej gałęzi).
 * @param {string} orderService — slug zlecenia
 * @param {Array} providerServices — user.services
 * @param {Array} [catalogItems] — opcjonalnie wynik GET /api/services (items) do mapowania samych ObjectId
 */
export function orderServiceMatchesProvider(orderService, providerServices, catalogItems) {
  const os = normalizeProviderServiceSlug(orderService);
  let list = expandProviderServiceSlugs(providerServices, catalogItems);
  if (list.length === 0 && providerServices?.length) {
    list = legacySlugList(providerServices);
  }

  if (list.length === 0) {
    if (!providerServices || providerServices.length === 0) return true;
    return false;
  }

  // Zlecenie bez slug — nie traktuj jako „pasujące do profilu” (wcześniej: return true → przepuszczało obce kategorie)
  if (!os) return false;

  return list.some((ps) => {
    if (!ps) return false;
    return (
      os === ps ||
      os.startsWith(`${ps}-`) ||
      ps.startsWith(`${os}-`)
    );
  });
}
