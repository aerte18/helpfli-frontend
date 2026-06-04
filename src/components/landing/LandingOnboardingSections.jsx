import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Sparkles,
  MapPin,
  Handshake,
  Star,
  Users,
  Bot,
  MapPinned,
} from "lucide-react";

const HOW_IT_WORKS_STEPS = [
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
];

const WHY_WORTH_ITEMS = [
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
];

function StepCard({ item }) {
  const Icon = item.icon;
  return (
    <article
      className="group flex h-full min-h-[200px] w-[min(260px,78vw)] shrink-0 snap-start flex-col rounded-[18px] border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-auto sm:min-w-0 md:min-h-[220px] md:p-5"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors group-hover:scale-[1.02]"
        style={{ backgroundColor: "oklch(0.94 0.04 264 / 0.7)" }}
      >
        <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} aria-hidden />
      </div>
      <span
        className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        aria-hidden
      >
        {item.step}
      </span>
      <h3 className="mb-1.5 text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>
        {item.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        {item.desc}
      </p>
    </article>
  );
}

function BenefitCard({ item }) {
  const Icon = item.icon;
  return (
    <article
      className="flex h-full flex-col rounded-[18px] border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-6"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: "oklch(0.65 0.08 264)" }}
      >
        <Icon className="h-6 w-6 text-white" aria-hidden />
      </div>
      <h3 className="mb-2 text-lg font-bold leading-tight" style={{ color: "var(--foreground)" }}>
        {item.value}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        {item.desc}
      </p>
    </article>
  );
}

export default function LandingOnboardingSections() {
  const navigate = useNavigate();

  const scrollToDetails = () => {
    const el = document.getElementById("platforma-szczegoly");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate("/#platforma-szczegoly");
  };

  return (
    <div className="border-b" style={{ borderColor: "var(--border)" }}>
      {/* Sekcja 1 — Jak działa */}
      <section id="jak-to-dziala" className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mb-6 text-center md:mb-8">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl" style={{ color: "var(--foreground)" }}>
              Jak działa Helpfli?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm md:text-lg" style={{ color: "var(--muted-foreground)" }}>
              Znajdź rozwiązanie problemu lub odpowiedniego specjalistę w kilku prostych krokach.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide touch-pan-x [-webkit-overflow-scrolling:touch] md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <StepCard key={item.step} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Sekcja 2 — Dlaczego warto */}
      <section className="py-8 md:py-12" style={{ backgroundColor: "oklch(0.98 0.01 264 / 0.6)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mb-6 text-center md:mb-8">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl" style={{ color: "var(--foreground)" }}>
              Dlaczego warto?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm md:text-lg" style={{ color: "var(--muted-foreground)" }}>
              Dołącz do pierwszych użytkowników platformy Helpfli.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {WHY_WORTH_ITEMS.map((item) => (
              <BenefitCard key={item.value} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Sekcja 3 — CTA */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div
            className="rounded-[20px] border px-6 py-8 text-center shadow-md md:px-10 md:py-12"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              backgroundImage:
                "linear-gradient(135deg, oklch(0.97 0.03 264 / 0.9), oklch(0.96 0.05 290 / 0.5))",
            }}
          >
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--foreground)" }}>
              Gotowy, aby rozpocząć?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm md:text-base" style={{ color: "var(--muted-foreground)" }}>
              Załóż darmowe konto i korzystaj z pomocy AI oraz lokalnych specjalistów.
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register?role=client&utm_source=landing&utm_campaign=onboarding_cta"
                className="btn-helpfli-primary inline-flex min-h-[48px] items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 sm:min-w-[220px]"
              >
                Załóż darmowe konto
              </Link>
              <button
                type="button"
                onClick={scrollToDetails}
                className="btn-helpfli-secondary inline-flex min-h-[48px] items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold sm:min-w-[220px]"
              >
                Dowiedz się więcej
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
