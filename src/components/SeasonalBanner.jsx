import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";

const API = import.meta.env.VITE_API_URL || "";

function currentSeason() {
  const m = new Date().getMonth() + 1; // 1..12
  if ([12,1,2].includes(m)) return "winter";
  if ([3,4,5].includes(m))  return "spring";
  if ([6,7,8].includes(m))  return "summer";
  return "autumn";
}

const FALLBACK_BY_SEASON = {
  winter: { 
    services: [
      { slug: "klima-regulacja-co", title: "Regulacja/serwis instalacji c.o., sterowniki/termostaty", copy: "Zadbaj o bezpieczeństwo i koszty ogrzewania.", icon: "🔥" },
      { slug: "klima-kominiarz", title: "Kominiarz – przeglądy okresowe", copy: "Przegląd przed sezonem grzewczym.", icon: "🏠" },
      { slug: "ogrod-odśnieżanie", title: "Odśnieżanie", copy: "Zabezpiecz dojście i podjazd.", icon: "❄️" }
    ]
  },
  summer: { 
    services: [
      { slug: "klima-nabicie-czynnika", title: "Nabicie/serwis czynnika, odgrzybianie", copy: "Oddychaj czystym powietrzem i chłódź skuteczniej.", icon: "❄️" },
      { slug: "klima-montaz", title: "Montaż klimatyzacji", copy: "Chłód w upalne dni.", icon: "🌡️" },
      { slug: "ogrod-systemy-nawadniania", title: "Systemy nawadniania – montaż/serwis", copy: "Automatyczne nawadnianie w sezonie.", icon: "💧" }
    ]
  },
  autumn: { 
    services: [
      { slug: "ogrod-czyszczenie-dachu", title: "Czyszczenie dachu", copy: "Przygotuj dom na jesienne ulewy.", icon: "🌧️" },
      { slug: "ogrod-czyszczenie-pieca", title: "Czyszczenie pieca", copy: "Przygotuj piec na sezon grzewczy.", icon: "🔥" },
      { slug: "ogrod-grabienie-lisci", title: "Grabienie liści", copy: "Uporządkuj ogród przed zimą.", icon: "🍂" }
    ]
  },
  spring: { 
    services: [
      { slug: "ogrod-trawnik", title: "Zakładanie trawnika / wertykulacja / aeracja", copy: "Pielęgnacja ogrodu na start sezonu.", icon: "🌱" },
      { slug: "ogrod-przycinanie", title: "Przycinanie krzewów", copy: "Wiosenne cięcia i porządki.", icon: "🌺" },
      { slug: "ogrod-projekt", title: "Projekt ogrodu (koncepcja + nasadzenia)", copy: "Nowe życie w ogrodzie.", icon: "🌷" }
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

export default function SeasonalBanner() {
  const season = useMemo(() => currentSeason(), []);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams({ is_top: "1", seasonal: season, limit: "3" });
        const j = await apiGet(`/api/services?` + qs.toString());
        
        if (j.items?.length) {
          const apiServices = j.items.map(s => ({
            slug: s.slug,
            title: s.name_pl || s.name_en || s.name,
            copy: s.description || "",
            price: (typeof s.base_price_min === 'number' && typeof s.base_price_max === 'number')
              ? `~ ${s.base_price_min}–${s.base_price_max} ${s.unit || 'PLN'}`
              : "",
            icon: season === "winter" ? "🔥" : season === "summer" ? "❄️" : season === "autumn" ? "🌧️" : "🌱"
          }));
          
          // Jeśli API zwróciło mniej usług niż mamy w fallback, uzupełnij fallback
          const fallbackServices = FALLBACK_BY_SEASON[season].services;
          console.log('SeasonalBanner debug:', {
            apiServicesLength: apiServices.length,
            fallbackServicesLength: fallbackServices.length,
            apiServices: apiServices.map(s => s.slug),
            fallbackServices: fallbackServices.map(fb => fb.slug)
          });
          
          if (apiServices.length < fallbackServices.length) {
            // Dodaj brakujące usługi z fallback
            const existingSlugs = new Set(apiServices.map(s => s.slug));
            const additionalServices = fallbackServices
              .filter(fb => !existingSlugs.has(fb.slug))
              .map(fb => ({
                slug: fb.slug,
                title: fb.title,
                copy: fb.copy,
                price: "",
                icon: fb.icon
              }));
            console.log('SeasonalBanner adding services:', additionalServices.map(s => s.slug));
            setServices([...apiServices, ...additionalServices]);
          } else {
            console.log('SeasonalBanner using only API services');
            setServices(apiServices);
          }
        } else {
          setServices(FALLBACK_BY_SEASON[season].services);
        }
      } catch (error) {
        console.error('SeasonalBanner error:', error);
        // nie blokuj UI jeśli API niedostępne – pokazuj fallback
        setServices(FALLBACK_BY_SEASON[season].services);
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
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-[min(300px,86vw)] shrink-0 snap-start rounded-2xl border p-3 shadow-md animate-pulse md:w-auto md:rounded-xl md:p-6 md:shadow-none" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <div className="mb-2 h-6 w-1/4 rounded" style={{ backgroundColor: 'var(--muted)' }} />
              <div className="mb-2 h-5 w-4/5 rounded" style={{ backgroundColor: 'var(--muted)' }} />
              <div className="mb-3 h-3 w-full rounded" style={{ backgroundColor: 'var(--muted)' }} />
              <div className="h-10 w-full rounded-xl" style={{ backgroundColor: 'var(--muted)' }} />
            </div>
          ))}
        </div>
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
        <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl md:mt-0 md:text-4xl" style={{ color: 'var(--foreground)' }}>
          Polecane usługi sezonowe
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-snug sm:text-sm md:mx-auto md:mt-2 md:text-lg md:px-4" style={{ color: 'var(--muted-foreground)' }}>
          Sprawdzone usługi na {SEASON_ADJECTIVE_FEMININE[season]} porę roku.
          <span className="md:hidden"> Przesuń palcem w bok.</span>
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] scrollbar-hide">
        {services.map((svc, index) => (
          <div
            key={svc.slug || index}
            className="flex h-full min-h-0 w-[min(300px,86vw)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border p-3 shadow-md transition-all duration-300 md:w-auto md:rounded-xl md:p-6 md:shadow-none"
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
              <div className="text-2xl leading-none md:text-3xl">{svc.icon}</div>
              <span
                className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold md:px-2 md:py-1 md:text-xs"
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
              <h3 className="line-clamp-3 text-[15px] font-bold leading-snug md:text-lg" style={{ color: 'var(--foreground)' }}>
                {svc.title}
              </h3>
              <p className="line-clamp-2 text-xs leading-snug md:line-clamp-3 md:text-sm md:leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {svc.copy}
              </p>
            </div>

            <Link
              to={`/home?service=${encodeURIComponent(svc.slug)}`}
              className="btn-helpfli-primary mt-auto inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold md:min-h-0 md:rounded-xl md:px-4 md:py-2 md:text-sm"
            >
              Pokaż wykonawców
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
