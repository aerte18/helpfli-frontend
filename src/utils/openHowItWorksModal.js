/** Otwiera globalny modal „Jak działa Helpfli?” (Navbar, banery promo). */
export function openHowItWorksModal(audience = "client") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("qs-open-how-it-works", {
      detail: { audience: audience === "provider" ? "provider" : "client" },
    })
  );
}
