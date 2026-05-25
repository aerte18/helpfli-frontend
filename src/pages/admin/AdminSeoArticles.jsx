import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  adminListSeoArticles,
  adminGenerateArticle,
  adminGenerateSeed,
  adminUpdateArticle,
  adminDeleteArticle,
  adminListSeoTopics
} from '@/api/seo';

/**
 * /admin/seo — panel zarządzania AI SEO Engine.
 *
 * Funkcje:
 *  - przycisk „Wygeneruj poradnik" (własny temat),
 *  - przycisk „Wygeneruj 10 z seed listy" (bootstrap startowych temat\u00f3w),
 *  - lista wygenerowanych artykuł\u00f3w: filtry, publikacja, edycja, usuwanie,
 *  - podgląd źr\u00f3dłowej listy seed-temat\u00f3w (kt\u00f3re czekają na wygenerowanie).
 */

const CATEGORY_OPTIONS = [
  '', 'agd', 'hydraulik', 'elektryk', 'ogrzewanie', 'klimatyzacja',
  'remont', 'stolarz', 'sprzatanie', 'dezynsekcja', 'ogrod', 'it', 'porady'
];

export default function AdminSeoArticles() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ q: '', category: '', published: '' });

  const [topic, setTopic] = useState('');
  const [hintCategory, setHintCategory] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [topicsList, setTopicsList] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListSeoArticles({
        page,
        limit: 30,
        q: filter.q || '',
        category: filter.category || '',
        published:
          filter.published === '' ? undefined : filter.published === 'true'
      });
      setItems(data?.items || []);
      setPagination(data?.pagination || null);
    } catch (e) {
      console.warn('SEO admin reload failed:', e.message);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    reload();
  }, [reload]);

  const reloadTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const data = await adminListSeoTopics();
      setTopicsList(data?.topics || []);
    } catch {
      setTopicsList([]);
    } finally {
      setTopicsLoading(false);
    }
  }, []);
  useEffect(() => {
    reloadTopics();
  }, [reloadTopics]);

  async function handleGenerate(e) {
    e?.preventDefault?.();
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const data = await adminGenerateArticle({
        topic: cleanTopic,
        hints: hintCategory ? { category: hintCategory } : undefined,
        publish: publishImmediately
      });
      setGenResult({
        ok: true,
        slug: data?.article?.slug,
        provider: data?.provider,
        created: data?.created
      });
      setTopic('');
      reload();
      reloadTopics();
    } catch (err) {
      setGenResult({ ok: false, error: err.message || 'Błąd generowania' });
    } finally {
      setGenerating(false);
    }
  }

  async function handleBulkSeed() {
    setBulkBusy(true);
    setGenResult(null);
    try {
      const data = await adminGenerateSeed({
        count: Math.min(50, Math.max(1, Number(bulkCount) || 5)),
        publish: publishImmediately
      });
      setGenResult({
        ok: true,
        bulk: true,
        planned: data?.planned ?? 0,
        results: data?.results || []
      });
      reload();
      reloadTopics();
    } catch (err) {
      setGenResult({ ok: false, error: err.message || 'Błąd generowania masowego' });
    } finally {
      setBulkBusy(false);
    }
  }

  async function togglePublished(article) {
    try {
      await adminUpdateArticle(article._id, { published: !article.published });
      reload();
    } catch (e) {
      alert(e.message || 'Błąd zmiany publikacji');
    }
  }

  async function removeArticle(article) {
    if (!confirm(`Usunąć poradnik „${article.title}"?`)) return;
    try {
      await adminDeleteArticle(article._id);
      reload();
      reloadTopics();
    } catch (e) {
      alert(e.message || 'Błąd usuwania');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">AI SEO Engine — Poradniki</h1>
        <Link to="/poradniki" target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline">
          Otwórz publiczną listę →
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        Generujemy poradniki AI pod konkretne frazy (kody błędów AGD, „cieknący kran", „ile kosztuje hydraulik"). Domyślnie zapisują się jako drafty — po przejrzeniu zaznacz „Opublikuj".
      </p>

      {/* === Generator === */}
      <section className="bg-white rounded-2xl shadow p-4 sm:p-5 space-y-4">
        <h2 className="text-lg font-semibold">Wygeneruj poradnik</h2>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-[1fr,200px,auto] gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="np. pralka e20, kran cieknie, ile kosztuje hydraulik Warszawa"
            className="rounded-lg border border-slate-300 px-3 py-2"
            disabled={generating || bulkBusy}
          />
          <select
            value={hintCategory}
            onChange={(e) => setHintCategory(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
            disabled={generating || bulkBusy}
          >
            <option value="">Kategoria — auto</option>
            {CATEGORY_OPTIONS.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={generating || bulkBusy || topic.trim().length < 3}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? 'Generuję…' : 'Wygeneruj'}
          </button>
        </form>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={publishImmediately}
            onChange={(e) => setPublishImmediately(e.target.checked)}
          />
          Publikuj od razu (pomiń draft)
        </label>

        {/* Bulk seed */}
        <div className="border-t pt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-700">Bootstrap z seed listy:</span>
          <input
            type="number"
            min={1}
            max={50}
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
            className="w-20 rounded-lg border border-slate-300 px-3 py-2"
            disabled={generating || bulkBusy}
          />
          <button
            type="button"
            onClick={handleBulkSeed}
            disabled={generating || bulkBusy}
            className="bg-emerald-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {bulkBusy ? 'Generuję…' : `Wygeneruj ${bulkCount} z seed listy`}
          </button>
          <span className="text-xs text-slate-500">
            (top tematy: pralka e20, zmywarka e24, cieknący kran, koszt hydraulika Warszawa…)
          </span>
        </div>

        {/* Status */}
        {genResult && (
          <div
            className={`rounded-lg p-3 text-sm ${
              genResult.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}
          >
            {genResult.ok ? (
              genResult.bulk ? (
                <>
                  <div className="font-semibold mb-1">
                    Zapleciono {genResult.planned} temat(ów):
                  </div>
                  <ul className="list-disc pl-5">
                    {(genResult.results || []).slice(0, 10).map((r, i) => (
                      <li key={i}>
                        {r.ok ? (
                          <>
                            ✓ <span className="font-mono">{r.slug}</span> ({r.provider})
                          </>
                        ) : (
                          <>✗ {r.topic}: {r.error}</>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  Wygenerowano ({genResult.provider}).{' '}
                  <Link
                    to={`/poradnik/${genResult.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold"
                  >
                    Otwórz podgląd
                  </Link>
                </>
              )
            ) : (
              <>Błąd: {genResult.error}</>
            )}
          </div>
        )}
      </section>

      {/* === Filtry + lista === */}
      <section className="bg-white rounded-2xl shadow p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={filter.q}
            onChange={(e) => {
              setFilter((f) => ({ ...f, q: e.target.value }));
              setPage(1);
            }}
            placeholder="Szukaj…"
            className="rounded-lg border border-slate-300 px-3 py-2 flex-1 min-w-[200px]"
          />
          <select
            value={filter.category}
            onChange={(e) => {
              setFilter((f) => ({ ...f, category: e.target.value }));
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">Wszystkie kategorie</option>
            {CATEGORY_OPTIONS.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filter.published}
            onChange={(e) => {
              setFilter((f) => ({ ...f, published: e.target.value }));
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">Wszystkie statusy</option>
            <option value="true">Tylko opublikowane</option>
            <option value="false">Tylko drafty</option>
          </select>
          <button
            type="button"
            onClick={reload}
            className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200"
          >
            Odśwież
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-3">Tytuł</th>
                <th className="py-2 pr-3">Kategoria</th>
                <th className="py-2 pr-3">Słów</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Wyśw.</th>
                <th className="py-2 pr-3">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">Ładowanie…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">Brak artykułów.</td></tr>
              ) : (
                items.map((a) => (
                  <tr key={a._id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-3">
                      <Link
                        to={`/poradnik/${a.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {a.title}
                      </Link>
                      <div className="text-xs text-slate-400 font-mono">/poradnik/{a.slug}</div>
                    </td>
                    <td className="py-2 pr-3">{a.category}</td>
                    <td className="py-2 pr-3">{a.wordCount || '—'}</td>
                    <td className="py-2 pr-3">
                      {a.published ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                          opublikowany
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                          draft
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-600">{a.aiProvider || '—'}</td>
                    <td className="py-2 pr-3">{a.views || 0}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => togglePublished(a)}
                          className={`text-xs rounded px-2 py-1 ${
                            a.published
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {a.published ? 'Cofnij publikację' : 'Opublikuj'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeArticle(a)}
                          className="text-xs rounded px-2 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200"
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg text-sm border ${
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
      </section>

      {/* === Seed topics queue === */}
      <section className="bg-white rounded-2xl shadow p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Tematy z seed listy</h2>
          <button
            type="button"
            onClick={reloadTopics}
            className="text-sm text-slate-600 hover:underline"
          >
            Odśwież
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Te tematy są zdefiniowane w <code>backend/utils/seoTopics.js</code> i służą jako pula dla cronu. Możesz wygenerować dowolny pojedynczo wpisując go wyżej.
        </p>
        {topicsLoading ? (
          <div className="text-sm text-slate-500">Ładowanie…</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {topicsList.map((t) => (
              <li
                key={t.topic}
                className={`rounded border p-2 flex items-center justify-between gap-2 ${
                  t.existing ? 'bg-slate-50 text-slate-500' : 'bg-white'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.topic}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">{t.category}</div>
                </div>
                {t.existing ? (
                  <span className="text-xs">
                    {t.existing.published ? '✓ opublikowany' : '• draft'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTopic(t.topic);
                      setHintCategory(t.category || '');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs bg-indigo-600 text-white rounded px-2 py-1 hover:bg-indigo-700"
                  >
                    Wygeneruj
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
