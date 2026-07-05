import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSeoLocalPage } from '@/api/seo';
import LiveStatsCard from '@/components/seo/LiveStatsCard';
import ArticleConciergeCard from '@/components/seo/ArticleConciergeCard';
import SEOHead from '@/components/SEOHead';
import { SITE_URL } from '@/utils/siteUrl';

/**
 * /wykonawcy/:service/:city – Programmatic SEO landing page (PSEO).
 *
 * Strona generowana per kombinacja usługa × miasto na podstawie LLM (unikalna treść)
 * + LIVE statystyk marketplace Helpfli (realne liczby z bazy). To dramatycznie
 * zwiększa pokrycie longtail keywordów (np. „hydraulik warszawa cena", „elektryk kraków na już").
 */

function buildSeoMeta(page) {
  const serviceName = page.serviceName;
  const cityName = page.cityName;
  const fallbackTitle = `${serviceName} ${cityName} | Helpfli`;
  const fallbackDescription = `Znajdź sprawdzonych wykonawców: ${serviceName} w mieście ${cityName}. Porównaj oferty, opinie i wybierz fachowca w Helpfli.`;
  return {
    title: page.metaTitle?.trim() || fallbackTitle,
    description: page.metaDescription?.trim() || fallbackDescription,
    h1: page.title?.trim() || `${serviceName} w mieście ${cityName}`,
  };
}

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

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Helpfli – ${page.serviceName} ${page.cityName}`,
    description: buildSeoMeta(page).description,
    url: canonicalUrl,
    areaServed: {
      '@type': 'City',
      name: page.cityName
    },
    image: `${SITE_URL}/icons/icon-192x192.png`,
    priceRange: snap?.prices?.median ? `${snap.prices.min}-${snap.prices.max} PLN` : undefined
  };

  return ld;
}

function buildBreadcrumbJsonLd(page, canonicalUrl) {
  if (!page) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Strona główna', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: page.serviceName, item: `${SITE_URL}/wykonawcy` },
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

function buildFallbackSeoContent(page) {
  const { serviceName, cityName } = page;
  return [
    `Szukasz ${serviceName.toLowerCase()} w ${cityName}? W Helpfli możesz szybko porównać dostępnych wykonawców, sprawdzić opinie i zamówić usługę online — bez dzwonienia do dziesiątek firm.`,
    `Na tej stronie znajdziesz aktualne informacje o ${serviceName.toLowerCase()} w ${cityName}: średnie ceny, liczbę dostępnych fachowców oraz odpowiedzi na najczęstsze pytania. Dzięki temu łatwiej wybierzesz wykonawcę dopasowanego do Twojego problemu i budżetu.`,
    `Helpfli łączy klientów ze sprawdzonymi wykonawcami w ${cityName}. Opisz swój problem, a my pomożemy Ci znaleźć odpowiedniego specjalistę — szybko, wygodnie i bezpiecznie.`,
  ];
}

function buildFallbackFaq(page) {
  const { serviceName, cityName } = page;
  return [
    {
      question: `Ile kosztuje ${serviceName.toLowerCase()} w ${cityName}?`,
      answer: `Cena zależy od zakresu prac i pilności zlecenia. W Helpfli możesz porównać oferty kilku wykonawców w ${cityName} i wybrać najlepszą opcję.`,
    },
    {
      question: `Jak szybko znajdę wykonawcę w ${cityName}?`,
      answer: `Po opisaniu problemu dopasowujemy dostępnych fachowców w Twojej okolicy. W wielu przypadkach pierwsze oferty pojawiają się w ciągu kilkunastu minut.`,
    },
    {
      question: `Czy wykonawcy w Helpfli są weryfikowani?`,
      answer: `Tak — na platformie możesz sprawdzić opinie innych klientów, oceny oraz profile wykonawców, zanim zdecydujesz się na współpracę.`,
    },
  ];
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
  const canonicalPath = `/wykonawcy/${service}/${city}`;
  const seoMeta = useMemo(() => (page ? buildSeoMeta(page) : null), [page]);

  const faqLd = useMemo(() => buildFaqJsonLd(page), [page]);
  const localLd = useMemo(
    () => (page ? buildLocalBusinessJsonLd(page, snap, `${SITE_URL}${canonicalPath}`) : null),
    [page, snap, canonicalPath]
  );
  const crumbLd = useMemo(
    () => (page ? buildBreadcrumbJsonLd(page, `${SITE_URL}${canonicalPath}`) : null),
    [page, canonicalPath]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Ładowanie…</div>
      </div>
    );
  }
  if (error || !page || !seoMeta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-10 text-center">
        <SEOHead title="Nie znaleziono strony | Helpfli" robots="noindex,follow" />
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Nie znaleziono strony</h1>
        <p className="text-slate-600 max-w-md mb-5">{error || 'Spróbuj wybrać inne miasto lub usługę.'}</p>
        <Link to="/poradniki" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold">
          Wróć do poradników
        </Link>
      </div>
    );
  }

  const ctaHref = buildCreateOrderHref(page);
  const fallbackParagraphs = buildFallbackSeoContent(page);
  const faqItems = page.faq?.length ? page.faq : buildFallbackFaq(page);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead
        title={seoMeta.title}
        description={seoMeta.description}
        canonical={canonicalPath}
        ogImage="/icons/icon-192x192.png"
      >
        {faqLd && <script type="application/ld+json">{JSON.stringify(faqLd)}</script>}
        {localLd && <script type="application/ld+json">{JSON.stringify(localLd)}</script>}
        {crumbLd && <script type="application/ld+json">{JSON.stringify(crumbLd)}</script>}
      </SEOHead>

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
            {seoMeta.h1}
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
        <LiveStatsCard
          service={page.serviceSlug}
          citySlug={page.citySlug}
          cityName={page.cityName}
        />

        <ArticleConciergeCard
          topic={`${page.serviceName} ${page.cityName}`}
          cityName={page.cityName}
          serviceCode={page.serviceSlug}
        />

        {page.contentHtml ? (
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
        ) : (
          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              {page.serviceName} w {page.cityName} – co warto wiedzieć
            </h2>
            {fallbackParagraphs.map((paragraph, idx) => (
              <p key={idx} className="text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        )}

        {faqItems.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Najczęstsze pytania – {page.serviceName} w {page.cityName}
            </h2>
            <div className="space-y-3">
              {faqItems.map((f, idx) => (
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
