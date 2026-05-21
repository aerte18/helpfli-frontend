/**
 * Limity pakietów — spójne z backendem (User.monthlyOffersLimit, offersOnlyMonetization).
 */

export const LARGE_PROJECT_SLOTS = {
  standard: { label: "Zwykłe zlecenie", slots: 1 },
  large: { label: "Duży projekt (np. remont)", slots: 2 },
  extraLarge: { label: "Budowa / generalny wykonawca", slots: 3 },
};

/** Parsuj limit odpowiedzi z planu API lub perks. */
export function getOfferLimitFromPlan(plan) {
  const raw = plan?.providerOffersLimit;
  if (raw != null && Number.isFinite(Number(raw))) {
    const n = Number(raw);
    return n >= 999999 ? Infinity : n;
  }
  const perks = (plan?.perks || plan?.benefits || []).join(" ").toLowerCase();
  if (perks.includes("odpowiedzi: nielimitowane") || (perks.includes("nielimitowane") && perks.includes("odpowiedzi"))) {
    return Infinity;
  }
  const m = perks.match(/odpowiedzi:\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function formatOfferLimit(limit) {
  if (limit == null) return "—";
  if (limit === Infinity) return "Nielimitowane";
  return `${limit} slotów / mies.`;
}

export function formatOfferLimitShort(limit) {
  if (limit == null) return null;
  if (limit === Infinity) return "Nielimitowane odpowiedzi";
  return `${limit} odpowiedzi / mies.`;
}

/** Koszt dużego projektu w slotach wg pakietu wykonawcy. */
export function getLargeProjectSlotLabel(planKey = "") {
  const key = String(planKey || "").toUpperCase();
  if (key === "PROV_PRO") {
    return "Max 1 slot / oferta (nawet przy budowie)";
  }
  return "1–3 sloty / oferta (wg wielkości zlecenia)";
}

export const PROVIDER_OFFER_ROWS = [
  { planKey: "PROV_FREE", name: "FREE", slots: 10, aiChat: "Brak w pakiecie", largeProject: "1–3 sloty / oferta" },
  { planKey: "PROV_STD", name: "STANDARD", slots: 50, aiChat: "Ograniczony", largeProject: "1–3 sloty / oferta" },
  { planKey: "PROV_STD_PLUS", name: "STANDARD+", slots: 100, aiChat: "Nielimitowany", largeProject: "1–3 sloty / oferta" },
  { planKey: "PROV_PRO", name: "PRO", slots: Infinity, aiChat: "Nielimitowany", largeProject: "Max 1 slot / oferta" },
];

export const BUSINESS_OFFER_ROWS = [
  { planKey: "BUSINESS_FREE", name: "FREE", slots: 20, aiPool: "100 zapytań / mies. (zespół)", largeProject: "1–3 sloty / oferta" },
  { planKey: "BUSINESS_STANDARD", name: "STANDARD", slots: 200, aiPool: "1000 zapytań / mies. (zespół)", largeProject: "1–3 sloty / oferta" },
  { planKey: "BUSINESS_PRO", name: "PRO", slots: Infinity, aiPool: "Nielimitowane (zespół)", largeProject: "Max 1 slot / oferta (PRO wykonawcy)" },
];

/** Teksty do podpowiedzi w przewodniku limitów (hover / rozwijane). */
export const SLOT_GUIDE_COPY = {
  slotsColumn: {
    title: "Odpowiedzi / miesiąc (sloty)",
    lines: [
      "Jeden slot = jedna wysłana oferta na zwykłe zlecenie.",
      "Limit resetuje się co miesiąc wraz z pakietem.",
      "PRO = brak miesięcznego limitu slotów (nielimitowane odpowiedzi).",
    ],
  },
  aiColumnProvider: {
    title: "Asystent AI",
    lines: [
      "Osobny limit od slotów — dotyczy czatu AI przy składaniu ofert.",
      "FREE: brak w pakiecie, STANDARD: ograniczony, STANDARD+ i PRO: nielimitowany.",
    ],
  },
  aiColumnBusiness: {
    title: "AI zespołu",
    lines: [
      "Wspólna pula zapytań AI dla całej firmy w panelu B2B.",
      "Nie zużywa slotów odpowiedzi na zlecenia.",
    ],
  },
  largeProjectColumn: {
    title: "Duże projekty",
    lines: [
      "Zlecenia „Pozyskaj tylko oferty” (remont, budowa) mogą kosztować więcej slotów.",
      "FREE / STANDARD / STANDARD+: 2–3 sloty za jedną ofertę (wg wielkości).",
      "PRO wykonawcy: duży projekt liczy się jako max 1 slot za ofertę.",
    ],
  },
  howSlotsWork: {
    title: "Jak działają sloty?",
    lines: [
      "Każda wysłana oferta zużywa sloty z miesięcznego pakietu.",
      "Zwykłe zlecenie = 1 slot.",
      "Duże projekty mogą kosztować 2–3 sloty (szczegóły poniżej).",
      "Pilne zlecenia nie zużywają dodatkowych slotów ponad koszt oferty.",
    ],
  },
};

export function getPlanLimitTooltipLines(row, { isBusiness = false } = {}) {
  const lines = [];
  if (row.slots === Infinity) {
    lines.push("Odpowiedzi: nielimitowane (bez miesięcznego limitu slotów).");
  } else if (row.slots != null) {
    lines.push(`Odpowiedzi: ${row.slots} slotów miesięcznie (1 oferta zwykle = 1 slot).`);
  }
  lines.push(`${isBusiness ? "AI zespołu" : "Asystent AI"}: ${row.aiLabel || "—"}.`);
  lines.push(`Duże projekty: ${row.largeProject || "—"}.`);
  if (row.planKey === "PROV_PRO" || row.planKey === "BUSINESS_PRO") {
    lines.push("Pakiet PRO: najkorzystniejszy przy dużych projektach i wysokiej liczbie ofert.");
  }
  return lines;
}

export const CLIENT_UNLIMITED_HINTS = [
  { feature: "Pilne zlecenia", free: "Bez limitu", std: "Bez limitu", pro: "Bez limitu" },
  { feature: "Asystent AI", free: "50 zapytań / mies.", std: "Nielimitowany", pro: "Nielimitowany" },
  { feature: "Podbicie ofert", free: "—", std: "—", pro: "Bez limitu" },
  { feature: "Duże projekty — kontakt", free: "Płatne", std: "Płatne", pro: "Darmowe odblokowanie" },
];
