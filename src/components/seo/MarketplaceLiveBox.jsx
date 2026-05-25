import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '@/lib/apiUrl';

/**
 * Live box „W [mieście] X wykonawców, śr. cena Y zł".
 *
 * Renderowany na stronach poradników (`/poradnik/:slug`). Dane realne, z bazy.
 * Jeśli backend nie wykryje miasta z keywordów — pokażemy selector.
 */

const TOP_CITIES_FALLBACK = [
  { slug: 'warszawa', name: 'Warszawa' },
  { slug: 'krakow', name: 'Kraków' },
  { slug: 'lodz', name: 'Łódź' },
  { slug: 'wroclaw', name: 'Wrocław' },
  { slug: 'poznan', name: 'Poznań' },
  { slug: 'gdansk', name: 'Gdańsk' }
];

function fmt(n) {
  if (!n || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(n);
}

export default function MarketplaceLiveBox({ marketplace }) {
  const initialCity = marketplace?.city?.slug || null;
  const initialService = marketplace?.service?.slug || null;
  const [citySlug, setCitySlug] = useState(initialCity);
  const [snippet, setSnippet] = useState(marketplace?.stats ? marketplace : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialService || !citySlug) return;
    if (snippet?.city?.slug === citySlug && snippet?.stats) return; // mamy już
    let active = true;
    setLoading(true);
    fetch(apiUrl(`/api/seo/marketplace-snippet?service=${encodeURIComponent(initialService)}&city=${encodeURIComponent(citySlug)}`))
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d?.ok) return;
        setSnippet({
          service: d.service,
          city: d.city,
          stats: {
            providers: { active: d.stats.providersActive },
            prices: { avg: d.stats.avg, median: d.stats.median, min: d.stats.min, max: d.stats.max, source: d.stats.source, unit: d.stats.unit },
            orders: { completed30d: d.stats.completed30d }
          },
          ctaUrl: d.ctaUrl,
          orderUrl: d.orderUrl
        });
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [citySlug, initialService]);

  if (!marketplace?.service) return null;

  const live = snippet?.stats?.prices?.source === 'live';
  const cityName = snippet?.city?.name || marketplace?.city?.name || '—';
  const cityLoc = snippet?.city?.locative || marketplace?.city?.locative || cityName;
  const serviceName = snippet?.service?.name || marketplace?.service?.name;

  const ctaLocal = snippet?.ctaUrl || marketplace?.ctaUrl;
  const ctaOrder = snippet?.orderUrl || marketplace?.orderUrl || '/create-order';

  return (
    <section
      aria-label="Aktualne dane marketplace Helpfli"
      className="my-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-emerald-50/40 p-4 sm:p-5"
      data-helpfli-block="marketplace-live"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-indigo-700 font-semibold">
            {live ? 'Live dane Helpfli' : 'Szacunek Helpfli'}
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">
            {serviceName} w {cityLoc}
          </div>
        </div>
        <label className="text-sm">
          <span className="sr-only">Wybierz miasto</span>
          <select
            value={citySlug || ''}
            onChange={(e) => setCitySlug(e.target.value || null)}
            className="rounded-lg border bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Wybierz miasto…</option>
            {TOP_CITIES_FALLBACK.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Ładowanie danych z Helpfli…</div>
      ) : snippet?.stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label="Aktywnych wykonawców" value={fmt(snippet.stats.providers.active)} />
          <Stat
            label={snippet.stats.prices.unit === 'm²' ? 'Średnia cena / m²' : 'Średnia cena'}
            value={`${fmt(snippet.stats.prices.avg)} zł`}
          />
          <Stat label="Mediana wyceny" value={`${fmt(snippet.stats.prices.median)} zł`} />
          <Stat label="Zleceń w 30 dni" value={fmt(snippet.stats.orders.completed30d)} />
        </div>
      ) : (
        <div className="text-sm text-slate-600 mb-3">
          Wybierz miasto, aby zobaczyć dane wykonawców i ceny w Twojej okolicy.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          to={ctaLocal}
          className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
        >
          Zobacz wykonawców {serviceName} {cityName}
        </Link>
        <Link
          to={ctaOrder}
          className="inline-block bg-white text-indigo-700 text-sm px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 font-semibold"
        >
          Zamów wycenę
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-slate-100 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-base font-bold text-slate-900 leading-tight mt-0.5">{value}</div>
    </div>
  );
}
