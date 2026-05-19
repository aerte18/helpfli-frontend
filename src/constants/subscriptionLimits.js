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

export const CLIENT_UNLIMITED_HINTS = [
  { feature: "Pilne zlecenia", free: "Bez limitu", std: "Bez limitu", pro: "Bez limitu" },
  { feature: "Asystent AI", free: "50 zapytań / mies.", std: "Nielimitowany", pro: "Nielimitowany" },
  { feature: "Podbicie ofert", free: "—", std: "—", pro: "Bez limitu" },
  { feature: "Duże projekty — kontakt", free: "Płatne", std: "Płatne", pro: "Darmowe odblokowanie" },
];
