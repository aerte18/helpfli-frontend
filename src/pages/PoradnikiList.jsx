import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSeoArticles, fetchSeoCategories } from '@/api/seo';

/**
 * /poradniki — publiczna lista poradników AI.
 *
 * Cele:
 *  - hub SEO (Google indeksuje, internal linking),
 *  - filtr po kategorii + wyszukiwarka tekstowa,
 *  - każdy element prowadzi do `/poradnik/:slug`.
 */

const SITE_URL =
  (typeof window !== 'undefined' && window.__HELPFLI_SITE_URL__) || 'https://helpfli.pl';

const CATEGORY_LABELS = {
  agd: 'AGD',
  hydraulik: 'Hydraulik',
  elektryk: 'Elektryk',
  ogrzewanie: 'Ogrzewanie',
  klimatyzacja: 'Klimatyzacja',
  remont: 'Remont',
  stolarz: 'Stolarz',
  sprzatanie: 'Sprzątanie',
  dezynsekcja: 'Dezynsekcja',
  ogrod: 'Ogród',
  it: 'IT',
  porady: 'Porady',
  inne: 'Inne'
};

export default function PoradnikiList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(q);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchSeoArticles({ page, limit: 12, category, q }).catch(() => null),
      fetchSeoCategories().catch(() => null)
    ])
      .then(([list, cats]) => {
        if (!active) return;
        setItems(list?.items || []);
        setPagination(list?.pagination || null);
        setCategories(cats?.categories || []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, category, q]);

  const canonical = useMemo(() => {
    const base = `${SITE_URL}/poradniki`;
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [category, q, page]);

  function setCategory(next) {
    const np = new URLSearchParams(searchParams);
    if (next) np.set('category', next);
    else np.delete('category');
    np.set('page', '1');
    setSearchParams(np);
  }

  function submitSearch(e) {
    e.preventDefault();
    const np = new URLSearchParams(searchParams);
    const value = searchTerm.trim();
    if (value) np.set('q', value);
    else np.delete('q');
    np.set('page', '1');
    setSearchParams(np);
  }

  function gotoPage(p) {
    const np = new URLSearchParams(searchParams);
    np.set('page', String(p));
    setSearchParams(np);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Poradniki Helpfli — wiedza od fachowców i AI</title>
        <meta
          name="description"
          content="Poradniki Helpfli: kody błędów AGD, naprawa hydrauliczna i elektryczna, koszty usług w polskich miastach. Sprawdź porady i znajdź wykonawcę."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Poradniki Helpfli — wiedza od fachowców i AI" />
        <meta property="og:description" content="Sprawdzone porady, kody błędów AGD, koszty hydraulika i elektryka w Twoim mieście." />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Poradniki Helpfli</h1>
          <p className="text-indigo-100 max-w-2xl">
            Codzienne problemy: pralka, zmywarka, lodówka, hydraulik, elektryk, remont.
            Sprawdź jak rozwiązać samodzielnie albo szybko znajdź zaufanego wykonawcę.
          </p>

          <form onSubmit={submitSearch} className="mt-6 flex gap-2 max-w-xl">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj poradnika (np. pralka e20, kran cieknie)"
              className="flex-1 rounded-lg px-4 py-2 text-slate-900"
            />
            <button
              type="submit"
              className="rounded-lg bg-white text-indigo-700 font-semibold px-4 py-2 hover:bg-indigo-50"
            >
              Szukaj
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                !category
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Wszystkie
            </button>
            {categories.map((c) => (
              <button
                type="button"
                key={c.category}
                onClick={() => setCategory(c.category)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  category === c.category
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {CATEGORY_LABELS[c.category] || c.category} ({c.count})
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Ładowanie poradników…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            Brak poradników{q ? ` dla zapytania „${q}"` : ''}. Wróć za chwilę — AI pracuje.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((a) => (
              <li key={a.slug}>
                <Link
                  to={`/poradnik/${a.slug}`}
                  className="block h-full rounded-xl border bg-white p-5 hover:shadow-md transition"
                >
                  <div className="text-xs uppercase tracking-wider text-indigo-600 font-semibold mb-2">
                    {CATEGORY_LABELS[a.category] || a.category}
                    {a.readingTime ? ` • ${a.readingTime} min` : ''}
                  </div>
                  <div className="font-semibold text-slate-900 mb-2 leading-snug">{a.title}</div>
                  {a.metaDescription && (
                    <p className="text-sm text-slate-600 line-clamp-3">{a.metaDescription}</p>
                  )}
                  <div className="mt-3 text-xs text-slate-400">
                    {a.views ? `${a.views} wyświetleń` : 'Nowy poradnik'}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => gotoPage(p)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  p === pagination.page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
