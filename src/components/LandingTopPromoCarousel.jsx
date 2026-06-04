import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Info, UserPlus } from "lucide-react";
import { openHowItWorksModal } from "../utils/openHowItWorksModal";

const ASSETS_VERSION = "20260604j";

function promoImg(fileName) {
  return `/img/${encodeURIComponent(fileName)}?v=${ASSETS_VERSION}`;
}

const SLIDES = [
  {
    id: "client",
    audience: "client",
    badge: "Dla klienta",
    title: "Potrzebujesz",
    titleAccent: "pomocy?",
    description:
      "AI pomoże znaleźć rozwiązanie lub sprawdzonego specjalistę w Twojej okolicy.",
    image: promoImg("promo klient.png"),
    imageAlt: "Klient korzystający z Helpfli",
    registerLink:
      "/register?role=client&utm_source=landing&utm_campaign=promo_strip_client",
    registerLabel: "Załóż darmowe konto",
  },
  {
    id: "provider",
    audience: "provider",
    badge: "Dla wykonawcy",
    title: "Pozyskuj",
    titleAccent: "zlecenia",
    description:
      "Dołącz jako wykonawca i odbieraj zapytania od klientów w Twojej okolicy.",
    image: promoImg("promo provider.png"),
    imageAlt: "Wykonawca korzystający z Helpfli",
    registerLink:
      "/register?role=provider&utm_source=landing&utm_campaign=promo_strip_provider",
    registerLabel: "Zarejestruj się jako wykonawca",
  },
];

const ROTATE_MS = 6000;

export default function LandingTopPromoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((delta) => {
    setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (SLIDES.length <= 1 || paused) return undefined;
    const id = setInterval(() => go(1), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, go]);

  const slide = SLIDES[index];

  return (
    <section
      className="pt-2 pb-1 md:pt-3 md:pb-2"
      aria-label="Promocje Helpfli"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div
          className="group relative overflow-hidden rounded-xl border shadow-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="relative flex h-[138px] sm:h-[140px] md:h-[152px] lg:h-[160px]">
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center gap-2 py-2 pl-3 pr-2 sm:gap-2.5 sm:py-2.5 sm:pl-4 md:pl-5 md:pr-3 lg:pl-6">
              <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 sm:text-[11px]">
                {slide.badge}
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight text-slate-900 sm:text-lg md:text-xl lg:text-[1.35rem]">
                  {slide.title}{" "}
                  <span className="text-indigo-600">{slide.titleAccent}</span>
                </h2>
                <p className="mt-0.5 line-clamp-1 max-w-md text-[11px] leading-snug text-slate-600 sm:line-clamp-2 sm:text-xs md:text-[13px]">
                  {slide.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Link
                  to={slide.registerLink}
                  className="inline-flex min-h-[34px] max-w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:min-h-[36px] sm:px-3 sm:text-xs md:px-3.5"
                >
                  <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{slide.registerLabel}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => openHowItWorksModal(slide.audience)}
                  className="inline-flex min-h-[34px] max-w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 sm:min-h-[36px] sm:px-3 sm:text-xs md:px-3.5"
                >
                  <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">Jak to działa?</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                </button>
              </div>
            </div>

            <div className="relative hidden w-[34%] shrink-0 sm:block md:w-[38%] lg:w-[40%]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent z-[1]" />
              <img
                key={slide.id}
                src={slide.image}
                alt={slide.imageAlt}
                className="absolute inset-y-0 right-0 h-full w-[115%] max-w-none object-cover object-right"
                draggable={false}
              />
            </div>
          </div>

          {SLIDES.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 shadow-sm md:h-8 md:w-8 md:opacity-70 md:group-hover:opacity-100"
                style={{ borderColor: "var(--border)" }}
                aria-label="Poprzedni baner"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-slate-700 md:h-4 md:w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 shadow-sm md:h-8 md:w-8 md:opacity-70 md:group-hover:opacity-100"
                style={{ borderColor: "var(--border)" }}
                aria-label="Następny baner"
              >
                <ChevronRight className="h-3.5 w-3.5 text-slate-700 md:h-4 md:w-4" aria-hidden />
              </button>

              <div className="absolute top-1.5 right-1.5 z-20 flex gap-1 pointer-events-auto">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-4 bg-indigo-600" : "w-1.5 bg-slate-300"
                    }`}
                    aria-label={`Baner ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
