const SERVICE_LABELS = {
  'agd-rtv-naprawa-agd': 'Naprawa AGD',
  'agd-rtv-naprawa-rtv': 'Naprawa RTV',
  'agd-rtv': 'AGD/RTV',
  hydraulik_naprawa: 'Hydraulik',
  hydraulik: 'Hydraulik',
  elektryk_naprawa: 'Elektryk',
  elektryk: 'Elektryk',
  zlota_raczka: 'Złota rączka',
  sprzatanie: 'Sprzątanie',
  remont: 'Remont',
  inne: 'Inne'
};

export function serviceLabel(service, fallback = 'Nie podano') {
  if (!service) return fallback;
  if (typeof service === 'object') {
    return service.name_pl || service.name || service.label || service.code || fallback;
  }
  const raw = String(service).trim();
  if (!raw) return fallback;
  return SERVICE_LABELS[raw] || SERVICE_LABELS[raw.toLowerCase()] || prettifySlug(raw);
}

function prettifySlug(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}
