/**
 * Zlecenie zapisuje pole `service` jako slug z katalogu.
 * Konto providera ma `user.services` — ObjectId (po populate) lub obiekty ze slug / parent_slug.
 */
export function normalizeProviderServiceSlug(s) {
  return String(s || "").replace(/_/g, "-").toLowerCase().trim();
}

/**
 * Czy zlecenie pasuje do którejś z usług providera (slug / kategoria / liść w tej samej gałęzi).
 */
export function orderServiceMatchesProvider(orderService, providerServices) {
  const os = normalizeProviderServiceSlug(orderService);
  if (!os) return true;
  const list = (providerServices || []).map((s) => {
    if (typeof s === "string") return normalizeProviderServiceSlug(s);
    return normalizeProviderServiceSlug(
      s.slug || s.parent_slug || s.name_pl || s.name || ""
    );
  }).filter(Boolean);
  if (list.length === 0) return true;
  return list.some((ps) => {
    if (!ps) return false;
    return (
      os === ps ||
      os.startsWith(`${ps}-`) ||
      ps.startsWith(`${os}-`)
    );
  });
}
