import { sortCategoriesByOrder, sortSubcategories } from "../constants/categoryOrder";
import { getServiceSelectionKey } from "./serviceSelectionKeys";

/** Jak w categoryOrder: jedna forma slugów (myślniki, małe litery). */
function normalizeSlug(slug = "") {
  return String(slug).replace(/_/g, "-").toLowerCase().trim();
}

/** Synonimy parent_slug (katalog JSON vs services_catalog / Mongo). */
const PARENT_CANONICAL = {
  "24h": "pomoc-24-7",
};

function canonicalParentSlug(slug) {
  const n = normalizeSlug(slug);
  return PARENT_CANONICAL[n] || n;
}

function isMongoObjectId(id) {
  return id != null && /^[a-f0-9]{24}$/i.test(String(id));
}

/**
 * Ta sama usługa może wpaść z JSON (placeholder) i z API (pełny dokument z _id).
 * Zostawiamy wersję z prawdziwym ObjectId z MongoDB.
 */
function dedupeServicesPreferMongo(services) {
  const byNorm = new Map();
  for (const s of services || []) {
    const key = normalizeSlug(s.slug || "");
    if (!key) continue;
    const prev = byNorm.get(key);
    if (!prev) {
      byNorm.set(key, s);
      continue;
    }
    const next = s;
    const pick =
      isMongoObjectId(next._id) && !isMongoObjectId(prev._id)
        ? next
        : !isMongoObjectId(next._id) && isMongoObjectId(prev._id)
          ? prev
          : next;
    byNorm.set(key, pick);
  }
  return [...byNorm.values()];
}

function displayNameFromSlug(slug) {
  const s = normalizeSlug(slug);
  if (!s) return "Kategoria";
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Buduje listę kategorii głównych + mapę slug → podusługi (jak w Zarządzanie usługami).
 * Scala m.in. `agd-rtv` (JSON) z `agd_rtv` (Mongo/katalog), żeby nie było podwójnych bloków.
 */
export function buildProviderServiceCategories(services, categoriesPayload) {
  const servicesList = Array.isArray(services) ? services : [];
  const categoriesPayloadSafe = Array.isArray(categoriesPayload?.items)
    ? categoriesPayload.items
    : Array.isArray(categoriesPayload)
      ? categoriesPayload
      : [];

  const servicesBySlug = new Map();
  for (const service of servicesList) {
    if (!service.slug) continue;
    servicesBySlug.set(service.slug, service);
    servicesBySlug.set(normalizeSlug(service.slug), service);
  }

  const resolveService = (sub) => {
    const rawId = sub.id || sub.slug;
    if (!rawId) return null;
    return (
      servicesBySlug.get(rawId) ||
      servicesBySlug.get(normalizeSlug(rawId)) ||
      null
    );
  };

  const normalizedCategories = categoriesPayloadSafe.map((cat) => {
    const rawSlug = cat.id || cat.slug || cat.parent_slug;
    const slug = normalizeSlug(rawSlug);
    const displayName =
      cat.name ||
      cat.name_pl ||
      cat.label ||
      displayNameFromSlug(slug);
    const subs = (cat.subcategories || [])
      .map((sub) => {
        const service = resolveService(sub);
        if (service) return service;
        return {
          _id: sub.id,
          slug: sub.id,
          name_pl: sub.name || sub.label || sub.id,
          parent_slug: slug,
        };
      })
      .filter(Boolean);

    return {
      _id: `cat_${slug}`,
      slug,
      name_pl: displayName,
      services: sortSubcategories({ slug, services: subs }),
    };
  });

  const jsonCategorySlugs = new Set(normalizedCategories.map((c) => c.slug));
  const categoryBySlug = new Map(
    normalizedCategories.map((c) => [c.slug, c])
  );

  // Dołącz wszystkie usługi z API do właściwej kategorii (po znormalizowanym parent_slug)
  for (const service of servicesList) {
    if (!service.parent_slug) continue;
    const parentNorm = canonicalParentSlug(service.parent_slug);
    const cat = categoryBySlug.get(parentNorm);
    if (!cat) continue;
    const sk = normalizeSlug(service.slug || "");
    if (!sk) continue;
    const dup = cat.services.some(
      (x) => normalizeSlug(x.slug || "") === sk
    );
    if (!dup) cat.services.push(service);
  }

  for (const cat of normalizedCategories) {
    cat.services = dedupeServicesPreferMongo(cat.services);
    cat.services = sortSubcategories({
      slug: cat.slug,
      services: cat.services,
    });
  }

  // Kategorie tylko z bazy/katalogu — bez odpowiednika w categories_pl (znormalizowany slug)
  const extraSubs = {};
  for (const service of servicesList) {
    if (!service.parent_slug) continue;
    const parentNorm = canonicalParentSlug(service.parent_slug);
    if (jsonCategorySlugs.has(parentNorm)) continue;

    if (!extraSubs[parentNorm]) extraSubs[parentNorm] = [];
    const sk = normalizeSlug(service.slug || "");
    if (!sk) continue;
    if (
      extraSubs[parentNorm].some(
        (x) => normalizeSlug(x.slug || "") === sk
      )
    ) {
      continue;
    }
    extraSubs[parentNorm].push(service);
  }

  const extraCategories = Object.keys(extraSubs).map((slug) => ({
    _id: `extra_${slug}`,
    slug,
    name_pl: displayNameFromSlug(slug),
    services: sortSubcategories({
      slug,
      services: dedupeServicesPreferMongo(extraSubs[slug]),
    }),
  }));

  let combinedCategories = [...normalizedCategories, ...extraCategories].filter(
    (cat) => cat.services.length > 0
  );

  if (combinedCategories.length === 0) {
    const fallbackMap = {};
    servicesList.forEach((service) => {
      if (!service.parent_slug) return;
      const p = canonicalParentSlug(service.parent_slug);
      if (!fallbackMap[p]) {
        fallbackMap[p] = {
          _id: `fallback_${p}`,
          slug: p,
          name_pl: displayNameFromSlug(p),
          services: [],
        };
      }
      fallbackMap[p].services.push(service);
    });
    combinedCategories = Object.values(fallbackMap).map((cat) => {
      const merged = dedupeServicesPreferMongo(cat.services);
      return {
        ...cat,
        services: sortSubcategories({ slug: cat.slug, services: merged }),
      };
    });
  }

  const subsMap = {};
  combinedCategories.forEach((cat) => {
    subsMap[cat.slug] = cat.services;
  });

  return {
    mainCategories: sortCategoriesByOrder(combinedCategories),
    subcategories: subsMap,
  };
}

/** Rozwiń kategorie, w których jest coś zaznaczone (ObjectId lub slug). */
export function getExpandedSlugsForSelection(subcategories, selectedIds) {
  const idSet = new Set((selectedIds || []).map(String));
  const expanded = new Set();
  Object.entries(subcategories || {}).forEach(([slug, subs]) => {
    if (
      (subs || []).some((sub) => {
        const k = getServiceSelectionKey(sub);
        return k && idSet.has(k);
      })
    ) {
      expanded.add(slug);
    }
  });
  return expanded;
}
