import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
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
  { step: 1, icon: FileText, title: "Opisz problem", desc: "Napisz czego potrzebujesz lub z czym masz problem." },
  { step: 2, icon: Sparkles, title: "AI proponuje rozwiązanie", desc: "Sztuczna inteligencja analizuje problem i sugeruje możliwe rozwiązania." },
  { step: 3, icon: MapPin, title: "Znajdź wykonawcę", desc: "Jeśli potrzebujesz pomocy, wybierz specjalistę w swojej okolicy." },
  { step: 4, icon: Handshake, title: "Wybierz najlepszą ofertę", desc: "Porównaj wykonawców, ceny i opinie." },
  { step: 5, icon: Star, title: "Oceń usługę", desc: "Dodaj opinię i pomóż innym użytkownikom." },
];

const WHY_WORTH_ITEMS = [
  { icon: Users, value: "Pierwsi użytkownicy", desc: "Budujemy największą społeczność lokalnych usług." },
  { icon: Bot, value: "AI Assistance", desc: "Szybka pomoc i diagnoza problemów." },
  { icon: MapPinned, value: "Usługi lokalne", desc: "Znajdź specjalistów blisko siebie." },
  { icon: Star, value: "System opinii", desc: "Wybieraj wykonawców na podstawie ocen." },
];

function registerPaths(audience) {
  if (audience === "provider") {
    return {
      primary: "/register?role=provider&utm_source=how_it_works_modal&utm_campaign=founding_provider",
      primaryLabel: "Zarejestruj się jako wykonawca",
    };
  }
  return {
    primary: "/register?role=client&utm_source=how_it_works_modal&utm_campaign=onboarding_cta",
    primaryLabel: "Załóż darmowe konto",
  };
}

/**
 * Globalny modal: Jak działa + Dlaczego warto + CTA.
 * Montowany w App.jsx; otwierany przez openHowItWorksModal() lub zdarzenie qs-open-how-it-works.
 */
export default function HowItWorksHelpfliModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState("client");

  useEffect(() => {
    const onOpen = (e) => {
      setAudience(e.detail?.audience === "provider" ? "provider" : "client");
      setOpen(true);
    };
    window.addEventListener("qs-open-how-it-works", onOpen);
    return () => window.removeEventListener("qs-open-how-it-works", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const cta = registerPaths(audience);

  const goDetails = () => {
    setOpen(false);
    const el = document.getElementById("platforma-szczegoly");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate("/#platforma-szczegoly");
  };

  return (
    <div
      className="fixed inset-0 z-[1150] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-helpfli-title"
    >
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div
        className="relative z-10 flex w-full max-h-[min(94vh,900px)] max-w-4xl flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0 pr-2">
            <h2
              id="how-it-works-helpfli-title"
              className="text-xl font-bold leading-tight md:text-2xl"
              style={{ color: "var(--foreground)" }}
            >
              Jak działa Helpfli?
            </h2>
            <p className="mt-1 text-sm md:text-base" style={{ color: "var(--muted-foreground)" }}>
              Znajdź rozwiązanie problemu lub odpowiedniego specjalistę w kilku prostych krokach.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-slate-100"
            aria-label="Zamknij okno"
          >
            <X className="h-5 w-5 text-slate-600" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {HOW_IT_WORKS_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  className="rounded-[16px] border p-3.5 transition-shadow hover:shadow-md"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      {item.step}
                    </span>
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "oklch(0.94 0.04 264 / 0.65)" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} aria-hidden />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {item.desc}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold md:text-xl" style={{ color: "var(--foreground)" }}>
              Dlaczego warto?
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Dołącz do pierwszych użytkowników platformy Helpfli.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {WHY_WORTH_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.value}
                    className="flex gap-3 rounded-[16px] border p-4"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "oklch(0.65 0.08 264)" }}
                    >
                      <Icon className="h-5 w-5 text-white" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {item.value}
                      </h4>
                      <p className="mt-0.5 text-xs sm:text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div
            className="mt-8 rounded-[18px] border px-5 py-6 text-center"
            style={{
              borderColor: "var(--border)",
              backgroundImage:
                "linear-gradient(135deg, oklch(0.97 0.03 264 / 0.9), oklch(0.96 0.05 290 / 0.45))",
            }}
          >
            <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              Gotowy, aby rozpocząć?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--muted-foreground)" }}>
              Załóż darmowe konto i korzystaj z pomocy AI oraz lokalnych specjalistów.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to={cta.primary}
                onClick={() => setOpen(false)}
                className="btn-helpfli-primary inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                {cta.primaryLabel}
              </Link>
              <button
                type="button"
                onClick={goDetails}
                className="btn-helpfli-secondary inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                Dowiedz się więcej
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
