import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { openHowItWorksModal } from "../utils/openHowItWorksModal";
import PromoPicture from "./PromoPicture";

const ASSETS_VERSION = "20260604i";
const BANNER_W = 2172;
const BANNER_H = 724;

function promoImg(fileName) {
  return `/img/${encodeURIComponent(fileName)}?v=${ASSETS_VERSION}`;
}

/** Współrzędne z projektu grafiki 2172×724 → procenty (skalują się z banerem). */
function btnRect(x, y, w, h) {
  return {
    left: `${(x / BANNER_W) * 100}%`,
    top: `${(y / BANNER_H) * 100}%`,
    width: `${(w / BANNER_W) * 100}%`,
    height: `${(h / BANNER_H) * 100}%`,
  };
}

const SLIDES = [
  {
    id: "client",
    audience: "client",
    alt: "Baner dla klienta",
    src: promoImg("promo klient.png"),
    registerLink:
      "/register?role=client&utm_source=landing&utm_campaign=promo_strip_client",
    registerArea: btnRect(52, 418, 498, 98),
    howItWorksArea: btnRect(562, 418, 368, 98),
  },
  {
    id: "provider",
    audience: "provider",
    alt: "Baner dla wykonawcy",
    src: promoImg("promo provider.png"),
    registerLink:
      "/register?role=provider&utm_source=landing&utm_campaign=promo_strip_provider",
    registerArea: btnRect(52, 418, 648, 98),
    howItWorksArea: btnRect(712, 418, 368, 98),
  },
];

const ROTATE_MS = 6000;

/** Bez wizualnego hovera — tylko kursor; unikamy „szarego prostokąta” obok przycisków. */
const HOTSPOT_CLASS =
  "absolute z-30 block cursor-pointer touch-manipulation rounded-[10px] bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 pointer-events-auto";

function useHotspotDebug() {
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    try {
      setDebug(
        new URLSearchParams(window.location.search).get("promo_hotspot_debug") === "1"
      );
    } catch {
      setDebug(false);
    }
  }, []);
  return debug;
}

export default function LandingTopPromoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const hotspotDebug = useHotspotDebug();
  const hotspotClass = hotspotDebug
    ? `${HOTSPOT_CLASS} ring-2 ring-red-500/80 bg-red-500/25`
    : HOTSPOT_CLASS;

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
            <div className="relative w-full aspect-[2172/724]">
              <PromoPicture
                key={slide.id}
                pngSrc={slide.src}
                alt={slide.alt}
                width={BANNER_W}
                height={BANNER_H}
                className="block h-full w-full select-none"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />

              <div className="absolute inset-0 z-20">
                <Link
                  to={slide.registerLink}
                  className={hotspotClass}
                  style={slide.registerArea}
                  aria-label={
                    slide.audience === "provider"
                      ? "Zarejestruj się jako wykonawca"
                      : "Załóż darmowe konto"
                  }
                />
                <button
                  type="button"
                  className={hotspotClass}
                  style={slide.howItWorksArea}
                  aria-label="Jak to działa"
                  onClick={() => openHowItWorksModal(slide.audience)}
                />
              </div>
            </div>

            {SLIDES.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-1.5 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 shadow-sm md:opacity-70 md:group-hover:opacity-100"
                  style={{ borderColor: "var(--border)" }}
                  aria-label="Poprzedni baner"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-700" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-1.5 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 shadow-sm md:opacity-70 md:group-hover:opacity-100"
                  style={{ borderColor: "var(--border)" }}
                  aria-label="Następny baner"
                >
                  <ChevronRight className="h-4 w-4 text-slate-700" aria-hidden />
                </button>

                <div className="absolute top-2 right-2 z-40 flex gap-1.5 pointer-events-auto">
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`h-2 rounded-full transition-all shadow-sm ${
                        i === index ? "w-5 bg-indigo-600" : "w-2 bg-white/90 ring-1 ring-slate-300/80"
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
    </>
  );
}
