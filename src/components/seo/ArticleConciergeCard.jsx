import { useState } from 'react';
import { openAI } from '@/ai/chat/bus';

/**
 * ArticleConciergeCard
 * --------------------
 * Premium-styled CTA, który otwiera UnifiedAIConcierge (globalny widget w App.jsx,
 * podłączony do `attachBus={true}`) z wstępnie wypełnionym kontekstem artykułu.
 *
 * Czemu to jest game-changer dla SEO:
 *  - Większość czytelników poradników nie konwertuje (klikają, czytają, wychodzą).
 *  - Tu konwertujemy poprzez rozmowę: pytanie → AI Concierge prowadzi rozmowę →
 *    szkic zlecenia → wybór wykonawcy. To dramatycznie podnosi article-to-lead.
 *  - Konkurencja (Fixly/Oferteo) NIE ma tego stacku — to nasz unikat.
 */
export default function ArticleConciergeCard({
  topic = '',
  cityName = null,
  serviceCode = null
}) {
  const [customQuestion, setCustomQuestion] = useState('');

  function buildPrefill(extra = '') {
    const parts = [];
    if (topic) parts.push(`Czytałem poradnik o: ${topic}.`);
    if (cityName) parts.push(`Lokalizacja: ${cityName}.`);
    if (extra) parts.push(extra);
    parts.push('Pomóż mi rozwiązać problem lub znajdź odpowiedniego wykonawcę.');
    return parts.join(' ');
  }

  function openWithPrefill(extra) {
    openAI('modal', buildPrefill(extra));
  }

  const quickQuestions = [
    'Czy mogę zrobić to samodzielnie?',
    cityName ? `Znajdź wykonawcę w ${cityName}` : 'Znajdź wykonawcę w mojej okolicy',
    'Ile to mniej więcej kosztuje?',
    'Jak szybko ktoś może przyjechać?'
  ];

  return (
    <section
      aria-label="Zapytaj AI Helpfli"
      className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white p-6 sm:p-7 shadow-lg"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-xl" aria-hidden>
          ✨
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-indigo-100 mb-0.5">
            AI Concierge Helpfli
          </div>
          <h2 className="text-xl sm:text-2xl font-bold leading-snug">
            Masz konkretny problem? Zapytaj AI
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            Opisz problem — AI doradzi, czy poradzisz sobie sam, a jeśli nie — w ciągu chwili
            znajdzie zaufanego wykonawcę i przygotuje szkic zlecenia.
          </p>
        </div>
      </div>

      {/* Quick-start chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => openWithPrefill(q)}
            className="text-xs sm:text-sm bg-white/15 hover:bg-white/25 backdrop-blur rounded-full px-3 py-1.5 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Free-form input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openWithPrefill(customQuestion.trim() || '');
        }}
        className="mt-5 flex flex-col sm:flex-row gap-2"
      >
        <input
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Opisz swój problem własnymi słowami…"
          className="flex-1 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-white text-indigo-700 font-semibold px-5 py-2.5 hover:bg-indigo-50 transition"
        >
          Zapytaj AI →
        </button>
      </form>

      <div className="mt-3 text-xs text-indigo-100/80">
        Darmowe · Bez logowania · Odpowiedź w kilka sekund
      </div>
    </section>
  );
}
