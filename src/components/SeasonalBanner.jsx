import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";
import { CategoryIcon } from "./icons/HelpfliCategoryIcons";
import { resolveSeasonalServiceIcon } from "../utils/seasonalServiceIcon";
import { ChevronLeft, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

function currentSeason() {
  const m = new Date().getMonth() + 1; // 1..12
  if ([12,1,2].includes(m)) return "winter";
  if ([3,4,5].includes(m))  return "spring";
  if ([6,7,8].includes(m))  return "summer";
  return "autumn";
}

// Slugi zgodne z services_catalog.json / Mongo Service — inaczej /home?service=… nie trafia w katalog
const FALLBACK_BY_SEASON = {
  winter: { 
    services: [
      { slug: "klimatyzacja-ogrzewanie-regulacja-serwis-instalacji-c-o-sterowniki-termostaty", title: "Regulacja/serwis instalacji c.o., sterowniki/termostaty", copy: "Zadbaj o bezpieczeństwo i koszty ogrzewania." },
      { slug: "klimatyzacja-ogrzewanie-kominiarz-przeglady-okresowe", title: "Kominiarz – przeglądy okresowe", copy: "Przegląd przed sezonem grzewczym." },
      { slug: "dom-ogrod-odsniezanie", title: "Odśnieżanie", copy: "Zabezpiecz dojście i podjazd." }
    ]
  },
  summer: { 
    services: [
      { slug: "klimatyzacja-ogrzewanie-nabicie-serwis-czynnika-odgrzybianie", title: "Nabicie/serwis czynnika, odgrzybianie", copy: "Oddychaj czystym powietrzem i chłódź skuteczniej." },
      { slug: "klimatyzacja-ogrzewanie-montaz-klimatyzacji", title: "Montaż klimatyzacji", copy: "Chłód w upalne dni." },
      { slug: "dom-ogrod-systemy-nawadniania-montaz-serwis", title: "Systemy nawadniania – montaż/serwis", copy: "Automatyczne nawadnianie w sezonie." }
    ]
  },
  autumn: { 
    services: [
      { slug: "dom-ogrod-czyszczenie-dachu", title: "Czyszczenie dachu", copy: "Przygotuj dom na jesienne ulewy." },
      { slug: "dom-ogrod-czyszczenie-pieca", title: "Czyszczenie pieca", copy: "Przygotuj piec na sezon grzewczy." },
      { slug: "dom-ogrod-grabienie-lisci", title: "Grabienie liści", copy: "Uporządkuj ogród przed zimą." }
    ]
  },
  spring: { 
    services: [
      { slug: "dom-ogrod-zak-adanie-trawnika-wertykulacja-aeracja", title: "Zakładanie trawnika / wertykulacja / aeracja", copy: "Pielęgnacja ogrodu na start sezonu." },
      { slug: "dom-ogrod-przycinanie-krzewow", title: "Przycinanie krzewów", copy: "Wiosenne cięcia i porządki." },
      { slug: "dom-ogrod-projekt-ogrodu-koncepcja-nasadzenia", title: "Projekt ogrodu (koncepcja + nasadzenia)", copy: "Nowe życie w ogrodzie." }
    ]
  }
};

const SEASON_NAMES = {
  winter: "Zima",
  spring: "Wiosna", 
  summer: "Lato",
  autumn: "Jesień"
};

/** Do frazy „na … porę roku” (np. wiosenną, letnią) */
const SEASON_ADJECTIVE_FEMININE = {
  winter: "zimową",
  spring: "wiosenną",
  summer: "letnią",
  autumn: "jesienną"
};

const SEASONAL_CACHE_TTL_MS = 10 * 60 * 1000;

function hydrateSeasonalServices(list) {
  return list.map((s) => ({
    ...s,
    icon: resolveSeasonalServiceIcon({ slug: s.slug, title: s.title, parent_slug: s.parent_slug }),
  }));
}

const CAROUSEL_ARROW_CLASS =
  "absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 shadow-md transition-all hover:scale-105 hover:bg-white md:h-11 md:w-11";

function SeasonalServicesCarousel({ railRef, canScrollLeft, canScrollRight, onScrollBy, onWheel, children }) {
  return (
    <div className="group/carousel relative">
      {canScrollLeft ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--card)] via-[var(--card)]/80 to-transparent md:w-16"
          aria-hidden
        />
      ) : null}
      {canScrollRight ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--card)] via-[var(--card)]/80 to-transparent md:w-16"
          aria-hidden
        />
      ) : null}

      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => onScrollBy(-1)}
          className={`${CAROUSEL_ARROW_CLASS} left-0 md:left-1`}
          style={{ borderColor: "var(--border)" }}
          aria-label="Poprzednie usługi sezonowe"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" aria-hidden />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => onScrollBy(1)}
          className={`${CAROUSEL_ARROW_CLASS} right-0 md:right-1`}
          style={{ borderColor: "var(--border)" }}
          aria-label="Następne usługi sezonowe"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" aria-hidden />
        </button>
      ) : null}

      <div
        ref={railRef}
        onWheel={onWheel}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] scrollbar-hide scroll-smooth md:gap-4"
        style={{ scrollPaddingInline: "2.75rem" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function SeasonalBanner() {
  const season = useMemo(() => currentSeason(), []);
  const railRef = useRef(null);
  const [services, setServices] = useState(() =>
    hydrateSeasonalServices(FALLBACK_BY_SEASON[season].services)
  );
  const [loading, setLoading] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  const scrollByDirection = useCallback((direction) => {
    const el = railRef.current;
    if (!el) return;
    const firstCard = el.querySelector("[data-seasonal-card]");
    const gap = window.matchMedia("(min-width: 768px)").matches ? 16 : 12;
    const step = firstCard ? firstCard.offsetWidth + gap : Math.round(el.clientWidth * 0.88);
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  const handleWheelScroll = useCallback((e) => {
    const el = railRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    el.scrollBy({ left: e.deltaY, behavior: "auto" });
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return undefined;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [services.length, loading, updateScrollState]);

  useEffect(() => {
    const cacheKey = `seasonalBanner:v2:${season}`;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.ts && Array.isArray(parsed?.services) && (Date.now() - parsed.ts) < SEASONAL_CACHE_TTL_MS) {
          setServices(hydrateSeasonalServices(parsed.services));
        }
      }
    } catch (_) {}

    (async () => {
      try {
        const qs = new URLSearchParams({ is_top: "1", seasonal: season, limit: "3" });
        const j = await apiGet(`/api/services?` + qs.toString());
        
        if (j.items?.length) {
          const mapService = (s) => ({
            slug: s.slug,
            title: s.name_pl || s.name_en || s.name,
            copy: s.description || "",
            price:
              typeof s.base_price_min === "number" && typeof s.base_price_max === "number"
                ? `~ ${s.base_price_min}–${s.base_price_max} ${s.unit || "PLN"}`
                : "",
            icon: resolveSeasonalServiceIcon({
              slug: s.slug,
              title: s.name_pl || s.name_en || s.name,
              parent_slug: s.parent_slug,
            }),
          });

          const apiServices = j.items.map(mapService);

          const fallbackServices = FALLBACK_BY_SEASON[season].services;

          if (apiServices.length < fallbackServices.length) {
            const existingSlugs = new Set(apiServices.map((s) => s.slug));
            const additionalServices = fallbackServices
              .filter((fb) => !existingSlugs.has(fb.slug))
              .map((fb) => ({
                slug: fb.slug,
                title: fb.title,
                copy: fb.copy,
                price: "",
                icon: resolveSeasonalServiceIcon({
                  slug: fb.slug,
                  title: fb.title,
                }),
              }));
            const merged = [...apiServices, ...additionalServices];
            setServices(merged);
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), services: merged }));
            } catch (_) {}
          } else {
            setServices(apiServices);
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), services: apiServices }));
            } catch (_) {}
          }
        } else {
          setServices(hydrateSeasonalServices(FALLBACK_BY_SEASON[season].services));
        }
      } catch (error) {
        console.error("SeasonalBanner error:", error);
        setServices(hydrateSeasonalServices(FALLBACK_BY_SEASON[season].services));
      } finally {
        setLoading(false);
      }
    })();
  }, [season]);


  if (loading) {
    return (
      <section className="py-1 md:py-4">
        <div className="mb-3 rounded-2xl border p-3 text-left md:mb-10 md:p-0 md:text-center md:border-0" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, oklch(0.96 0.04 264 / 0.5), oklch(0.95 0.06 290 / 0.35))' }}>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold md:mb-4 md:px-4 md:py-2 md:text-sm" style={{ backgroundColor: 'var(--card)', color: 'var(--primary)', boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
            <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
            Sezon: {SEASON_NAMES[season]}
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl md:mt-0 md:text-4xl" style={{ color: 'var(--foreground)' }}>Polecane usługi sezonowe</h2>
          <p className="mt-1 text-xs leading-snug sm:text-sm md:mt-2 md:text-lg md:px-4" style={{ color: 'var(--muted-foreground)' }}>
            Na {SEASON_ADJECTIVE_FEMININE[season]} porę roku — przesuń karty w bok
          </p>
        </div>
        <SeasonalServicesCarousel
          railRef={railRef}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollBy={scrollByDirection}
          onWheel={handleWheelScroll}
        >
          {[1, 2, 3].map(i => (
            <div key={i} data-seasonal-card className="w-[min(340px,86vw)] shrink-0 snap-start rounded-2xl border p-3 shadow-md animate-pulse md:w-[340px] md:rounded-xl md:p-6 md:shadow-none" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <div className="mb-2 h-6 w-1/4 rounded" style={{ backgroundColor: 'var(--muted)' }} />
              <div className="mb-2 h-5 w-4/5 rounded" style={{ backgroundColor: 'var(--muted)' }} />
              <div className="mb-3 h-3 w-full rounded" style={{ backgroundColor: 'var(--muted)' }} />
              <div className="h-10 w-full rounded-xl" style={{ backgroundColor: 'var(--muted)' }} />
            </div>
          ))}
        </SeasonalServicesCarousel>
      </section>
    );
  }

  if (!services.length) return null;

  return (
    <section className="py-1 md:py-4">
      {/* Mobile: panel jak ekran w apce — wyraźniejszy nagłówek; desktop: klasycznie wyśrodkowany */}
      <div
        className="mb-3 rounded-2xl border p-3 text-left md:mb-10 md:border-0 md:bg-transparent md:p-0 md:text-center"
        style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, oklch(0.96 0.04 264 / 0.55), oklch(0.95 0.06 290 / 0.4))' }}
      >
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm md:mb-4 md:px-4 md:py-2 md:text-sm"
          style={{ backgroundColor: 'var(--card)', color: 'var(--primary)' }}
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
          Sezon: {SEASON_NAMES[season]}
        </span>
        <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-tight sm:text-2xl md:mt-0 md:text-4xl" style={{ color: 'var(--foreground)' }}>
          Polecane usługi sezonowe
        </h2>
        <p className="mt-1.5 max-w-2xl text-xs leading-snug sm:text-sm md:mx-auto md:mt-2 md:text-lg md:px-4" style={{ color: 'var(--muted-foreground)' }}>
          Sprawdzone usługi na {SEASON_ADJECTIVE_FEMININE[season]} porę roku.
          <span className="md:hidden"> Przesuń palcem w bok.</span>
        </p>
      </div>

      <SeasonalServicesCarousel
        railRef={railRef}
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        onScrollBy={scrollByDirection}
        onWheel={handleWheelScroll}
      >
        {services.map((svc, index) => (
          <div
            key={svc.slug || index}
            data-seasonal-card
            className="flex h-[238px] w-[84vw] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border p-3 shadow-md transition-all duration-300 md:h-auto md:w-[340px] md:rounded-xl md:p-6 md:shadow-none"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              borderWidth: '1px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div className="mb-2 flex items-start justify-between md:mb-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-11 md:w-11"
                style={{ backgroundColor: "oklch(0.94 0.04 264 / 0.55)" }}
              >
                <CategoryIcon
                  icon={svc.icon}
                  className="h-5 w-5 md:h-6 md:w-6"
                  style={{ color: "var(--primary)" }}
                />
              </div>
              <span
                className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide md:px-2 md:py-1 md:text-xs"
                style={{
                  color: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  backgroundColor: 'transparent',
                }}
              >
                {SEASON_NAMES[season].toUpperCase()}
              </span>
            </div>

            <div className="mb-2 flex flex-1 flex-col space-y-1 md:mb-4 md:space-y-2">
              <h3 className="line-clamp-3 text-[17px] font-bold leading-snug md:text-lg" style={{ color: 'var(--foreground)' }}>
                {svc.title}
              </h3>
              <p className="line-clamp-2 text-xs leading-snug md:line-clamp-3 md:text-sm md:leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {svc.copy}
              </p>
            </div>

            <Link
              to={`/home?service=${encodeURIComponent(svc.slug)}`}
              className="btn-helpfli-primary mt-auto inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold md:min-h-0 md:rounded-xl md:px-4 md:py-2 md:text-sm"
            >
              Pokaż wykonawców
            </Link>
          </div>
        ))}
      </SeasonalServicesCarousel>
    </section>
  );
}
