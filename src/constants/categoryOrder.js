import { SERVICES_CATALOG } from "./servicesCatalog";

const normalize = (slug = "") => slug.replace(/_/g, "-").toLowerCase();

const CATEGORY_ORDER = SERVICES_CATALOG.map(cat => normalize(cat.id || cat.slug || ""));

/** Zachowanie kompatybilności wstecznej */
export const getCategoryOrderIndex = (slug) => {
  const idx = CATEGORY_ORDER.indexOf(normalize(slug));
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

/** Sortowanie kategorii alfabetycznie (PL), "Inne" zawsze na końcu */
export const sortCategoriesByOrder = (categories = []) => {
  return [...categories].sort((a, b) => {
    const aInne = isInne(a);
    const bInne = isInne(b);
    if (aInne !== bInne) return aInne ? 1 : -1;
    const aName = (a.name_pl || a.name || a.label || '').trim();
    const bName = (b.name_pl || b.name || b.label || '').trim();
    return aName.localeCompare(bName, 'pl');
  });
};

/** Sortowanie podkategorii alfabetycznie (PL), "Inne" zawsze na końcu */
export const sortSubcategories = (category) => {
  const services = [...(category.services || category.subcategories || [])];
  return services.sort((a, b) => {
    const aInne = isInne(a);
    const bInne = isInne(b);
    if (aInne !== bInne) return aInne ? 1 : -1;
    const aName = (a.name_pl || a.name || a.label || '').trim();
    const bName = (b.name_pl || b.name || b.label || '').trim();
    return aName.localeCompare(bName, 'pl');
  });
};

/** Kategoria lub podkategoria to "Inne" – zawsze na końcu listy */
const isInne = (item) => {
  const slug = normalize(item.slug || item.id || '');
  const name = (item.name_pl || item.name || item.label || '').toLowerCase().trim();
  return slug === 'inne' || name === 'inne' || slug.endsWith('-inne') || slug.endsWith('_inne');
};

export default CATEGORY_ORDER;

