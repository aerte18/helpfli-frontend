import { X } from "lucide-react";

/**
 * Wspólny szkielet UI dla soft-ask popupów (lokalizacja, powiadomienia).
 * Pojawia się jako delikatna karta w prawym górnym rogu (desktop) /
 * dolny banner full-width (mobile). Nie blokuje strony — user może klikać dalej.
 */
export default function SoftAskCard({
  icon: Icon,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel = "Nie teraz",
  onSecondary,
  onDismiss,
  loading = false,
  variant = "default",
}) {
  const accent =
    variant === "warning"
      ? "bg-amber-50 text-amber-600 ring-amber-200"
      : "bg-indigo-50 text-indigo-600 ring-indigo-200";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="soft-ask-title"
      className="fixed inset-x-3 bottom-3 z-[85] sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto sm:max-w-sm"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accent}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 id="soft-ask-title" className="text-sm font-semibold text-slate-900">
                {title}
              </h3>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label="Zamknij"
                  className="-mr-1 -mt-0.5 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimary}
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Proszę czekać…" : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
