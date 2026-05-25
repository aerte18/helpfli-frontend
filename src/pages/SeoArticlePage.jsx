import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSeoArticle } from '@/api/seo';
import LiveStatsCard from '@/components/seo/LiveStatsCard';
import ArticleConciergeCard from '@/components/seo/ArticleConciergeCard';

/**
 * /poradnik/:slug — strona generowana przez AI SEO Engine Helpfli.
 *
 * Cele:
 *  - czytelny artykuł (hero, spis treści, treść HTML, FAQ, CTA),
 *  - pełny SEO: <title>, meta description, canonical, OpenGraph/Twitter,
 *    JSON-LD typu Article + FAQPage,
 *  - CTA „Znajdź wykonawcę" które prowadzi do /create-order
 *    (z prefiksem usługi/kategorii i opcjonalnie miasta z artykułu).
 */

const SITE_URL =
  (typeof window !== 'undefined' && window.__HELPFLI_SITE_URL__) ||
  'https://helpfli.pl';

function buildArticleJsonLd(article, canonicalUrl) {
  if (!article) return null;
  const datePub = article.publishedAt || article.createdAt || new Date().toISOString();
  const dateMod = article.lastReviewedAt || article.updatedAt || datePub;
  // E-E-A-T: zwracamy autora (Organization lub konkretny Person jeśli reviewedByName ustawione)
  const authorNode = article.reviewedByName
    ? [
        { '@type': 'Person', name: article.reviewedByName, worksFor: { '@type': 'Organization', name: 'Helpfli' } },
        { '@type': 'Organization', name: 'Helpfli' }
      ]
    : { '@type': 'Organization', name: article.author || 'Helpfli' };

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.problem || article.tldr || '',
    datePublished: datePub,
    dateModified: dateMod,
    inLanguage: 'pl-PL',
    keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : undefined,
    author: authorNode,
    publisher: {
      '@type': 'Organization',
      name: 'Helpfli',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-192x192.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    image: article.heroImage || `${SITE_URL}/icons/icon-192x192.png`,
    // AEO/GEO – ChatGPT/Perplexity wykrywają abstract jako gotową odpowiedź do cytowania
    abstract: article.tldr || undefined
  };
}

/**
 * schema.org/HowTo — rich snippet w Google z numerami kroków
 * Generujemy tylko jeśli artykuł ma sensowne howtoSteps (≥3) — w przeciwnym razie
 * zostawiamy `null`, żeby nie wprowadzać Google w błąd ("howto" musi być rzeczywiście how-to).
 */
function buildHowToJsonLd(article, canonicalUrl) {
  if (!article?.howtoSteps || article.howtoSteps.length < 3) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: article.title,
    description: article.tldr || article.metaDescription || article.problem || '',
    inLanguage: 'pl-PL',
    totalTime: article.howtoTotalTimeMinutes ? `PT${article.howtoTotalTimeMinutes}M` : undefined,
    step: article.howtoSteps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text || s.name,
      url: `${canonicalUrl}#krok-${i + 1}`
    }))
  };
}

function buildFaqJsonLd(article) {
  if (!article?.faq || article.faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  };
}

function buildBreadcrumbJsonLd(article, canonicalUrl) {
  if (!article) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Strona główna', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Poradniki', item: `${SITE_URL}/poradniki` },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl }
    ]
  };
}

function buildCreateOrderHref(article) {
  if (!article) return '/create-order';
  const params = new URLSearchParams();
  const service = (article.relatedServiceCodes || [])[0];
  if (service) params.set('service', service);
  else if (article.category && article.category !== 'porady') params.set('category', article.category);
  if (article.ctaCity) params.set('city', article.ctaCity);
  const qs = params.toString();
  return qs ? `/create-order?${qs}` : '/create-order';
}

export default function SeoArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchSeoArticle(slug)
      .then((data) => {
        if (!active) return;
        setArticle(data?.article || null);
        setRelated(Array.isArray(data?.related) ? data.related : []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 404) setError('not_found');
        else setError('server');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  const canonicalUrl = useMemo(() => `${SITE_URL}/poradnik/${slug}`, [slug]);
  const articleLd = useMemo(() => buildArticleJsonLd(article, canonicalUrl), [article, canonicalUrl]);
  const faqLd = useMemo(() => buildFaqJsonLd(article), [article]);
  const crumbLd = useMemo(() => buildBreadcrumbJsonLd(article, canonicalUrl), [article, canonicalUrl]);
  const howtoLd = useMemo(() => buildHowToJsonLd(article, canonicalUrl), [article, canonicalUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-slate-500">Ładowanie poradnika…</div>
      </div>
    );
  }

  if (error === 'not_found' || !article) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <Helmet>
          <title>Poradnik nie znaleziony — Helpfli</title>
          <meta name="robots" content="noindex,follow" />
        </Helmet>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Nie znaleźliśmy tego poradnika</h1>
          <p className="text-slate-600 mb-6">
            Mógł zostać usunięty lub adres jest błędny. Sprawdź pełną listę porad.
          </p>
          <Link
            to="/poradniki"
            className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700"
          >
            Zobacz wszystkie poradniki
          </Link>
        </div>
      </div>
    );
  }

  if (error === 'server') {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-rose-600">
          Wystąpił błąd podczas pobierania poradnika. Spróbuj ponownie za chwilę.
        </div>
      </div>
    );
  }

  const metaTitle = article.metaTitle || article.title;
  const metaDescription = article.metaDescription || article.problem || article.intro || '';
  const ogImage = article.heroImage || `${SITE_URL}/icons/icon-192x192.png`;
  const ctaHref = buildCreateOrderHref(article);
  const toc = Array.isArray(article.toc) ? article.toc : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Helpfli" />
        <meta property="og:locale" content="pl_PL" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={ogImage} />

        {articleLd && <script type="application/ld+json">{JSON.stringify(articleLd)}</script>}
        {faqLd && <script type="application/ld+json">{JSON.stringify(faqLd)}</script>}
        {howtoLd && <script type="application/ld+json">{JSON.stringify(howtoLd)}</script>}
        {crumbLd && <script type="application/ld+json">{JSON.stringify(crumbLd)}</script>}

        {/* E-E-A-T meta — Google + AI search lubią jednoznaczne authorship/dates */}
        <meta name="author" content={article.reviewedByName || article.author || 'Zespół Helpfli'} />
        {article.lastReviewedAt && (
          <meta name="article:modified_time" content={new Date(article.lastReviewedAt).toISOString()} />
        )}
        {article.publishedAt && (
          <meta name="article:published_time" content={new Date(article.publishedAt).toISOString()} />
        )}
      </Helmet>

      {/* Hero */}
      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-indigo-100/80 mb-4">
            <Link to="/" className="hover:underline">Strona główna</Link>
            <span className="mx-1.5">/</span>
            <Link to="/poradniki" className="hover:underline">Poradniki</Link>
          </nav>
          <div className="text-xs uppercase tracking-wider text-indigo-200 mb-2">
            {article.category}
            {article.readingTime ? ` • ${article.readingTime} min czytania` : ''}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">{article.title}</h1>
          {article.intro && <p className="text-lg text-indigo-100">{article.intro}</p>}

          {/* E-E-A-T badge — autorstwo + data ostatniej weryfikacji */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-indigo-100/90">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300" />
              {article.reviewedByName
                ? `Zweryfikowane przez ${article.reviewedByName}`
                : `Opracowane przez ${article.author || 'Zespół Helpfli'}`}
            </span>
            {article.lastReviewedAt && (
              <span>
                · Ostatnia aktualizacja:{' '}
                {new Date(article.lastReviewedAt).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        {/* AEO/GEO – TL;DR box: krótka, faktograficzna odpowiedź wprost.
            Cytowane przez ChatGPT/Perplexity i wyświetlane przez Google jako featured snippet. */}
        {article.tldr && (
          <aside
            aria-label="Krótka odpowiedź"
            className="mb-8 rounded-2xl border-l-4 border-emerald-500 bg-emerald-50/70 p-5 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mb-1">
              Krótka odpowiedź
            </div>
            <p className="text-slate-800 leading-relaxed">{article.tldr}</p>
          </aside>
        )}

        {/* Live stats – unikalne dane Helpfli (E-E-A-T), pokazujemy gdy mamy
            choć usługę albo miasto. Komponent sam się ukryje gdy zero danych. */}
        {(article.ctaCity || (article.relatedServiceCodes && article.relatedServiceCodes[0])) && (
          <div className="mb-8">
            <LiveStatsCard
              service={(article.relatedServiceCodes || [])[0] || null}
              cityName={article.ctaCity || null}
            />
          </div>
        )}

        {/* TOC */}
        {toc.length > 1 && (
          <aside className="mb-8 rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900 mb-2">Spis treści</div>
            <ol className="text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-indigo-600 hover:underline">
                    {t.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
        )}

        {/* Content – własne style „prose-like" bez plug-inu Tailwind typography */}
        <style>{`
          .helpfli-article { color: #1f2937; line-height: 1.75; }
          .helpfli-article h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-top: 2rem; margin-bottom: 0.75rem; scroll-margin-top: 5rem; }
          .helpfli-article h3 { font-size: 1.2rem; font-weight: 600; color: #0f172a; margin-top: 1.5rem; margin-bottom: 0.5rem; }
          .helpfli-article p { margin: 0.75rem 0; }
          .helpfli-article ul, .helpfli-article ol { padding-left: 1.25rem; margin: 0.75rem 0; }
          .helpfli-article ul { list-style: disc; }
          .helpfli-article ol { list-style: decimal; }
          .helpfli-article li { margin: 0.25rem 0; }
          .helpfli-article a { color: #4f46e5; text-decoration: underline; }
          .helpfli-article a:hover { color: #4338ca; }
          .helpfli-article table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.95rem; }
          .helpfli-article th, .helpfli-article td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
          .helpfli-article th { background: #f1f5f9; font-weight: 600; }
          .helpfli-article aside[data-helpfli-cta] { display: none; } /* CTA renderujemy własną sekcję poniżej */
        `}</style>
        <article
          className="helpfli-article"
          // contentHtml jest sanity-stripped na backendzie (sanitizeArticleHtml),
          // LLM ma instrukcję nie używać <script>/<img>/<iframe>.
          dangerouslySetInnerHTML={{ __html: article.contentHtml || '' }}
        />

        {/* AI Concierge embed – mid-article konwersja na lead.
            Wstawiamy PO contentHtml, ale PRZED FAQ — to optymalne miejsce na CTA
            wg standardów contentu (czytelnik już zaangażowany). */}
        <div className="mt-10">
          <ArticleConciergeCard
            topic={article.topic || article.title}
            cityName={article.ctaCity || null}
            serviceCode={(article.relatedServiceCodes || [])[0] || null}
          />
        </div>

        {/* FAQ */}
        {article.faq?.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Najczęstsze pytania</h2>
            <div className="space-y-3">
              {article.faq.map((f, idx) => (
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

        {/* CTA */}
        <section className="mt-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 border border-indigo-100 p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Nie chcesz robić sam?
          </h2>
          <p className="text-slate-700 max-w-xl mx-auto mb-5">
            Helpfli w kilka minut dopasuje Ci sprawdzonego wykonawcę z okolicy
            {article.ctaCity ? ` (${article.ctaCity})` : ''}. Opisz problem, my zajmiemy się
            resztą.
          </p>
          <Link
            to={ctaHref}
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-indigo-700 transition"
          >
            Znajdź wykonawcę
          </Link>
          <div className="mt-3 text-xs text-slate-500">
            Darmowa wycena · Bez zobowiązań · Tylko zweryfikowani fachowcy
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Zobacz też</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/poradnik/${r.slug}`}
                    className="block rounded-lg border bg-white p-4 hover:shadow-md transition"
                  >
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                      {r.category}
                      {r.readingTime ? ` • ${r.readingTime} min` : ''}
                    </div>
                    <div className="font-semibold text-slate-900">{r.title}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
