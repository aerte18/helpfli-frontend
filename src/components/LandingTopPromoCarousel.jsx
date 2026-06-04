import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ASSETS_VERSION = "20260604b";

function promoImg(fileName) {
  return `/img/${encodeURIComponent(fileName)}?v=${ASSETS_VERSION}`;
}

const SLIDES = [
  {
    id: "client",
    alt: "Potrzebujesz pomocy? AI pomoże znaleźć specjalistę w Twojej okolicy",
    src: promoImg("promo klient.png"),
    link: "/register?role=client&utm_source=landing&utm_campaign=promo_strip_client",
  },
  {
    id: "provider",
    alt: "Pozyskuj nowych klientów z Helpfli — dołącz jako wykonawca",
    src: promoImg("promo provider.png"),
    link: "/register?role=provider&utm_source=landing&utm_campaign=promo_strip_provider",
  },
];

const ROTATE_MS = 6000;

export default function LandingTopPromoCarousel() {
  const navigate = useNavigate();
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
      className="pt-3 pb-2 md:pt-4 md:pb-3"
      aria-label="Promocje Helpfli"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div
          className="group relative overflow-hidden rounded-xl border shadow-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <button
            type="button"
            onClick={() => navigate(slide.link)}
            className="flex w-full items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-xl"
            aria-label={slide.alt}
          >
            <img
              key={slide.id}
              src={slide.src}
              alt={slide.alt}
              className="block w-full max-h-[4.25rem] sm:max-h-[5rem] md:max-h-[5.75rem] h-auto object-contain object-center select-none"
              draggable={false}
            />
          </button>

          {SLIDES.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 md:opacity-60 md:group-hover:opacity-100"
                style={{ borderColor: "var(--border)" }}
                aria-label="Poprzedni baner"
              >
                <ChevronLeft className="h-4 w-4 text-slate-700" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 md:opacity-60 md:group-hover:opacity-100"
                style={{ borderColor: "var(--border)" }}
                aria-label="Następny baner"
              >
                <ChevronRight className="h-4 w-4 text-slate-700" aria-hidden />
              </button>

              <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-4 bg-indigo-600" : "w-1.5 bg-slate-400/70"
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
