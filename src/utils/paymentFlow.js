/**
 * Flow płatności zlecenia: system (Helpfli / escrow) vs external (poza systemem).
 * paymentPreference na Order — źródło prawdy po akceptacji oferty.
 * paymentMethod na Order — enum Stripe (card/p24/…), nie mylić z flow.
 */

export function getOrderPaymentFlow(order) {
  if (!order) return "system";
  const pref = String(order.paymentPreference || "").toLowerCase();
  if (pref === "system" || pref === "external") return pref;
  if (pref === "both") return null;
  return "system";
}

/** true gdy klient/provider już ustalili system lub external (bez „both”). */
export function isPaymentFlowLocked(order) {
  return getOrderPaymentFlow(order) !== null;
}
