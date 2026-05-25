import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSeoLocalServices, fetchSeoLocalCities } from '@/api/seoLocal';

/**
 * /uslugi — hub PSEO.
 *
 * Strona-katalog: wszystkie usługi × wszystkie miasta. Działa też jako
 * silne wewnętrzne linkowanie — Google podchwytuje stąd 1500+ landingów PSEO.
 */

const SITE_URL =
  (typeof window !== 'undefined' && window.__HELPFLI_SITE_URL__) || 'https://helpfli.pl';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchSeoLocalServices().catch(() => null), fetchSeoLocalCities().catch(() => null)])
      .then(([s, c]) => {
        if (!active) return;
        setServices(s?.services || []);
        setCities(c?.cities || []);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const grouped = services.reduce((acc, s) => {
    const k = s.category || 'inne';
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Usługi Helpfli — hydraulik, elektryk, AGD, remont w Twoim mieście</title>
        <meta
          name="description"
          content="Pełen katalog usług Helpfli: hydraulik, elektryk, AGD, remont, sprzątanie. Sprawdź ceny i znajdź sprawdzonego wykonawcę w swoim mieście."
        />
        <link rel="canonical" href={`${SITE_URL}/uslugi`} />
      </Helmet>

      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-indigo-100/80 mb-3">
            <Link to="/" className="hover:underline">Strona główna</Link>
            <span className="mx-1.5">/</span>
            <span>Usługi</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Wszystkie usługi Helpfli w Twoim mieście
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl">
            Hydraulik, elektryk, serwis AGD, remonty, sprzątanie — sprawdzeni wykonawcy w {cities.length} miastach w Polsce.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
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
                        {cities.slice(0, 6).map((c) => (
                          <li key={c.slug}>
                            <Link to={`/uslugi/${s.slug}/${c.slug}`} className="text-indigo-700 hover:underline">
                              {s.name} {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link to={`/uslugi/${s.slug}`} className="block mt-2 text-xs text-slate-500 hover:underline">
                        Zobacz wszystkie miasta →
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section className="mt-12">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Miasta z Helpfli</h2>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/uslugi/miasto/${c.slug}`}
                    className="text-sm rounded-full border bg-white px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
