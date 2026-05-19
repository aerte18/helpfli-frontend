import React from "react";
import { serviceLabel } from "../../utils/serviceLabels";

export function ConciergeChoiceChips({ actions = [], conversationSummary, onSelect }) {
  if (!actions.length) return null;
  return (
    <div className="mt-2 ml-11 max-w-lg">
      {conversationSummary && (
        <p className="text-[11px] text-slate-500 mb-1.5 leading-snug">{conversationSummary}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => onSelect(action)}
            className="px-2.5 py-1 text-xs rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConciergeOrderSnippet({ orderDraft, onOpenForm }) {
  if (!orderDraft) return null;
  const service = serviceLabel(
    orderDraft.summary?.service || orderDraft.orderPayload?.service,
    "Zlecenie"
  );
  const location = orderDraft.summary?.location || "brak lokalizacji";
  const percent = orderDraft.completion?.percent ?? 0;

  return (
    <details className="mt-2 ml-11 max-w-lg group">
      <summary className="cursor-pointer list-none flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600 hover:text-indigo-700 [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-slate-800">{service}</span>
        <span className="text-slate-400">·</span>
        <span className="truncate max-w-[140px]">{location}</span>
        <span className="text-indigo-600 font-medium">{percent}%</span>
        <span className="text-slate-400 group-open:hidden">— szczegóły</span>
      </summary>
      <div className="mt-1.5 border-l-2 border-indigo-100 pl-2.5 space-y-1 text-[11px] text-slate-600">
        <p className="line-clamp-2">
          {orderDraft.summary?.description || orderDraft.orderPayload?.description}
        </p>
        {orderDraft.missing?.length > 0 && (
          <p className="text-amber-700">Brakuje: {orderDraft.missing.join(", ")}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenForm}
        className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
      >
        {orderDraft.canCreate ? "Utwórz zlecenie →" : "Uzupełnij w formularzu →"}
      </button>
    </details>
  );
}

export function ConciergeSafetyHint({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 ml-11 max-w-lg border-l-2 border-red-300 pl-2 text-[11px] leading-snug text-red-800">
      <span className="font-semibold">⚠ </span>
      {message}
    </p>
  );
}

export function ConciergeDiagnosticHint({ flow, onHelped, onFailed }) {
  if (!flow) return null;
  return (
    <details className="max-w-lg text-xs text-slate-700">
      <summary className="cursor-pointer list-none text-slate-500 hover:text-indigo-600 [&::-webkit-details-marker]:hidden">
        <span className="text-indigo-600">▸</span> {flow.title || "Szybka diagnoza"} — rozwiń
      </summary>
      <div className="mt-1.5 border-l-2 border-blue-200 pl-2.5 space-y-1.5">
        {flow.causes?.slice(0, 3).map((cause, idx) => (
          <p key={`c-${idx}`} className="text-slate-600">
            • {cause}
          </p>
        ))}
        {flow.steps?.slice(0, 3).map((step, idx) => (
          <p key={`s-${idx}`} className="text-slate-600">
            {idx + 1}. {step}
          </p>
        ))}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={onHelped}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
          >
            Pomogło
          </button>
          <button
            type="button"
            onClick={onFailed}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Nie pomogło
          </button>
        </div>
      </div>
    </details>
  );
}
