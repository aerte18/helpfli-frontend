import React from "react";
import { Infinity as InfinityIcon, Info } from "lucide-react";
import {
  LARGE_PROJECT_SLOTS,
  PROVIDER_OFFER_ROWS,
  BUSINESS_OFFER_ROWS,
  CLIENT_UNLIMITED_HINTS,
  getOfferLimitFromPlan,
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
      <div className="mb-10 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 md:p-6">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-indigo-950">Co jest nielimitowane w pakietach klienta?</h2>
            <p className="text-sm text-indigo-900/80 mt-1">
              Poniżej zestawienie funkcji bez limitu lub z wyższym limitem w planach płatnych.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-indigo-200 text-left text-indigo-900">
                <th className="py-2 pr-4 font-semibold">Funkcja</th>
                <th className="py-2 px-2 font-semibold">FREE</th>
                <th className="py-2 px-2 font-semibold">STANDARD</th>
                <th className="py-2 pl-2 font-semibold">PRO</th>
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
          aiLabel: staticRow?.aiChat || staticRow?.aiPool || "-",
          largeProject: staticRow?.largeProject || "1-3 sloty / oferta",
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

  return (
    <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-amber-950">
            {isBusiness ? "Limity odpowiedzi zespołu (wspólna pula)" : "Limity odpowiedzi na zlecenia (sloty)"}
          </h2>
          <p className="text-sm text-amber-900/85 mt-1">
            Każda wysłana oferta zużywa <strong>sloty</strong> z miesięcznego pakietu. Zwykłe zlecenie ={" "}
            <strong>1 slot</strong>, duże projekty („Pozyskaj tylko oferty”) mogą kosztować{" "}
            <strong>2–3 sloty</strong> — pakiet <strong>PRO wykonawcy</strong> liczy duży projekt jako{" "}
            <strong>max 1 slot</strong>.
          </p>
          {showUsage && (
            <p className="mt-2 text-sm font-medium text-amber-950">
              Twój stan w tym miesiącu:{" "}
              <span className={used >= limit ? "text-red-700" : "text-emerald-800"}>
                {used} / {limit} slotów wykorzystane
              </span>
              {used >= limit ? " - ulepsz pakiet lub poczekaj na reset." : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 mb-5 text-xs text-amber-900">
        {Object.values(LARGE_PROJECT_SLOTS).map((item) => (
          <div key={item.label} className="rounded-lg bg-white/70 border border-amber-100 px-3 py-2">
            <span className="font-medium">{item.label}:</span> {item.slots} {item.slots === 1 ? "slot" : "sloty"}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-amber-100 bg-white">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-amber-100/60 text-left text-amber-950">
              <th className="p-3 font-semibold">Pakiet</th>
              <th className="p-3 font-semibold">Odpowiedzi / mies.</th>
              <th className="p-3 font-semibold">{isBusiness ? "AI zespołu" : "Asystent AI"}</th>
              <th className="p-3 font-semibold">Duże projekty</th>
            </tr>
          </thead>
          <tbody>
            {rowsFromApi.map((row) => (
              <tr key={row.planKey} className="border-t border-amber-50">
                <td className="p-3 font-medium text-slate-900">{row.name}</td>
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

      <p className="mt-4 text-xs text-amber-800/90">
        <strong>Nielimitowane</strong> dotyczy głównie pakietu PRO (wykonawca / firma PRO): odpowiedzi na zlecenia bez
        miesięcznego limitu slotów. Pozostałe funkcje (np. AI w FREE) mają osobne limity — szczegóły w tabeli planów
        poniżej.
      </p>
    </div>
  );
}
