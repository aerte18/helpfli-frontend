import { useState, useEffect, useMemo, useRef } from "react";
import { CATEGORY_ICONS } from "./icons/HelpfliCategoryIcons";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Fallback kafelków – pokażemy konkretne, chwytliwe przypadki użycia
const DEFAULT = [
  { key: "hydraulika", label: "Hydraulik – naprawa kranu", icon: CATEGORY_ICONS.hydraulika },
  { key: "elektryka", label: "Elektryk – gniazdko", icon: CATEGORY_ICONS.elektryka },
  { key: "agd_rtv", label: "AGD – pralka nie wiruje", icon: CATEGORY_ICONS.agd_rtv },
  { key: "sprzatanie", label: "Sprzątanie – mieszkanie 50 m²", icon: CATEGORY_ICONS.sprzatanie },
  { key: "stol_montaz", label: "Montaż mebli", icon: CATEGORY_ICONS.stol_montaz },
  { key: "zlota_raczka", label: "Mini naprawy – Złota Rączka", icon: CATEGORY_ICONS.zlota_raczka },
  { key: "remont", label: "Malowanie – pokój", icon: CATEGORY_ICONS.remont },
  { key: "klimatyzacja_ogrzewanie", label: "Klimatyzacja – montaż", icon: CATEGORY_ICONS.klimatyzacja_ogrzewanie },
  { key: "dom_ogrod", label: "Ogrodnik – pielęgnacja", icon: CATEGORY_ICONS.dom_ogrod },
  { key: "przeprowadzki_transport", label: "Przeprowadzka", icon: CATEGORY_ICONS.przeprowadzki_transport },
  { key: "it_smart", label: "IT – naprawa komputera", icon: CATEGORY_ICONS.it_smart },
  { key: "gaz", label: "Gaz – przegląd", icon: CATEGORY_ICONS.gaz },
  { key: "monitoring", label: "Monitoring – kamery", icon: CATEGORY_ICONS.monitoring },
  { key: "wywoz_utylizacja", label: "Wywóz – gruz", icon: CATEGORY_ICONS.wywoz_utylizacja },
  { key: "pomoc_24h", label: "Pomoc 24/7 – awaria", icon: CATEGORY_ICONS.pomoc_24h || CATEGORY_ICONS["24h"] },
  { key: "slusarz_zabezpieczenia", label: "Ślusarz – zamki", icon: CATEGORY_ICONS.slusarz_zabezpieczenia },
  { key: "auto_mobilne", label: "Auto – pomoc drogowa", icon: CATEGORY_ICONS.auto_mobilne },
];

export default function PopularServices({ onPick, services = null }) {
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const scrollRef = useRef(null);

  // Pobierz popularne usługi z API
  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || "";
        console.log('PopularServices - fetching from:', `${API}/api/services?is_top=1&limit=18`);
        const res = await fetch(`${API}/api/services?is_top=1&limit=18`);
        console.log('PopularServices - response status:', res.status);
        if (res.ok) {
          const result = await res.json();
          const apiServices = result.items || result || [];
          console.log('PopularServices - API returned:', apiServices.length, 'services');
          
          // Mapuj usługi na format używany przez komponent
          const mappedServices = apiServices.map(service => {
            const parentSlug = service.parent_slug || service.slug;
            // Mapuj parent_slug na odpowiednie ikony
            let iconKey = parentSlug;
            if (parentSlug === 'hydraulik') iconKey = 'hydraulika';
            if (parentSlug === 'elektryk') iconKey = 'elektryka';
            if (parentSlug === 'montaz-mebli') iconKey = 'montaz';
            if (parentSlug === 'zlota-raczka') iconKey = 'slusarz';
            if (parentSlug === 'malowanie') iconKey = 'remont';
            if (parentSlug === 'transport') iconKey = 'przeprowadzki';
            
            console.log('PopularServices - mapping service:', {
              name: service.name_pl || service.name_en || service.name,
              parentSlug,
              iconKey,
              hasIcon: !!CATEGORY_ICONS[iconKey]
            });
            
            return {
              key: parentSlug,
              label: service.name_pl || service.name_en || service.name,
              icon: CATEGORY_ICONS[iconKey] || CATEGORY_ICONS['inne']
            };
          });
          
          setPopularServices(mappedServices);
        }
      } catch (error) {
        console.error('Błąd pobierania popularnych usług:', error);
        // W przypadku błędu użyj domyślnej listy
        console.log('PopularServices - using DEFAULT fallback');
        setPopularServices(DEFAULT);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularServices();
  }, []);

  const list = useMemo(() => {
    if (services) return services; // Jeśli przekazano services jako prop
    return popularServices.length > 0 ? popularServices : DEFAULT;
  }, [services, popularServices]);

  const iconBgColors = [
    'oklch(0.92 0.05 270)', // light purple
    'oklch(0.95 0.05 90)',  // light yellow/cream
    'oklch(0.9 0.05 240)',  // light blue
    'oklch(0.95 0.05 330)', // light pink
    'oklch(0.9 0.05 150)',  // light green
    'oklch(0.92 0.05 270)', // repeat colors
    'oklch(0.95 0.05 90)',
    'oklch(0.9 0.05 240)',
  ];

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="">
        <div className="text-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Popularne usługi</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex-shrink-0">
              <div className="rounded-xl p-3 h-full" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', width: '120px', height: '100px' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[200px]">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Popularne usługi</h2>
      </div>
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation Arrows */}
        {list.length > 4 && (
          <>
            <button
              type="button"
              onClick={scrollLeft}
              className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-30 w-11 h-11 rounded-full items-center justify-center transition-all ${
                isHovered ? 'opacity-100' : 'opacity-30'
              }`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
            </button>

            <button
              type="button"
              onClick={scrollRight}
              className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 z-30 w-11 h-11 rounded-full items-center justify-center transition-all ${
                isHovered ? 'opacity-100' : 'opacity-30'
              }`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
            </button>
          </>
        )}

        {/* Scrollable Container */}
        <p className="md:hidden text-center text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
          Przesuń palcem, aby zobaczyć więcej
        </p>
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-hide snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] pl-2 pr-2 md:pl-0 md:pr-0"
          style={{ scrollBehavior: 'smooth' }}
        >
          {list.map((s, index) => {
            const IconComponent = s.icon;
            const bgColor = iconBgColors[index % iconBgColors.length];
            const isActive = activeKey === s.key;
            return (
              <button
                key={s.key}
                onClick={() => {
                  const name = s.label || s.key;
                  const nextActive = activeKey === s.key ? null : s.key;
                  setActiveKey(nextActive);
                  if (nextActive) {
                    onPick?.(name, true);
                  } else {
                    onPick?.(name, false);
                  }
                }}
                className={`group flex-shrink-0 flex flex-col items-center justify-between rounded-xl p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer snap-start min-h-[120px] active:scale-[0.98] ${
                  isActive ? 'ring-2 ring-indigo-500' : ''
                }`}
                style={{ 
                  backgroundColor: isActive ? 'var(--muted)' : 'var(--card)', 
                  borderColor: isActive ? 'var(--primary)' : 'var(--border)', 
                  borderWidth: '1px',
                  width: '120px',
                  height: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isActive ? 'var(--primary)' : 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex-1 flex items-center justify-center min-h-[40px]">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: bgColor }}
                  >
                    {IconComponent ? (
                      <IconComponent 
                        className="w-6 h-6 flex-shrink-0" 
                        style={{ color: 'oklch(0.3 0.15 264)' }}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-center mt-2 line-clamp-2" style={{ color: 'var(--foreground)' }}>
                  {s.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}