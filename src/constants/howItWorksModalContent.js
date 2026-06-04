import {
  FileText,
  Sparkles,
  MapPin,
  Handshake,
  Star,
  UserPlus,
  Briefcase,
  Inbox,
  Send,
  TrendingUp,
  Users,
  Bot,
  MapPinned,
  ShieldCheck,
  BadgePercent,
} from "lucide-react";

export const HOW_IT_WORKS_MODAL_CONTENT = {
  client: {
    subtitle:
      "Znajdź rozwiązanie problemu lub sprawdzonego specjalisty w kilku prostych krokach.",
    whySubtitle: "Dołącz do pierwszych użytkowników platformy Helpfli.",
    ctaText: "Załóż darmowe konto i korzystaj z pomocy AI oraz lokalnych specjalistów.",
    steps: [
      {
        step: 1,
        icon: FileText,
        title: "Opisz problem",
        desc: "Napisz czego potrzebujesz lub z czym masz problem.",
      },
      {
        step: 2,
        icon: Sparkles,
        title: "AI proponuje rozwiązanie",
        desc: "Sztuczna inteligencja analizuje problem i sugeruje możliwe rozwiązania.",
      },
      {
        step: 3,
        icon: MapPin,
        title: "Znajdź wykonawcę",
        desc: "Jeśli potrzebujesz pomocy, wybierz specjalistę w swojej okolicy.",
      },
      {
        step: 4,
        icon: Handshake,
        title: "Wybierz najlepszą ofertę",
        desc: "Porównaj wykonawców, ceny i opinie.",
      },
      {
        step: 5,
        icon: Star,
        title: "Oceń usługę",
        desc: "Dodaj opinię i pomóż innym użytkownikom.",
      },
    ],
    benefits: [
      {
        icon: Users,
        value: "Pierwsi użytkownicy",
        desc: "Budujemy największą społeczność lokalnych usług.",
      },
      {
        icon: Bot,
        value: "AI Assistance",
        desc: "Szybka pomoc i diagnoza problemów.",
      },
      {
        icon: MapPinned,
        value: "Usługi lokalne",
        desc: "Znajdź specjalistów blisko siebie.",
      },
      {
        icon: Star,
        value: "System opinii",
        desc: "Wybieraj wykonawców na podstawie ocen.",
      },
    ],
    registerPath:
      "/register?role=client&utm_source=how_it_works_modal&utm_campaign=onboarding_cta",
    registerLabel: "Załóż darmowe konto",
  },
  provider: {
    subtitle:
      "Pozyskuj zlecenia od klientów w swojej okolicy — od rejestracji do pierwszej realizacji.",
    whySubtitle: "Dołącz do pierwszych wykonawców na Helpfli i zyskaj przewagę na starcie.",
    ctaText:
      "Zarejestruj firmę lub działalność i zacznij odbierać zapytania od klientów w okolicy.",
    steps: [
      {
        step: 1,
        icon: UserPlus,
        title: "Załóż konto wykonawcy",
        desc: "Darmowa rejestracja — bez zobowiązań na start.",
      },
      {
        step: 2,
        icon: Briefcase,
        title: "Uzupełnij profil i usługi",
        desc: "Pokaż ofertę, obszar działania i kiedy jesteś dostępny.",
      },
      {
        step: 3,
        icon: Inbox,
        title: "Otrzymuj zlecenia",
        desc: "Klienci wysyłają zapytania dopasowane do Twojej lokalizacji i usług.",
      },
      {
        step: 4,
        icon: Send,
        title: "Wyślij ofertę i realizuj",
        desc: "Odpowiedz na zlecenie, ustal szczegóły i wykonaj usługę.",
      },
      {
        step: 5,
        icon: TrendingUp,
        title: "Buduj opinię i markę",
        desc: "Zbieraj oceny — lepsza widoczność przynosi więcej zleceń.",
      },
    ],
    benefits: [
      {
        icon: BadgePercent,
        value: "Pierwsi wykonawcy",
        desc: "Program startowy: m.in. 0% prowizji przez 60 dni (limit miejsc).",
      },
      {
        icon: MapPinned,
        value: "Klienci w okolicy",
        desc: "Zlecenia od osób szukających pomocy blisko Ciebie.",
      },
      {
        icon: Bot,
        value: "Asystent AI",
        desc: "Pomoc przy ofertach, opisach i komunikacji z klientem.",
      },
      {
        icon: ShieldCheck,
        value: "Wiarygodność",
        desc: "Profil, opinie i bezpieczne rozliczenia budują zaufanie.",
      },
    ],
    registerPath:
      "/register?role=provider&utm_source=how_it_works_modal&utm_campaign=founding_provider",
    registerLabel: "Zarejestruj się jako wykonawca",
  },
};
