import { Sparkles } from "lucide-react";
import { openAI } from "../ai/chat/bus";

const STAGE_TIPS = {
  open: {
    tip: "Możesz wydłużyć ważność zlecenia lub dodać zdjęcia, żeby przyciągnąć więcej ofert.",
    seedQuery: "Jak przyciągnąć więcej ofert do mojego zlecenia?"
  },
  offers: {
    tip: "Masz rekomendację AI – zobacz TOP 3 oferty lub wybierz spośród wszystkich.",
    seedQuery: "Którą ofertę wybrać? Pomóż mi porównać."
  },
  accepted: {
    tip: "Opłać zlecenie w systemie (gwarancja Helpfli) lub ustal płatność bezpośrednio z wykonawcą.",
    seedQuery: "Mam pytanie o płatność za zlecenie."
  },
  funded: {
    tip: "Środki są zablokowane. Umów się na termin realizacji lub czekaj na kontakt wykonawcy.",
    seedQuery: "Kiedy wykonawca może zacząć realizację?"
  },
  in_progress: {
    tip: "Masz problem lub pytanie? Napisz w czacie lub poproś o zmianę zakresu.",
    seedQuery: "Potrzebuję zmiany zakresu lub mam problem z realizacją."
  },
  completed: {
    tip: "Oceń wykonawcę – Twoja opinia pomoże innym klientom.",
    seedQuery: "Jak mogę wystawić reklamację lub prosić o poprawki?"
  }
};

export default function AIStepHint({
  stage,
  tip: tipOverride,
  seedQuery: seedOverride,
  title,
  ctaLabel,
  priority = 'low',
  onAction,
  phaseLabel,
  stepLabel,
  oneActionReason
}) {
  const config = STAGE_TIPS[stage] || {};
  const tip = tipOverride || config.tip;
  const seedQuery = seedOverride || config.seedQuery || "";

  if (!tip) return null;

  const handleAskAI = () => {
    if (onAction) {
      onAction({ seedQuery, stage });
      return;
    }
    openAI("modal", seedQuery);
  };

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${
      priority === 'high'
        ? 'border-amber-200 bg-amber-50'
        : priority === 'medium'
          ? 'border-blue-200 bg-blue-50'
          : 'border-indigo-200 bg-indigo-50/80'
    }`}>
      <div className="flex items-start gap-2 min-w-0">
        <span className={`shrink-0 mt-0.5 ${priority === 'high' ? 'text-amber-600' : priority === 'medium' ? 'text-blue-600' : 'text-indigo-600'}`}>
          <Sparkles className="w-4 h-4" />
        </span>
        <div>
          {phaseLabel && (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {phaseLabel}
            </div>
          )}
          {title && <div className="text-sm font-semibold text-slate-900 mb-0.5">{title}</div>}
          {stepLabel && <div className="mb-1 text-xs font-medium text-indigo-700">{stepLabel}</div>}
          <p className="text-sm text-slate-800">{tip}</p>
          {oneActionReason && <p className="mt-1 text-xs text-slate-500">{oneActionReason}</p>}
        </div>
      </div>
      {seedQuery && (
        <button
          type="button"
          onClick={handleAskAI}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
        >
          {ctaLabel || 'Zapytaj Asystenta'}
        </button>
      )}
    </div>
  );
}
