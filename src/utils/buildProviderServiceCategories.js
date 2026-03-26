import { sortCategoriesByOrder, sortSubcategories } from "../constants/categoryOrder";

/**
 * Buduje listę kategorii głównych + mapę slug → podusługi (jak w Zarządzanie usługami).
 */
export function buildProviderServiceCategories(services, categoriesPayload) {
  const servicesList = Array.isArray(services) ? services : [];
  const categoriesPayloadSafe = Array.isArray(categoriesPayload?.items)
    ? categoriesPayload.items
    : Array.isArray(categoriesPayload)
      ? categoriesPayload
      : [];

  const servicesBySlug = new Map(
    servicesList.map((service) => [service.slug, service])
  );

  const normalizedCategories = categoriesPayloadSafe.map((cat) => {
    const slug = cat.id || cat.slug || cat.parent_slug;
    const displayName =
      cat.name ||
      cat.name_pl ||
      cat.label ||
      (slug ? slug.replace(/[-_]/g, " ") : "Kategoria");
    const subs = sortSubcategories({
      slug,
      services: (cat.subcategories || [])
        .map((sub) => {
          const service =
            servicesBySlug.get(sub.id) || servicesBySlug.get(sub.slug);
          if (service) return service;
          return {
            _id: sub.id,
            slug: sub.id,
            name_pl: sub.name || sub.label || sub.id,
            parent_slug: slug,
          };
        })
        .filter(Boolean),
    });
    return {
      _id: `cat_${slug}`,
      slug,
      name_pl: displayName,
      services: subs,
    };
  });

  const catalogSlugs = new Set(normalizedCategories.map((cat) => cat.slug));
  const extraSubs = {};
  servicesList.forEach((service) => {
    if (!service.parent_slug) return;
    if (!catalogSlugs.has(service.parent_slug)) {
      if (!extraSubs[service.parent_slug]) extraSubs[service.parent_slug] = [];
      extraSubs[service.parent_slug].push(service);
    }
  });
  const extraCategories = Object.keys(extraSubs).map((slug) => ({
    _id: `extra_${slug}`,
    slug,
    name_pl: slug.charAt(0).toUpperCase() + slug.slice(1),
    services: extraSubs[slug],
  }));

  let combinedCategories = [...normalizedCategories, ...extraCategories].filter(
    (cat) => cat.services.length > 0
  );
  if (combinedCategories.length === 0) {
    const fallbackMap = {};
    servicesList.forEach((service) => {
      if (!service.parent_slug) return;
      if (!fallbackMap[service.parent_slug]) {
        fallbackMap[service.parent_slug] = {
          _id: `fallback_${service.parent_slug}`,
          slug: service.parent_slug,
          name_pl:
            service.parent_slug.charAt(0).toUpperCase() +
            service.parent_slug.slice(1),
          services: [],
        };
      }
      fallbackMap[service.parent_slug].services.push(service);
    });
    combinedCategories = Object.values(fallbackMap);
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

/** Rozwiń kategorie, w których jest coś zaznaczone (id usług z Mongo). */
export function getExpandedSlugsForSelection(subcategories, selectedIds) {
  const idSet = new Set((selectedIds || []).map(String));
  const expanded = new Set();
  Object.entries(subcategories || {}).forEach(([slug, subs]) => {
    if (
      (subs || []).some((sub) => sub._id != null && idSet.has(String(sub._id)))
    ) {
      expanded.add(slug);
    }
  });
  return expanded;
}
