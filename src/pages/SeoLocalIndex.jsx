import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { fetchSeoLocalServices, fetchSeoLocalCities, fetchSeoLocalIndex } from '@/api/seoLocal';

/**
 * /wykonawcy — hub PSEO.
 * Katalog usług × miasta z linkami do landingów /wykonawcy/:service/:city.
 */

const CATEGORY_LABELS = {
  hydraulik: 'Hydraulik',
  elektryk: 'Elektryk',
  agd: 'AGD',
  ogrzewanie: 'Ogrzewanie',
  klimatyzacja: 'Klimatyzacja',
  remont: 'Remont i wykończenie',
  stolarz: 'Stolarz',
  sprzatanie: 'Sprzątanie',
  ogrod: 'Ogród',
  dezynsekcja: 'Dezynsekcja'
};

export default function SeoLocalIndex() {
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [publishedPages, setPublishedPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchSeoLocalServices().catch(() => null),
      fetchSeoLocalCities().catch(() => null),
      fetchSeoLocalIndex().catch(() => null)
    ])
      .then(([s, c, index]) => {
        if (!active) return;
        setServices(s?.services || []);
        setCities(c?.cities || []);
        setPublishedPages(index?.items || []);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const pagesByService = publishedPages.reduce((acc, page) => {
    if (!acc[page.serviceSlug]) acc[page.serviceSlug] = [];
    acc[page.serviceSlug].push(page);
    return acc;
  }, {});
  const cityLandingBySlug = publishedPages.reduce((acc, page) => {
    if (!acc[page.citySlug]) acc[page.citySlug] = page;
    return acc;
  }, {});
  const publishedServices = Object.values(
    publishedPages.reduce((acc, page) => {
      if (acc[page.serviceSlug]) return acc;
      const catalogMatch = services.find(
        (service) =>
          service.slug === page.serviceSlug ||
          page.serviceSlug.endsWith(`-${service.slug}`) ||
          service.name.toLowerCase() === page.serviceName.toLowerCase()
      );
      acc[page.serviceSlug] = {
        slug: page.serviceSlug,
        name: page.serviceName,
        category: catalogMatch?.category || 'inne'
      };
      return acc;
    }, {})
  );
  const grouped = publishedServices.reduce((acc, s) => {
    const k = s.category || 'inne';
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead
        title="Wykonawcy Helpfli — hydraulik, elektryk, AGD, remont w Twoim mieście"
        description="Pełen katalog usług Helpfli: hydraulik, elektryk, AGD, remont, sprzątanie. Sprawdź ceny i znajdź sprawdzonego wykonawcę w swoim mieście."
        canonical="/wykonawcy"
      />

      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-indigo-100/80 mb-3">
            <Link to="/" className="hover:underline">Strona główna</Link>
            <span className="mx-1.5">/</span>
            <span>Wykonawcy</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Wszyscy wykonawcy Helpfli w Twoim mieście
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl">
            Hydraulik, elektryk, serwis AGD, remonty i inne usługi dostępne obecnie w {Object.keys(cityLandingBySlug).length || '…'} miastach w Polsce.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-slate-500">Ładowanie…</div>
        ) : (
          <>
            {Object.keys(grouped).map((cat) => (
              <section key={cat} className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 mb-3">
                  {CATEGORY_LABELS[cat] || cat}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[cat].map((s) => (
                    <div key={s.slug} className="rounded-xl border bg-white p-4">
                      <div className="font-semibold text-slate-900 mb-2">{s.name}</div>
                      <ul className="text-sm space-y-1">
                        {(pagesByService[s.slug] || []).slice(0, 8).map((page) => (
                          <li key={page.citySlug}>
                            <Link to={`/wykonawcy/${page.serviceSlug}/${page.citySlug}`} className="text-indigo-700 hover:underline">
                              {page.serviceName} {page.cityName}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {(pagesByService[s.slug] || []).length > 8 && (
                        <details className="mt-2 text-xs text-slate-600">
                          <summary className="cursor-pointer text-indigo-700">
                            Pokaż {(pagesByService[s.slug] || []).length - 8} pozostałych miast
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {(pagesByService[s.slug] || []).slice(8).map((page) => (
                              <li key={page.citySlug}>
                                <Link to={`/wykonawcy/${page.serviceSlug}/${page.citySlug}`} className="text-indigo-700 hover:underline">
                                  {page.serviceName} {page.cityName}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section className="mt-12">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Miasta z Helpfli</h2>
              <div className="flex flex-wrap gap-2">
                {cities.filter((c) => cityLandingBySlug[c.slug]).map((c) => {
                  const landing = cityLandingBySlug[c.slug];
                  return (
                  <Link
                    key={c.slug}
                    to={`/wykonawcy/${landing.serviceSlug}/${c.slug}`}
                    className="text-sm rounded-full border bg-white px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    {c.name}
                  </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
