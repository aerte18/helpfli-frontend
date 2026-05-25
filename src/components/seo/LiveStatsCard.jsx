import { useEffect, useState } from 'react';
import { fetchSeoStats } from '@/api/seo';

/**
 * LiveStatsCard
 * --------------
 * Wyświetla świeże statystyki marketplace Helpfli (liczba wykonawców,
 * średnie ceny z faktycznych zleceń) dla danej kombinacji usługa × miasto.
 *
 * Używamy go:
 *  - w `SeoArticlePage` (gdy artykuł ma `ctaCity` lub `relatedServiceCodes`)
 *  - w `SeoLocalPage` (PSEO miasto×usługa) jako element kluczowy
 *
 * Komponent jest defensywny: jeśli backend nie odpowie, sample size = 0, lub
 * statystyki są niewystarczające — po prostu nie renderujemy nic
 * (zamiast podawać "0 wykonawców" co psułoby zaufanie).
 */
export default function LiveStatsCard({ service, cityName, citySlug, compact = false }) {
  const [snap, setSnap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvedCity, setResolvedCity] = useState(cityName || null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSeoStats({ service, city: citySlug, cityName })
      .then((data) => {
        if (!active) return;
        if (data?.ok) {
          setSnap(data.snapshot);
          setResolvedCity(data.cityName || cityName || null);
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [service, citySlug, cityName]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm animate-pulse" aria-hidden>
        <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!snap) return null;

  const providerCount = snap.providers?.count || 0;
  const verifiedCount = snap.providers?.verifiedCount || 0;
  const avgRating = snap.providers?.avgRating;
  const sample = snap.prices?.sampleSize || 0;
  const median = snap.prices?.median;
  const p25 = snap.prices?.p25;
  const p75 = snap.prices?.p75;
  const recent = snap.recentOrders30d;

  // Jeśli nic sensownego — nie renderuj (zero providerów + zero cen = bezużyteczne)
  if (providerCount === 0 && sample === 0) return null;

  const locationLabel = resolvedCity ? `w mieście ${resolvedCity}` : 'w Polsce';

  return (
    <section
      aria-label="Dane marketplace Helpfli"
      className={`rounded-2xl border bg-white shadow-sm ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900">
          Aktualne dane Helpfli {locationLabel}
        </h2>
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          live
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {providerCount > 0 && (
          <StatTile
            label="Aktywnych wykonawców"
            value={providerCount.toLocaleString('pl-PL')}
            sub={verifiedCount > 0 ? `w tym ${verifiedCount} zweryfikowanych` : null}
          />
        )}
        {avgRating != null && (
          <StatTile
            label="Średnia ocena"
            value={`★ ${avgRating.toFixed(1).replace('.', ',')}`}
            sub="z opinii klientów"
          />
        )}
        {sample >= 5 && median > 0 && (
          <StatTile
            label="Mediana ceny"
            value={`${median.toLocaleString('pl-PL')} zł`}
            sub={p25 && p75 ? `widełki ${p25}–${p75} zł` : `z ${sample} zleceń`}
          />
        )}
        {recent > 0 && (
          <StatTile
            label="Zleceń w 30 dni"
            value={recent.toLocaleString('pl-PL')}
            sub="ostatnie zlecenia"
          />
        )}
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        Dane na żywo z platformy Helpfli ·{' '}
        {snap.generatedAt
          ? new Date(snap.generatedAt).toLocaleDateString('pl-PL')
          : ''}
      </div>
    </section>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg sm:text-xl font-semibold text-slate-900 mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
