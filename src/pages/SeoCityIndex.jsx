import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSeoLocalCity, fetchSeoLocalServices } from '@/api/seoLocal';

/**
 * /uslugi/miasto/:city — hub city-only.
 * Lista wszystkich usług Helpfli w danym mieście.
 */

const SITE_URL =
  (typeof window !== 'undefined' && window.__HELPFLI_SITE_URL__) || 'https://helpfli.pl';

export default function SeoCityIndex() {
  const { city: citySlug } = useParams();
  const [data, setData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchSeoLocalCity(citySlug).catch((e) => { setError(e); return null; }),
      fetchSeoLocalServices().catch(() => null)
    ])
      .then(([cityData, svcData]) => {
        if (!active) return;
        setData(cityData);
        setServices(svcData?.services || []);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [citySlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Ładowanie…</div>;
  if (!data?.city || error) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <Helmet><meta name="robots" content="noindex,follow" /></Helmet>
        <div className="text-center">Nie znaleźliśmy tego miasta.</div>
      </div>
    );
  }

  const { city, stats } = data;
  const canonical = `${SITE_URL}/uslugi/miasto/${city.slug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Usługi w {city.locative} — wykonawcy, ceny | Helpfli</title>
        <meta name="description" content={`Pełna lista usług Helpfli w ${city.locative}: hydraulik, elektryk, AGD, remonty. ${stats?.providersCount || 0} sprawdzonych wykonawców.`} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-indigo-100/80 mb-3">
            <Link to="/" className="hover:underline">Strona główna</Link>
            <span className="mx-1.5">/</span>
            <Link to="/uslugi" className="hover:underline">Usługi</Link>
            <span className="mx-1.5">/</span>
            <span>{city.name}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">Usługi w {city.locative}</h1>
          <p className="text-lg text-indigo-100 max-w-2xl">
            {stats?.providersCount > 0
              ? `${stats.providersCount} sprawdzonych wykonawców w ${city.locative}.`
              : `Sprawdzeni wykonawcy w ${city.locative}.`}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((s) => (
            <Link
              key={s.slug}
              to={`/uslugi/${s.slug}/${city.slug}`}
              className="rounded-xl border bg-white p-4 hover:shadow-md"
            >
              <div className="font-semibold text-slate-900">{s.name} {city.name}</div>
              <div className="text-xs text-slate-500 mt-1">Wykonawcy i cennik 2026</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
