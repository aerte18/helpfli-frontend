import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listMarketingContent,
  generateMarketingContent,
  updateMarketingContent,
  deleteMarketingContent
} from '@/api/marketingContent';

/**
 * /admin/content — panel Marketing Automation (etap 1: MVP, bez auto-publikacji).
 *
 * Generujemy treści marketingowe AI pod social media i SEO snippets, zapisujemy
 * w bazie, kopiujemy ręcznie do TikToka/IG/FB. Bez API publikacji — świeże konta
 * social szybko dostają blokadę za API posty.
 */

const CATEGORY_OPTIONS = ['hydraulik', 'AGD', 'elektryk', 'remont', 'zmywarka', 'pralka'];

const CONTENT_TYPE_OPTIONS = [
  { value: 'tiktok_script', label: 'Skrypt TikToka' },
  { value: 'reel_script', label: 'Skrypt Reela' },
  { value: 'instagram_caption', label: 'Caption Instagram' },
  { value: 'facebook_post', label: 'Post Facebook' },
  { value: 'faq', label: 'FAQ (pytanie + odpowiedź)' },
  { value: 'cta', label: 'CTA (zachęta)' },
  { value: 'seo_snippet', label: 'SEO snippet (meta + tytuł)' }
];

const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Strona Helpfli' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Gotowe do publikacji' },
  { value: 'published', label: 'Opublikowane' }
];

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-700',
  ready: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-700'
};

const DEFAULT_FORM = {
  category: 'hydraulik',
  contentType: 'tiktok_script',
  platform: 'tiktok',
  topic: '',
  audience: '',
  city: '',
  tone: ''
};

export default function AdminContent() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState({
    q: '',
    status: '',
    category: '',
    platform: '',
    contentType: ''
  });
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const isVideoType = useMemo(
    () => form.contentType === 'tiktok_script' || form.contentType === 'reel_script',
    [form.contentType]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMarketingContent({
        page,
        limit: 30,
        q: filter.q || undefined,
        status: filter.status || undefined,
        category: filter.category || undefined,
        platform: filter.platform || undefined,
        contentType: filter.contentType || undefined
      });
      setItems(data?.items || []);
      setPagination(data?.pagination || null);
    } catch (err) {
      console.warn('admin/content list failed:', err.message);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    reload();
  }, [reload]);

  function updateForm(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function handleGenerate(e) {
    e?.preventDefault?.();
    const topic = form.topic.trim();
    if (topic.length < 3) {
      setGenMsg({ ok: false, error: 'Podaj temat (min. 3 znaki).' });
      return;
    }
    setGenerating(true);
    setGenMsg(null);
    try {
      const extra = {};
      if (form.audience.trim()) extra.audience = form.audience.trim();
      if (form.city.trim()) extra.city = form.city.trim();
      if (form.tone.trim()) extra.tone = form.tone.trim();

      const data = await generateMarketingContent({
        category: form.category,
        contentType: form.contentType,
        platform: form.platform,
        topic,
        extra: Object.keys(extra).length ? extra : undefined
      });
      setGenMsg({
        ok: true,
        provider: data?.provider,
        title: data?.item?.title
      });
      setForm((f) => ({ ...f, topic: '' }));
      reload();
    } catch (err) {
      setGenMsg({ ok: false, error: err.message || 'Błąd generowania' });
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(item) {
    const parts = [];
    if (item.hook) parts.push(item.hook);
    if (item.content) parts.push(item.content);
    if (item.cta) parts.push(item.cta);
    if (Array.isArray(item.hashtags) && item.hashtags.length) {
      parts.push(item.hashtags.map((h) => `#${h}`).join(' '));
    }
    const text = parts.filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item._id);
      setTimeout(() => setCopiedId((id) => (id === item._id ? null : id)), 1800);
    } catch (err) {
      alert('Nie udało się skopiować: ' + (err?.message || 'błąd schowka'));
    }
  }

  async function markPublished(item) {
    try {
      await updateMarketingContent(item._id, { status: 'published' });
      reload();
    } catch (err) {
      alert(err.message || 'Błąd aktualizacji');
    }
  }

  async function markReady(item) {
    try {
      await updateMarketingContent(item._id, { status: 'ready' });
      reload();
    } catch (err) {
      alert(err.message || 'Błąd aktualizacji');
    }
  }

  async function markDraft(item) {
    try {
      await updateMarketingContent(item._id, { status: 'draft' });
      reload();
    } catch (err) {
      alert(err.message || 'Błąd aktualizacji');
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Usunąć treść „${item.title || item.topic}"?`)) return;
    try {
      await deleteMarketingContent(item._id);
      reload();
    } catch (err) {
      alert(err.message || 'Błąd usuwania');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Marketing Automation — treści AI</h1>
        <span className="text-xs text-slate-500 max-w-md text-right">
          MVP: generujemy treść, zapisujemy w bazie, kopiujemy ręcznie do TikToka/IG/FB.
          Auto-publikacja przez API włączymy dopiero gdy konta będą rozgrzane.
        </span>
      </div>

      {/* Generator */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <h2 className="text-lg font-semibold">Wygeneruj treść AI</h2>

        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Kategoria</label>
              <select
                value={form.category}
                onChange={(e) => updateForm({ category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                disabled={generating}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Typ treści</label>
              <select
                value={form.contentType}
                onChange={(e) => updateForm({ contentType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                disabled={generating}
              >
                {CONTENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Platforma</label>
              <select
                value={form.platform}
                onChange={(e) => updateForm({ platform: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                disabled={generating}
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Temat</label>
            <input
              value={form.topic}
              onChange={(e) => updateForm({ topic: e.target.value })}
              placeholder='np. "Cieknący kran w kuchni", "Błąd E20 w pralce", "Kostka brukowa: ile kosztuje"'
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              disabled={generating}
            />
          </div>

          <details className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <summary className="cursor-pointer text-sm text-slate-700 select-none">
              Opcjonalne wskazówki (audience, miasto, ton)
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <input
                value={form.audience}
                onChange={(e) => updateForm({ audience: e.target.value })}
                placeholder="Grupa docelowa (np. właściciele mieszkań)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                disabled={generating}
              />
              <input
                value={form.city}
                onChange={(e) => updateForm({ city: e.target.value })}
                placeholder="Miasto (opcjonalnie)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                disabled={generating}
              />
              <input
                value={form.tone}
                onChange={(e) => updateForm({ tone: e.target.value })}
                placeholder="Ton (np. żartobliwy, ekspercki)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                disabled={generating}
              />
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={generating || form.topic.trim().length < 3}
              className="bg-indigo-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Generuję…' : 'Generuj AI'}
            </button>
            <button
              type="button"
              onClick={() => setForm(DEFAULT_FORM)}
              className="bg-slate-100 text-slate-700 rounded-xl px-4 py-2 hover:bg-slate-200"
              disabled={generating}
            >
              Wyczyść
            </button>
            {isVideoType && (
              <span className="text-xs text-slate-500">
                Skrypt video — AI doda też sugestię formatu (9:16, długość, hook).
              </span>
            )}
          </div>

          {genMsg && (
            <div
              className={`rounded-xl p-3 text-sm ${
                genMsg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              {genMsg.ok ? (
                <>
                  Wygenerowano ({genMsg.provider}) — {genMsg.title}. Zobacz listę poniżej.
                </>
              ) : (
                <>Błąd: {genMsg.error}</>
              )}
            </div>
          )}
        </form>
      </section>

      {/* Filtry */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={filter.q}
            onChange={(e) => {
              setFilter((f) => ({ ...f, q: e.target.value }));
              setPage(1);
            }}
            placeholder="Szukaj w treści…"
            className="rounded-xl border border-slate-300 px-3 py-2 flex-1 min-w-[200px]"
          />
          <select
            value={filter.category}
            onChange={(e) => {
              setFilter((f) => ({ ...f, category: e.target.value }));
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">Wszystkie kategorie</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filter.platform}
            onChange={(e) => {
              setFilter((f) => ({ ...f, platform: e.target.value }));
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">Wszystkie platformy</option>
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filter.contentType}
            onChange={(e) => {
              setFilter((f) => ({ ...f, contentType: e.target.value }));
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">Wszystkie typy</option>
            {CONTENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => {
              setFilter((f) => ({ ...f, status: e.target.value }));
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">Wszystkie statusy</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={reload}
            className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200"
          >
            Odśwież
          </button>
        </div>
      </section>

      {/* Lista kart */}
      <section className="space-y-3">
        {loading && items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Ładowanie…
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Brak treści. Wygeneruj pierwszą z formularza powyżej.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item._id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        STATUS_BADGE[item.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === item.status)?.label || item.status}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700">
                      {item.platform}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                      {item.contentType}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.aiProvider || 'manual'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold truncate">
                    {item.title || item.topic}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Temat: {item.topic} ·{' '}
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('pl-PL') : ''}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="bg-indigo-600 text-white rounded-xl px-3 py-1.5 text-sm font-medium hover:bg-indigo-700"
                  >
                    {copiedId === item._id ? 'Skopiowano ✓' : 'Kopiuj'}
                  </button>
                  {item.status !== 'ready' && (
                    <button
                      type="button"
                      onClick={() => markReady(item)}
                      className="bg-amber-100 text-amber-800 rounded-xl px-3 py-1.5 text-sm hover:bg-amber-200"
                    >
                      Gotowe
                    </button>
                  )}
                  {item.status !== 'published' ? (
                    <button
                      type="button"
                      onClick={() => markPublished(item)}
                      className="bg-emerald-100 text-emerald-700 rounded-xl px-3 py-1.5 text-sm hover:bg-emerald-200"
                    >
                      Oznacz jako opublikowane
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markDraft(item)}
                      className="bg-slate-100 text-slate-700 rounded-xl px-3 py-1.5 text-sm hover:bg-slate-200"
                    >
                      Cofnij publikację
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="bg-rose-100 text-rose-700 rounded-xl px-3 py-1.5 text-sm hover:bg-rose-200"
                  >
                    Usuń
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr,260px] gap-4">
                <div className="space-y-3 text-sm">
                  {item.hook && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Hook
                      </div>
                      <div className="whitespace-pre-wrap text-slate-800 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                        {item.hook}
                      </div>
                    </div>
                  )}
                  {item.content && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Treść
                      </div>
                      <div className="whitespace-pre-wrap text-slate-800 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                        {item.content}
                      </div>
                    </div>
                  )}
                  {item.cta && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        CTA
                      </div>
                      <div className="whitespace-pre-wrap text-slate-800 bg-indigo-50 rounded-xl border border-indigo-200 px-3 py-2">
                        {item.cta}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  {Array.isArray(item.hashtags) && item.hashtags.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Hashtagi
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.hashtags.map((h) => (
                          <span
                            key={h}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700"
                          >
                            #{h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.videoFormat && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Format video
                      </div>
                      <div className="text-slate-800 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                        {item.videoFormat}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Paginacja */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-1 flex-wrap pt-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded-xl text-sm border ${
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
    </div>
  );
}
