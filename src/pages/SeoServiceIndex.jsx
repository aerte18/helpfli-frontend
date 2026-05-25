import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSeoLocalServices, fetchSeoLocalCities } from '@/api/seoLocal';

/**
 * /uslugi/:service — np. /uslugi/hydraulik
 * Pełna lista miast dla danej usługi (hub PSEO 2-go poziomu).
 */

const SITE_URL =
  (typeof window !== 'undefined' && window.__HELPFLI_SITE_URL__) || 'https://helpfli.pl';

export default function SeoServiceIndex() {
  const { service: serviceSlug } = useParams();
  const [service, setService] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchSeoLocalServices().catch(() => null), fetchSeoLocalCities().catch(() => null)])
      .then(([s, c]) => {
        if (!active) return;
        const svc = (s?.services || []).find((x) => x.slug === serviceSlug) || null;
        setService(svc);
        setCities(c?.cities || []);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [serviceSlug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Ładowanie…</div>;
  }
  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <Helmet><meta name="robots" content="noindex,follow" /></Helmet>
        <div className="text-center">Nie znaleźliśmy tej usługi.</div>
      </div>
    );
  }

  const canonical = `${SITE_URL}/uslugi/${service.slug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{service.name} — wykonawcy w całej Polsce | Helpfli</title>
        <meta
          name="description"
          content={`${service.name}: sprawdzeni wykonawcy w Twoim mieście. Cennik, opinie, bezpłatna wycena. Lista ${cities.length} miast w Polsce.`}
        />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-indigo-100/80 mb-3">
            <Link to="/" className="hover:underline">Strona główna</Link>
            <span className="mx-1.5">/</span>
            <Link to="/uslugi" className="hover:underline">Usługi</Link>
            <span className="mx-1.5">/</span>
            <span>{service.name}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">{service.name} — wykonawcy w Twoim mieście</h1>
          <p className="text-lg text-indigo-100 max-w-2xl">Wybierz miasto, w którym potrzebujesz {service.namePerson || service.name.toLowerCase()}.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {cities.map((c) => (
            <Link
              key={c.slug}
              to={`/uslugi/${service.slug}/${c.slug}`}
              className="rounded-lg border bg-white px-3 py-2 hover:bg-indigo-50 text-slate-800 text-sm"
            >
              {service.name} {c.name}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
