import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postConcierge } from '@/api/ai';

/**
 * Inline AI Concierge dla strony poradnika.
 *
 * Cel biznesowy: czytelnik artykułu (np. „pralka E20")
 * → opisuje problem własnymi słowami,
 * → AI proponuje rozwiązanie i CTA „Zlec wykonawcy" z prefillem,
 * → konwersja artykuł → lead.
 *
 * NB: nie wymaga logowania — AI Concierge analyze działa też dla anonimowych.
 */

const QUICK_PROMPTS = [
  'Mam dokładnie taki problem — co dalej?',
  'Ile mnie to będzie kosztować w Warszawie?',
  'Czy mogę sam to naprawić, czy potrzebuję fachowca?'
];

export default function ArticleConciergeWidget({ article }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  function buildContextPrefix() {
    if (!article) return '';
    const title = article.title || article.metaTitle || '';
    const category = article.category || '';
    return `[Kontekst poradnika: „${title}" (kategoria: ${category}). ` +
      `Użytkownik czyta ten poradnik i pyta:] `;
  }

  async function ask(text) {
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setResponse(null);
    try {
      const prefixed = buildContextPrefix() + text;
      const data = await postConcierge({ problemText: prefixed });
      setResponse(data);
    } catch (e) {
      setError(e.message || 'Nie udało się skontaktować z AI Concierge.');
    } finally {
      setBusy(false);
    }
  }

  function goCreateOrder() {
    const params = new URLSearchParams();
    if (article?.category) params.set('service', article.category);
    if (input) params.set('description', input.slice(0, 300));
    navigate(`/create-order${params.toString() ? `?${params.toString()}` : ''}`);
  }

  if (!open) {
    return (
      <section
        aria-label="AI Concierge — pomoc do poradnika"
        className="my-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-indigo-50 p-5"
        data-helpfli-block="ai-concierge"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-1">
              AI Concierge Helpfli
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Masz ten problem? Zapytaj naszego AI — odpowie w 5 sekund
            </h3>
            <p className="text-sm text-slate-700 mt-1">
              AI Concierge przeanalizuje Twój problem i podpowie, czy radzisz sobie sam, czy lepiej wezwać wykonawcę.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow hover:bg-indigo-700"
          >
            Zapytaj AI
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="AI Concierge — pomoc do poradnika"
      className="my-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
      data-helpfli-block="ai-concierge"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-indigo-700 font-semibold">
          AI Concierge Helpfli
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-800"
          aria-label="Zwiń AI Concierge"
        >
          Zwiń
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { setInput(p); ask(p); }}
            disabled={busy}
            className="text-xs rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100 text-slate-700 disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={article?.problem || 'Opisz swój problem w 1–2 zdaniach…'}
          className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => ask(input)}
          disabled={busy || input.length < 6}
          className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Analizuję…' : 'Zapytaj AI'}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-4 space-y-3">
          {response.diagnosis && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-800 whitespace-pre-wrap">
              <strong className="text-slate-900">Diagnoza AI:</strong>
              <div className="mt-1">{response.diagnosis}</div>
            </div>
          )}
          {Array.isArray(response.recommendations) && response.recommendations.length > 0 && (
            <ul className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-slate-800 list-disc pl-5">
              {response.recommendations.slice(0, 5).map((r, i) => (
                <li key={i}>{typeof r === 'string' ? r : r.text || r.title}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goCreateOrder}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Zleć wykonawcy z Helpfli
            </button>
            <button
              type="button"
              onClick={() => { setResponse(null); setInput(''); }}
              className="bg-white border text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Zadaj inne pytanie
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
