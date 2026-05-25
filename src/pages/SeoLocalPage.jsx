import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSeoLocalPage } from '@/api/seo';
import LiveStatsCard from '@/components/seo/LiveStatsCard';
import ArticleConciergeCard from '@/components/seo/ArticleConciergeCard';

/**
 * /wykonawcy/:service/:city – Programmatic SEO landing page (PSEO).
 *
 * Strona generowana per kombinacja usługa × miasto na podstawie LLM (unikalna treść)
 * + LIVE statystyk marketplace Helpfli (realne liczby z bazy). To dramatycznie
 * zwiększa pokrycie longtail keywordów (np. „hydraulik warszawa cena", „elektryk kraków na już").
 */

const SITE_URL =
  (typeof window !== 'undefined' && window.__HELPFLI_SITE_URL__) ||
  'https://helpfli.pl';

function buildFaqJsonLd(page) {
  if (!page?.faq?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  };
}

function buildLocalBusinessJsonLd(page, snap, canonicalUrl) {
  if (!page) return null;
  const count = snap?.providers?.count || page.statsSnapshot?.providerCount || 0;
  const avgRating = snap?.providers?.avgRating ?? page.statsSnapshot?.avgRating;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Helpfli – ${page.serviceName} ${page.cityName}`,
    description: page.metaDescription,
    url: canonicalUrl,
    areaServed: {
      '@type': 'City',
      name: page.cityName
    },
    image: `${SITE_URL}/icons/icon-192x192.png`,
    priceRange: snap?.prices?.median ? `${snap.prices.min}-${snap.prices.max} PLN` : undefined
  };

  // AggregateRating – tylko jeśli mamy realny sample
  if (avgRating != null && count >= 3) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: count,
      bestRating: 5,
      worstRating: 1
    };
  }

  return ld;
}

function buildBreadcrumbJsonLd(page, canonicalUrl) {
  if (!page) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Strona główna', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: page.serviceName, item: `${SITE_URL}/services` },
      { '@type': 'ListItem', position: 3, name: page.cityName, item: canonicalUrl }
    ]
  };
}

function buildCreateOrderHref(page) {
  if (!page) return '/create-order';
  const params = new URLSearchParams();
  params.set('service', page.serviceSlug);
  params.set('city', page.cityName);
  return `/create-order?${params.toString()}`;
}

export default function SeoLocalPage() {
  const { service, city } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchSeoLocalPage(service, city)
      .then((res) => {
        if (!active) return;
        if (res?.ok) setData(res);
        else setError(res?.message || 'Nie znaleziono strony');
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message || 'Błąd ładowania');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [service, city]);

  const page = data?.page || null;
  const snap = data?.liveSnapshot || null;
  const canonicalUrl = useMemo(
    () => `${SITE_URL}/wykonawcy/${service}/${city}`,
    [service, city]
  );

  const faqLd = useMemo(() => buildFaqJsonLd(page), [page]);
  const localLd = useMemo(() => buildLocalBusinessJsonLd(page, snap, canonicalUrl), [page, snap, canonicalUrl]);
  const crumbLd = useMemo(() => buildBreadcrumbJsonLd(page, canonicalUrl), [page, canonicalUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Ładowanie…</div>
      </div>
    );
  }
  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Nie znaleziono strony</h1>
        <p className="text-slate-600 max-w-md mb-5">{error || 'Spróbuj wybrać inne miasto lub usługę.'}</p>
        <Link to="/poradniki" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold">
          Wróć do poradników
        </Link>
      </div>
    );
  }

  const ctaHref = buildCreateOrderHref(page);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{page.metaTitle || page.title}</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={page.metaTitle || page.title} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="pl_PL" />
        <meta name="twitter:card" content="summary_large_image" />

        {faqLd && <script type="application/ld+json">{JSON.stringify(faqLd)}</script>}
        {localLd && <script type="application/ld+json">{JSON.stringify(localLd)}</script>}
        {crumbLd && <script type="application/ld+json">{JSON.stringify(crumbLd)}</script>}
      </Helmet>

      <header className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <nav className="text-xs text-indigo-200 mb-3" aria-label="breadcrumbs">
            <Link to="/" className="hover:text-white">Helpfli</Link>
            {' / '}
            <span>{page.serviceName}</span>
            {' / '}
            <span className="text-white">{page.cityName}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            {page.title || `${page.serviceName} ${page.cityName}`}
          </h1>
          {page.intro && <p className="text-lg text-indigo-100 max-w-3xl">{page.intro}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to={ctaHref}
              className="inline-block bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-semibold shadow hover:bg-indigo-50 transition"
            >
              Znajdź wykonawcę w {page.cityName}
            </Link>
            <Link
              to="/poradniki"
              className="inline-block bg-white/10 backdrop-blur text-white px-5 py-2.5 rounded-xl font-semibold border border-white/30 hover:bg-white/20 transition"
            >
              Zobacz poradniki
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Live stats card — kluczowy dowód społeczny */}
        <LiveStatsCard
          service={page.serviceSlug}
          citySlug={page.citySlug}
          cityName={page.cityName}
        />

        {/* AI Concierge embed */}
        <ArticleConciergeCard
          topic={`${page.serviceName} ${page.cityName}`}
          cityName={page.cityName}
          serviceCode={page.serviceSlug}
        />

        {/* Content "Co warto wiedzieć" */}
        {page.contentHtml && (
          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
            <style>{`
              .pseo-content h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; }
              .pseo-content ul { list-style: disc; padding-left: 1.25rem; }
              .pseo-content li { margin-bottom: 0.5rem; color: #334155; }
            `}</style>
            <div
              className="pseo-content"
              dangerouslySetInnerHTML={{ __html: page.contentHtml }}
            />
          </section>
        )}

        {/* FAQ */}
        {page.faq?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Najczęstsze pytania – {page.serviceName} w {page.cityName}
            </h2>
            <div className="space-y-3">
              {page.faq.map((f, idx) => (
                <details
                  key={idx}
                  className="rounded-lg border bg-white p-4 shadow-sm open:shadow-md"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900">
                    {f.question}
                  </summary>
                  <p className="mt-2 text-slate-700 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 border border-indigo-100 p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {page.serviceName} w {page.cityName} – zacznij od bezpłatnej wyceny
          </h2>
          <p className="text-slate-700 max-w-xl mx-auto mb-5">
            Opisz problem, my w kilka minut dopasujemy zaufanego wykonawcę z {page.cityName}.
          </p>
          <Link
            to={ctaHref}
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-indigo-700 transition"
          >
            Zamów wykonawcę →
          </Link>
        </section>
      </main>
    </div>
  );
}
