import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_ORDER_FILTERS,
  PROVIDER_ORDER_FILTERS,
  clientOrderMatchesFilter,
  getClientOrderPresentation,
  getProviderOrderPresentation,
  getProviderStageKey,
  providerOrderMatchesFilter,
} from "../../src/utils/orderFlowLabels.js";
import {
  canClientConfirmReceipt,
  canUserRateOrder,
  needsClientCompletionReview,
} from "../../src/utils/orderCompletion.js";

const selected = {
  _id: "order-1",
  acceptedOfferId: "offer-1",
  provider: "provider-1",
};
const offer = { _id: "offer-1", providerId: "provider-1", status: "accepted" };

test("client menu exposes every business end-state", () => {
  assert.deepEqual(CLIENT_ORDER_FILTERS, [
    "all",
    "open",
    "collecting_offers",
    "accepted",
    "in_progress",
    "completed",
    "disputed",
    "cancelled",
  ]);
  assert.equal(clientOrderMatchesFilter({ status: "awaiting_payment" }, "accepted"), true);
  assert.equal(clientOrderMatchesFilter({ status: "funded" }, "in_progress"), true);
  assert.equal(clientOrderMatchesFilter({ status: "releasing" }, "completed"), true);
  assert.equal(clientOrderMatchesFilter({ status: "disputed" }, "disputed"), true);
  assert.equal(clientOrderMatchesFilter({ status: "cancelled" }, "cancelled"), true);
});

test("provider menu exposes disputes and cancellations", () => {
  assert.deepEqual(PROVIDER_ORDER_FILTERS, [
    "all",
    "offered",
    "accepted",
    "in_progress",
    "completed",
    "disputed",
    "cancelled",
    "inactive",
  ]);
  assert.equal(providerOrderMatchesFilter({ order: { ...selected, status: "disputed" }, offer }, "disputed"), true);
  assert.equal(providerOrderMatchesFilter({ order: { ...selected, status: "cancelled" }, offer }, "cancelled"), true);
  assert.equal(providerOrderMatchesFilter({ order: { ...selected, status: "releasing" }, offer }, "completed"), true);
  assert.equal(providerOrderMatchesFilter({
    order: { status: "collecting_offers" },
    offer: { ...offer, status: "expired" },
  }, "inactive"), true);
});

test("expired, withdrawn and rejected offers are not shown as active", () => {
  for (const [status, label] of [
    ["expired", "Oferta wygasła"],
    ["withdrawn", "Oferta wycofana"],
    ["rejected", "Oferta odrzucona"],
  ]) {
    const currentOffer = { ...offer, status };
    const order = { _id: "order-1", status: "collecting_offers" };
    assert.equal(getProviderStageKey({ order, offer: currentOffer }), "inactive");
    assert.equal(getProviderOrderPresentation({ order, offer: currentOffer }).label, label);
  }
});

test("client system-payment lifecycle has correct labels and actions", () => {
  const cases = [
    [{ status: "open" }, "Otwarte", "/orders/order-1?tab=offers"],
    [{ status: "collecting_offers", offers: [{}, {}] }, "Oferty złożone", "/orders/order-1?tab=offers"],
    [{ status: "accepted", paymentPreference: "system", paymentStatus: "unpaid" }, "Oczekuje na płatność", "/checkout/order-1"],
    [{ status: "funded", paymentPreference: "system" }, "Oczekuje na realizację", "/orders/order-1?tab=details"],
    [{ status: "in_progress" }, "W realizacji", "/orders/order-1?tab=chat"],
    [{ status: "completed", paymentPreference: "system" }, "Do potwierdzenia", "/orders/order-1?tab=details"],
    [{ status: "releasing" }, "Rozliczenie w toku", "/orders/order-1?tab=details"],
    [{ status: "released" }, "Zakończone", "/orders/order-1?tab=details"],
  ];

  for (const [state, label, href] of cases) {
    const presentation = getClientOrderPresentation({ _id: "order-1", ...state });
    assert.equal(presentation.label, label, JSON.stringify(state));
    assert.equal(presentation.nextStepHref, href, JSON.stringify(state));
  }
});

test("external and offers-only flows never pretend the platform payment is ready", () => {
  assert.equal(getClientOrderPresentation({
    ...selected,
    status: "accepted",
    paymentPreference: "external",
    pricing: { platformFee: 5 },
    externalCommissionStatus: "unpaid",
  }).label, "Oczekuje na działanie klienta");

  assert.equal(getClientOrderPresentation({
    ...selected,
    status: "accepted",
    orderMode: "offers_only",
    paymentPreference: "external",
    contactUnlockStatus: "unpaid",
  }).label, "Odblokuj kontakt");

  assert.equal(getClientOrderPresentation({
    ...selected,
    status: "accepted",
    orderMode: "offers_only",
    paymentPreference: "external",
    contactUnlockStatus: "waived",
  }).label, "Oczekuje na realizację");
});

test("client sees cancellation and dispute as explicit terminal/action states", () => {
  const disputed = getClientOrderPresentation({ _id: "order-1", status: "disputed" });
  assert.equal(disputed.label, "Spór w toku");
  assert.equal(disputed.nextStepHref, "/orders/order-1/sprawa");
  assert.equal(getClientOrderPresentation({ _id: "order-1", status: "cancelled" }).label, "Anulowane");
});

test("provider sees the correct action from offer through settlement", () => {
  const cases = [
    [{ status: "collecting_offers" }, { ...offer, status: "sent" }, "Oferta złożona"],
    [{ ...selected, status: "accepted", paymentPreference: "system", paymentStatus: "unpaid" }, offer, "Oferta wybrana"],
    [{ ...selected, status: "funded", paymentPreference: "system" }, offer, "Zlecenie opłacone"],
    [{ ...selected, status: "in_progress" }, offer, "W realizacji"],
    [{ ...selected, status: "completed" }, offer, "Czeka na potwierdzenie klienta"],
    [{ ...selected, status: "releasing" }, offer, "Rozliczenie w toku"],
    [{ ...selected, status: "released" }, offer, "Zakończone"],
    [{ ...selected, status: "disputed" }, offer, "Spór w toku"],
    [{ ...selected, status: "cancelled" }, offer, "Anulowane"],
  ];

  for (const [order, currentOffer, label] of cases) {
    assert.equal(getProviderOrderPresentation({ order, offer: currentOffer }).label, label, JSON.stringify(order));
  }
});

test("provider waits for contact unlock in offers-only and sees a lost offer", () => {
  const locked = {
    ...selected,
    status: "accepted",
    orderMode: "offers_only",
    paymentPreference: "external",
    contactUnlockStatus: "unpaid",
  };
  assert.equal(getProviderOrderPresentation({ order: locked, offer }).label, "Oferta wybrana");

  const unlocked = { ...locked, contactUnlockStatus: "succeeded" };
  assert.equal(getProviderOrderPresentation({ order: unlocked, offer }).label, "Gotowe do realizacji");

  const otherOffer = { _id: "offer-2", providerId: "provider-2", status: "rejected" };
  assert.equal(getProviderStageKey({ order: { ...selected, status: "accepted" }, offer: otherOffer }), "lost");
  assert.equal(getProviderOrderPresentation({ order: { ...selected, status: "accepted" }, offer: otherOffer }).label, "Klient wybrał innego");
});

test("completion variants expose the correct client action", () => {
  const systemPending = {
    status: "completed",
    paymentPreference: "system",
    clientCompletionStatus: "pending",
  };
  assert.equal(needsClientCompletionReview(systemPending), true);
  assert.equal(canClientConfirmReceipt(systemPending), false);

  assert.equal(canClientConfirmReceipt({
    ...systemPending,
    clientCompletionStatus: "accepted",
  }), true);

  assert.equal(canClientConfirmReceipt({
    ...systemPending,
    completionType: "with_payment",
    clientCompletionStatus: "accepted",
    additionalPaymentStatus: "processing",
  }), false);
  assert.equal(canClientConfirmReceipt({
    ...systemPending,
    completionType: "with_payment",
    clientCompletionStatus: "accepted",
    additionalPaymentStatus: "succeeded",
  }), true);

  const externalCompleted = {
    status: "completed",
    paymentPreference: "external",
    clientCompletionStatus: "pending",
  };
  assert.equal(needsClientCompletionReview(externalCompleted), false);
  assert.equal(canClientConfirmReceipt(externalCompleted), true);
});

test("rating stays blocked during completion review or dispute", () => {
  assert.equal(canUserRateOrder({
    status: "completed",
    paymentPreference: "system",
    clientCompletionStatus: "pending",
  }, { isClient: true }), false);
  assert.equal(canUserRateOrder({
    status: "disputed",
    disputeStatus: "reported",
  }, { isProvider: true }), false);
  assert.equal(canUserRateOrder({ status: "released" }, { isClient: true }), true);
});
