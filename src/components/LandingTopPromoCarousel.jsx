import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HowItWorksAudienceModal from "./HowItWorksAudienceModal";

const ASSETS_VERSION = "20260604e";
const BANNER_W = 2172;
const BANNER_H = 724;

function promoImg(fileName) {
  return `/img/${encodeURIComponent(fileName)}?v=${ASSETS_VERSION}`;
}

/** Pozycje przycisków na grafice 2172×724 (px → % przy skalowaniu). */
function hotspot(x, y, w, h) {
  return {
    left: `${(x / BANNER_W) * 100}%`,
    top: `${(y / BANNER_H) * 100}%`,
    width: `${(w / BANNER_W) * 100}%`,
    height: `${(h / BANNER_H) * 100}%`,
  };
}

const REGISTER_HOTSPOT = hotspot(52, 548, 500, 148);
const HOW_IT_WORKS_HOTSPOT = hotspot(568, 548, 400, 148);

const SLIDES = [
  {
    id: "client",
    audience: "client",
    alt: "Baner dla klienta — załóż konto lub zobacz jak działa Helpfli",
    src: promoImg("promo klient.png"),
    registerLink:
      "/register?role=client&utm_source=landing&utm_campaign=promo_strip_client",
  },
  {
    id: "provider",
    audience: "provider",
    alt: "Baner dla wykonawcy — rejestracja lub jak działa Helpfli",
    src: promoImg("promo provider.png"),
    registerLink:
      "/register?role=provider&utm_source=landing&utm_campaign=promo_strip_provider",
  },
];

const ROTATE_MS = 6000;

function HotspotButton({ style, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute z-10 cursor-pointer rounded-lg transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
      style={style}
    />
  );
}

export default function LandingTopPromoCarousel() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [howItWorksAudience, setHowItWorksAudience] = useState(null);

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
    <>
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
            <div className="relative block w-full aspect-[2172/724] overflow-hidden rounded-xl">
              <img
                key={slide.id}
                src={slide.src}
                alt={slide.alt}
                className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none"
                draggable={false}
              />

              <HotspotButton
                style={REGISTER_HOTSPOT}
                label={
                  slide.audience === "provider"
                    ? "Zarejestruj się jako wykonawca"
                    : "Załóż darmowe konto"
                }
                onClick={() => navigate(slide.registerLink)}
              />
              <HotspotButton
                style={HOW_IT_WORKS_HOTSPOT}
                label="Jak to działa"
                onClick={() => setHowItWorksAudience(slide.audience)}
              />
            </div>

            {SLIDES.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-1.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 md:opacity-60 md:group-hover:opacity-100"
                  style={{ borderColor: "var(--border)" }}
                  aria-label="Poprzedni baner"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-700" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-1.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 md:opacity-60 md:group-hover:opacity-100"
                  style={{ borderColor: "var(--border)" }}
                  aria-label="Następny baner"
                >
                  <ChevronRight className="h-4 w-4 text-slate-700" aria-hidden />
                </button>

                <div className="absolute bottom-1.5 left-1/2 z-20 flex -translate-x-1/2 gap-1">
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIndex(i)}
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

      <HowItWorksAudienceModal
        open={howItWorksAudience != null}
        audience={howItWorksAudience ?? "client"}
        onClose={() => setHowItWorksAudience(null)}
      />
    </>
  );
}
