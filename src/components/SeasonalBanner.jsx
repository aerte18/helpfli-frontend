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
      <section className="py-10 md:py-16">
        <div className="text-center mb-6 md:mb-12 px-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 md:mb-4" style={{ backgroundColor: 'oklch(0.95 0.05 264)', color: 'var(--primary)' }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary)' }}></span>
            Sezon: {SEASON_NAMES[season]}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">Polecane usługi sezonowe</h2>
          <p className="text-sm md:text-lg mb-2 md:mb-4 px-4" style={{ color: 'var(--muted-foreground)' }}>
            Sprawdzone usługi idealne na {SEASON_ADJECTIVE_FEMININE[season]} porę roku
          </p>
        </div>
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-4 md:p-6 animate-pulse shrink-0 w-[min(280px,82vw)] md:w-auto snap-start" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <div className="h-8 rounded w-1/4 mb-2" style={{ backgroundColor: 'var(--muted)' }}></div>
              <div className="h-6 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--muted)' }}></div>
              <div className="h-4 rounded w-full mb-4" style={{ backgroundColor: 'var(--muted)' }}></div>
              <div className="h-10 rounded w-full" style={{ backgroundColor: 'var(--muted)' }}></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!services.length) return null;

  return (
    <section className="py-10 md:py-16">
      <div className="text-center mb-6 md:mb-12 px-1">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 md:mb-4 font-medium text-sm" style={{ backgroundColor: 'oklch(0.95 0.05 264)', color: 'var(--primary)' }}>
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary)' }}></span>
          Sezon: {SEASON_NAMES[season]}
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4" style={{ color: 'var(--foreground)' }}>Polecane usługi sezonowe</h2>
        <p className="text-sm md:text-lg mb-2 md:mb-4 max-w-2xl mx-auto px-4" style={{ color: 'var(--muted-foreground)' }}>
          Sprawdzone usługi idealne na {SEASON_ADJECTIVE_FEMININE[season]} porę roku
        </p>
        <p className="md:hidden text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Przesuń palcem, aby zobaczyć kolejne usługi
        </p>
      </div>
      {/* Mobile: karuzela pozioma; md+: siatka 3 kolumny */}
      <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] scrollbar-hide">
        {services.map((svc, index) => (
          <div 
            key={svc.slug || index}
            className="rounded-xl p-4 md:p-6 transition-all duration-300 h-full overflow-hidden hover:shadow-xl flex flex-col border shrink-0 w-[min(280px,82vw)] md:w-auto snap-start"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)', 
              borderWidth: '1px' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Ikona i badge */}
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="text-2xl md:text-3xl">{svc.icon}</div>
              <span 
                className="text-[10px] md:text-xs font-semibold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border"
                style={{ 
                  color: 'var(--primary)', 
                  borderColor: 'var(--primary)',
                  backgroundColor: 'transparent'
                }}
              >
                {SEASON_NAMES[season].toUpperCase()}
              </span>
            </div>

            {/* Treść - zajmuje dostępną przestrzeń */}
            <div className="space-y-1.5 md:space-y-2 flex-1 mb-3 md:mb-4">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
                SEZON: {SEASON_NAMES[season].toUpperCase()}
              </p>
              <h3 className="text-base md:text-lg font-bold leading-snug line-clamp-3" style={{ color: 'var(--foreground)' }}>
                {svc.title}
              </h3>
              <p className="text-xs md:text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>
                {svc.copy}
              </p>
            </div>

            {/* Przycisk - zawsze na dole */}
            <Link 
              to={`/home?service=${encodeURIComponent(svc.slug)}`} 
              className="btn-helpfli-primary w-full inline-flex items-center justify-center px-3 py-2.5 md:px-4 md:py-2 text-xs md:text-sm mt-auto min-h-[44px] md:min-h-0"
            >
              Pokaż wykonawców
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
