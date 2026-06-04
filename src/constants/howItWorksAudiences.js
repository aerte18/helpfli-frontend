/** Kroki „Jak to działa” — klient (landing / baner promo). */
export const CLIENT_HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Opisz problem",
    desc: "Krótko napisz, czego potrzebujesz. Możesz dodać zdjęcia lub skorzystać z AI.",
  },
  {
    step: 2,
    title: "AI podpowiada rozwiązanie",
    desc: "Otrzymasz wskazówki, widełki ceny i propozycję zlecenia.",
  },
  {
    step: 3,
    title: "Wybierz wykonawcę",
    desc: "Specjaliści odpowiadają — Ty wybierasz najlepszą ofertę i płacisz bezpiecznie.",
  },
];

/** Kroki „Jak to działa” — wykonawca (landing / baner promo). */
export const PROVIDER_HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Załóż konto wykonawcy",
    desc: "Darmowa rejestracja firmy lub osoby — bez zobowiązań na start.",
  },
  {
    step: 2,
    title: "Uzupełnij profil i usługi",
    desc: "Pokaż ofertę, obszar działania i kiedy jesteś dostępny.",
  },
  {
    step: 3,
    title: "Odbieraj zlecenia",
    desc: "Klienci wysyłają zapytania — odpowiadasz, realizujesz i budujesz opinie.",
  },
];

export function getHowItWorksMeta(audience) {
  if (audience === "provider") {
    return {
      title: "Jak działa Helpfli dla wykonawcy",
      subtitle: "Trzy kroki od rejestracji do pierwszego zlecenia.",
      steps: PROVIDER_HOW_IT_WORKS_STEPS,
      registerLabel: "Zarejestruj się jako wykonawca",
      registerPath:
        "/register?role=provider&utm_source=landing&utm_campaign=how_it_works_modal",
    };
  }
  return {
    title: "Jak działa Helpfli dla klienta",
    subtitle: "Trzy kroki od opisu problemu do wybranej oferty.",
    steps: CLIENT_HOW_IT_WORKS_STEPS,
    registerLabel: "Załóż darmowe konto",
    registerPath:
      "/register?role=client&utm_source=landing&utm_campaign=how_it_works_modal",
  };
}
