import React from "react";
import { ChevronDown, Infinity as InfinityIcon, Info } from "lucide-react";
import LimitInfoTip from "./LimitInfoTip";
import {
  LARGE_PROJECT_SLOTS,
  PROVIDER_OFFER_ROWS,
  BUSINESS_OFFER_ROWS,
  CLIENT_UNLIMITED_HINTS,
  SLOT_GUIDE_COPY,
  getOfferLimitFromPlan,
  getPlanLimitTooltipLines,
} from "../constants/subscriptionLimits";

function SlotsCell({ slots }) {
  if (slots === Infinity) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
        <InfinityIcon className="w-4 h-4" aria-hidden />
        Nielimitowane
      </span>
    );
  }
  return <span className="font-semibold text-slate-900">{slots} slotów / mies.</span>;
}

function ColumnHeader({ label, tipTitle, tipLines }) {
  return (
    <th className="p-3 font-semibold">
      <LimitInfoTip title={tipTitle} label={label} align="center">
        {tipLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </LimitInfoTip>
    </th>
  );
}

export default function SubscriptionLimitsGuide({
  audience = "provider",
  plans = [],
  monthlyOffersUsed,
  monthlyOffersLimit,
}) {
  const isProvider = audience === "provider";
  const isBusiness = audience === "business";
  const isClient = audience === "client";

  if (isClient) {
    return (
      <details className="group mb-10 rounded-2xl border border-indigo-200 bg-indigo-50/80 open:shadow-sm">
        <summary className="cursor-pointer list-none flex items-start gap-3 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-indigo-950 pr-8">
              Co jest nielimitowane w pakietach klienta?
            </h2>
            <p className="text-sm text-indigo-900/80 mt-1">
              Rozwiń, aby zobaczyć porównanie FREE, STANDARD i PRO.
            </p>
          </div>
          <ChevronDown
            className="w-5 h-5 text-indigo-600 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="px-5 md:px-6 pb-5 md:pb-6 border-t border-indigo-200/60">
          <div className="overflow-x-auto pt-4">
            <table className="w-full text-sm border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b border-indigo-200 text-left text-indigo-900">
                  <th className="py-2 pr-4 font-semibold">Funkcja</th>
                  <th className="py-2 px-2 font-semibold">
                    <LimitInfoTip title="Pakiet FREE (klient)" label="FREE" align="center">
                      <p>Podstawowy plan — limity AI i dużych projektów.</p>
                    </LimitInfoTip>
                  </th>
                  <th className="py-2 px-2 font-semibold">
                    <LimitInfoTip title="Pakiet STANDARD (klient)" label="STANDARD" align="center">
                      <p>Więcej funkcji AI, nadal płatne odblokowanie dużych projektów.</p>
                    </LimitInfoTip>
                  </th>
                  <th className="py-2 pl-2 font-semibold">
                    <LimitInfoTip title="Pakiet PRO (klient)" label="PRO" align="center">
                      <p>Nielimitowany AI, darmowe odblokowanie dużych projektów.</p>
                    </LimitInfoTip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_UNLIMITED_HINTS.map((row) => (
                  <tr key={row.feature} className="border-b border-indigo-100/80">
                    <td className="py-2.5 pr-4 text-indigo-950">{row.feature}</td>
                    <td className="py-2.5 px-2 text-indigo-800">{row.free}</td>
                    <td className="py-2.5 px-2 text-indigo-800">{row.std}</td>
                    <td className="py-2.5 pl-2 text-indigo-800 font-medium">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    );
  }

  const staticRows = isBusiness ? BUSINESS_OFFER_ROWS : PROVIDER_OFFER_ROWS;
  const rowsFromApi = plans.length
    ? plans.map((p) => {
        const limit = getOfferLimitFromPlan(p);
        const staticRow = staticRows.find((r) => r.planKey === p.key);
        return {
          planKey: p.key,
          name: p.name || staticRow?.name || p.key,
          slots: limit ?? staticRow?.slots ?? null,
          aiLabel: staticRow?.aiChat || staticRow?.aiPool || "—",
          largeProject: staticRow?.largeProject || "1–3 sloty / oferta",
        };
      })
    : staticRows.map((r) => ({
        planKey: r.planKey,
        name: r.name,
        slots: r.slots,
        aiLabel: r.aiChat || r.aiPool,
        largeProject: r.largeProject,
      }));

  const used = Number(monthlyOffersUsed);
  const limit = Number(monthlyOffersLimit);
  const showUsage = Number.isFinite(used) && Number.isFinite(limit) && limit > 0 && limit < 999999;
  const usageText = showUsage
    ? `${used} / ${limit} slotów wykorzystane${used >= limit ? " — ulepsz pakiet lub poczekaj na reset." : ""}`
    : null;

  const aiTip = isBusiness ? SLOT_GUIDE_COPY.aiColumnBusiness : SLOT_GUIDE_COPY.aiColumnProvider;

  const expandByDefault = showUsage && used >= limit;

  return (
    <details
      className="group mb-10 rounded-2xl border border-amber-200 bg-amber-50/90 open:shadow-sm"
      open={expandByDefault || undefined}
    >
      <summary className="cursor-pointer list-none flex items-start gap-3 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-amber-950 pr-8">
            {isBusiness ? "Limity odpowiedzi zespołu (wspólna pula)" : "Limity odpowiedzi na zlecenia (sloty)"}
          </h2>
          <p className="text-sm text-amber-900/85 mt-1">
            Najedź na <span className="font-medium">?</span> przy pakiecie lub kolumnie — szczegóły limitów.
            {usageText && (
              <>
                {" "}
                <span className={used >= limit ? "text-red-700 font-medium" : "text-emerald-800 font-medium"}>
                  Twój stan: {usageText}
                </span>
              </>
            )}
          </p>
        </div>
        <ChevronDown
          className="w-5 h-5 text-amber-700 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="px-5 md:px-6 pb-5 md:pb-6 border-t border-amber-200/70 space-y-5">
        <details className="group/slots rounded-xl border border-amber-100 bg-white/80 open:bg-white">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-amber-950 [&::-webkit-details-marker]:hidden">
            <span>Jak działają sloty?</span>
            <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open/slots:rotate-180" aria-hidden />
          </summary>
          <div className="px-4 pb-4 pt-0 text-sm text-amber-900/90 space-y-3 border-t border-amber-50">
            <p>
              Każda wysłana oferta zużywa <strong>sloty</strong> z miesięcznego pakietu. Zwykłe zlecenie ={" "}
              <strong>1 slot</strong>. Duże projekty („Pozyskaj tylko oferty”) mogą kosztować{" "}
              <strong>2–3 sloty</strong> — pakiet <strong>PRO wykonawcy</strong> liczy duży projekt jako{" "}
              <strong>max 1 slot</strong>.
            </p>
            <div className="grid sm:grid-cols-3 gap-2 text-xs">
              {Object.values(LARGE_PROJECT_SLOTS).map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-amber-50/80 border border-amber-100 px-3 py-2"
                >
                  <span className="font-medium">{item.label}:</span> {item.slots}{" "}
                  {item.slots === 1 ? "slot" : "sloty"}
                </div>
              ))}
            </div>
          </div>
        </details>

        <div className="overflow-x-auto rounded-xl border border-amber-100 bg-white">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-amber-100/60 text-left text-amber-950">
                <th className="p-3 font-semibold">Pakiet</th>
                <ColumnHeader
                  label="Odpowiedzi / mies."
                  tipTitle={SLOT_GUIDE_COPY.slotsColumn.title}
                  tipLines={SLOT_GUIDE_COPY.slotsColumn.lines}
                />
                <ColumnHeader
                  label={isBusiness ? "AI zespołu" : "Asystent AI"}
                  tipTitle={aiTip.title}
                  tipLines={aiTip.lines}
                />
                <ColumnHeader
                  label="Duże projekty"
                  tipTitle={SLOT_GUIDE_COPY.largeProjectColumn.title}
                  tipLines={SLOT_GUIDE_COPY.largeProjectColumn.lines}
                />
              </tr>
            </thead>
            <tbody>
              {rowsFromApi.map((row) => (
                <tr key={row.planKey} className="border-t border-amber-50 hover:bg-amber-50/40">
                  <td className="p-3 font-medium text-slate-900">
                    <LimitInfoTip title={`Pakiet ${row.name}`} label={row.name} align="left">
                      {getPlanLimitTooltipLines(row, { isBusiness }).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </LimitInfoTip>
                  </td>
                  <td className="p-3">
                    <SlotsCell slots={row.slots} />
                  </td>
                  <td className="p-3 text-slate-700">{row.aiLabel}</td>
                  <td className="p-3 text-slate-700">{row.largeProject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-amber-800/90">
          <strong>Nielimitowane</strong> dotyczy głównie pakietu PRO: odpowiedzi bez miesięcznego limitu slotów.
          Pozostałe funkcje (np. AI w FREE) mają osobne limity — szczegóły w tabeli planów poniżej.
        </p>
      </div>
    </details>
  );
}
