import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useBreakpointMd } from "../../hooks/useBreakpointMd";
import { serviceLabel } from "../../utils/serviceLabels";

const COLLAPSE_KEY = "providerAiNudge_collapsedCount";
const PEEK_MS = 4200;

function buildSummary({ priorityOrders, followUps, coachTips }) {
  if (priorityOrders.length > 0) {
    return priorityOrders.length === 1
      ? "1 szansa na ofertę"
      : `${priorityOrders.length} szanse na ofertę`;
  }
  if (followUps.length > 0) {
    return followUps.length === 1 ? "1 follow-up" : `${followUps.length} follow-upy`;
  }
  if (coachTips.length > 0) return coachTips[0]?.title || "Wskazówka AI";
  return "Podpowiedzi AI";
}

function buildAiPrefill({ priorityOrders, followUps, coachTips }) {
  if (priorityOrders.length > 0) {
    const label = serviceLabel(priorityOrders[0].service, "zlecenie");
    return `Pomóż mi przygotować dobrą ofertę na: ${label}`;
  }
  if (followUps.length > 0) {
    return "Napisz krótki follow-up do klienta po wysłanej ofercie";
  }
  if (coachTips.length > 0) {
    return coachTips[0]?.text || coachTips[0]?.title || "Co mogę poprawić w moich ofertach?";
  }
  return "Co powinienem zrobić teraz, żeby wygrać więcej zleceń?";
}

export default function ProviderMobileAiNudge({
  visible,
  priorityOrders = [],
  followUps = [],
  coachTips = [],
  quickWins = 0,
  onOpenOrder,
  onOpenFollowUp,
  onCoachAction,
}) {
  const isMdUp = useBreakpointMd();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dockExpanded, setDockExpanded] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const collapseTimer = useRef(null);

  const actionableCount = priorityOrders.length + followUps.length;
  const hasContent = actionableCount > 0 || coachTips.length > 0;
  const summary = useMemo(
    () => buildSummary({ priorityOrders, followUps, coachTips }),
    [priorityOrders, followUps, coachTips]
  );

  const scheduleCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setDockExpanded(false), PEEK_MS);
  }, []);

  const expandDock = useCallback(() => {
    setDockExpanded(true);
    scheduleCollapse();
  }, [scheduleCollapse]);

  useEffect(() => {
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hasContent) {
      setDockHidden(false);
      return;
    }
    try {
      const collapsedAt = Number(sessionStorage.getItem(COLLAPSE_KEY) || "0");
      setDockHidden(collapsedAt >= actionableCount && actionableCount > 0);
    } catch {
      setDockHidden(false);
    }
  }, [actionableCount, hasContent]);

  useEffect(() => {
    if (!visible || !hasContent || dockHidden || isMdUp) return;
    expandDock();
  }, [visible, hasContent, dockHidden, isMdUp, actionableCount, expandDock]);

  const dismissDock = () => {
    try {
      sessionStorage.setItem(COLLAPSE_KEY, String(actionableCount));
    } catch {
      /* ignore */
    }
    setDockHidden(true);
    setSheetOpen(false);
    setDockExpanded(false);
  };

  const openAssistant = () => {
    const prefill = buildAiPrefill({ priorityOrders, followUps, coachTips });
    const contextNote =
      priorityOrders.length > 0
        ? `${priorityOrders.length} dopasowanych zleceń czeka na szybką odpowiedź.`
        : followUps.length > 0
          ? `${followUps.length} ofert bez decyzji klienta — warto wysłać follow-up.`
          : coachTips[0]?.title || null;

    window.dispatchEvent(
      new CustomEvent("openProviderAi", {
        detail: { prefill, contextNote, skipHint: true },
      })
    );
    setSheetOpen(false);
  };

  if (!visible || !hasContent || dockHidden || isMdUp) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed right-0 z-[54] md:hidden"
        data-qs-provider-ai-nudge
        style={{ bottom: "var(--qs-map-action-bottom)" }}
      >
        <div
          className={`pointer-events-auto qs-ai-nudge-edge flex max-w-[min(100vw-1rem,17.5rem)] items-center gap-0.5 border border-indigo-200/90 bg-white/97 py-1 pl-1 pr-0.5 shadow-lg shadow-indigo-900/12 ring-1 ring-slate-900/5 backdrop-blur-md ${
            dockExpanded ? "qs-ai-nudge-edge--expanded" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => {
              expandDock();
              setSheetOpen(true);
            }}
            onPointerEnter={expandDock}
            onFocus={expandDock}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-l-full py-1 pl-1.5 pr-1 text-left qs-tap-target"
            aria-label={`Podpowiedzi AI: ${summary}. Otwórz panel.`}
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
              <Sparkles className="h-4 w-4" aria-hidden />
              {actionableCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-white">
                  {actionableCount > 9 ? "9+" : actionableCount}
                </span>
              )}
            </span>
            <span
              className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-out ${
                dockExpanded ? "max-w-[9.5rem] opacity-100" : "max-w-0 opacity-0"
              }`}
              aria-hidden={!dockExpanded}
            >
              <span className="block truncate text-[11px] font-semibold text-indigo-950">{summary}</span>
              <span className="block truncate text-[10px] text-slate-500">Dotknij, aby otworzyć</span>
            </span>
          </button>
          <button
            type="button"
            onClick={dismissDock}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 qs-tap-target"
            aria-label="Schowaj podpowiedź na teraz"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-[56] md:hidden" role="dialog" aria-modal="true" aria-label="Podpowiedzi AI">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
            aria-label="Zamknij"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[min(72dvh,520px)] overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" aria-hidden />
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">AI Inbox</h3>
                    <p className="text-xs text-slate-600">{summary}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 qs-tap-target"
                aria-label="Zamknij panel"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="max-h-[calc(min(72dvh,520px)-8.5rem)] overflow-y-auto px-4 py-3 space-y-3">
              {quickWins > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
                  {quickWins} szybkie szanse z małą konkurencją
                </div>
              )}

              {priorityOrders.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                    Najpierw odpowiedz
                  </div>
                  <div className="space-y-2">
                    {priorityOrders.slice(0, 3).map((order) => {
                      const orderId = order._id || order.id;
                      const offersCount = Number(order.offersCount ?? order.offers?.length ?? 0);
                      return (
                        <button
                          key={orderId}
                          type="button"
                          onClick={() => {
                            onOpenOrder?.(order, "offers");
                            setSheetOpen(false);
                          }}
                          className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 qs-tap-target"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {serviceLabel(order.service, "Zlecenie")}
                            </span>
                            <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                              {order.aiMatch?.score || Math.round(order.aiPriorityScore || 0)}%
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                            {order.urgency === "now" && <span className="text-red-700">Pilne</span>}
                            {offersCount <= 2 && <span>Mało ofert: {offersCount}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {followUps.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Follow-up
                  </div>
                  <div className="space-y-2">
                    {followUps.slice(0, 2).map((offer) => {
                      const order = offer.orderId || {};
                      const orderId = order._id || order.id || offer.orderId;
                      return (
                        <button
                          key={offer._id || `${orderId}-${offer.createdAt}`}
                          type="button"
                          onClick={() => {
                            onOpenFollowUp?.(offer);
                            setSheetOpen(false);
                          }}
                          className="w-full rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50 qs-tap-target"
                        >
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {serviceLabel(order.service, "Oferta")}
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-600">
                            Brak decyzji klienta — AI pomoże napisać przypomnienie.
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {coachTips.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-900">{coachTips[0].title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{coachTips[0].text}</p>
                  {coachTips[0].cta && coachTips[0].action && (
                    <button
                      type="button"
                      onClick={() => {
                        coachTips[0].action?.();
                        onCoachAction?.();
                        setSheetOpen(false);
                      }}
                      className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      {coachTips[0].cta} →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                onClick={openAssistant}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md qs-tap-target"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Zapytaj Asystenta AI
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { buildAiPrefill, buildSummary };
