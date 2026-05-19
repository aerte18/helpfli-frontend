export function isOffersOnlyOrder(order) {
  return order?.orderMode === 'offers_only';
}

export function formatPriceHint(min, max, currency = 'PLN') {
  const lo = Number(min);
  const hi = Number(max);
  if (!lo && !hi) return null;
  if (lo && hi && lo !== hi) {
    return `${lo.toLocaleString('pl-PL')}–${hi.toLocaleString('pl-PL')} ${currency}`;
  }
  const v = lo || hi;
  return `ok. ${v.toLocaleString('pl-PL')} ${currency}`;
}
