import { useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AutosuggestInput from "../components/AutosuggestInput";
import PopularServices from "../components/PopularServices";
import SeasonalBanner from "../components/SeasonalBanner";
import ServiceCategoryDropdown from "../components/ServiceCategoryDropdown";
import { CATEGORY_ICONS } from "../components/icons/HelpfliCategoryIcons";
import OriginalLogoIcon from "../components/icons/OriginalLogoIcon";
import Footer from "../components/Footer";
import AskAIButton from "../components/ui/AskAIButton";
import AIBubble from "../components/chat/AIBubble";
const LiveCameraAI = lazy(() => import("../components/LiveCameraAI"));
const UnifiedAIConcierge = lazy(() => import("../components/ai/UnifiedAIConcierge"));
const FeaturedAnnouncements = lazy(() => import("../components/FeaturedAnnouncements"));
import { SERVICES_CATALOG } from "../constants/servicesCatalog";
const HelpfliPromoCarousel = lazy(() => import("../components/HelpfliPromoCarousel"));
const HeroMapAI = lazy(() => import("../components/HeroMapAI"));
import SponsorAdBanner from "../components/SponsorAdBanner";
import { Lightbulb, Target, Zap, Sparkles, ShieldCheck, Star, Users, CheckCircle, MapPin, Search, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function useDebouncedValue(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function ServiceAutocomplete({ value, onChange, onPick }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounced = useDebouncedValue(value, 150);
  const boxRef = useRef(null);

  // Popularne usługi do podpowiadania
  const popularServices = [
    "Hydraulik", "Elektryk", "Sprzątanie", "Montaż mebli", "AGD", "Złota rączka",
    "Malowanie", "Tapetowanie", "Ogrodnik", "Konserwator", "Informatyk", "Korepetytor"
  ];

  useEffect(() => {
    const controller = new AbortController();
    const q = (debounced || "").trim();
    
    // Jeśli pole jest puste, nie pokazuj żadnych podpowiedzi
    if (q.length === 0) {
      setItems([]);
      setOpen(false);
      return;
    }
    
    async function run() {
      try {
        // Pobierz z API tylko gdy jest tekst
        const API = import.meta.env.VITE_API_URL || '';
        const url = `${API}/api/services?query=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        const apiList = Array.isArray(data)
          ? data.map((x) => (typeof x === "string" ? x : x.name))
          : [];
        
        // Dodaj popularne usługi pasujące do wyszukiwania
        const matchingPopular = popularServices.filter(service => 
          service.toLowerCase().includes(q.toLowerCase())
        );
        
        // Połącz i usuń duplikaty
        const combined = [...new Set([...apiList, ...matchingPopular])];
        setItems(combined.slice(0, 8));
        setOpen(true);
      } catch (e) {
        if (e.name !== "AbortError") {
          // Fallback do popularnych usług pasujących do wyszukiwania
          const matchingPopular = popularServices.filter(service => 
            service.toLowerCase().includes(q.toLowerCase())
          );
          setItems(matchingPopular.slice(0, 8));
          setOpen(true);
        }
      }
    }
    run();
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const handleKeyDown = (e) => {
    if (!open) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < items.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : items.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          onPick(items[selectedIndex]);
          setOpen(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleItemClick = (item) => {
    onPick(item);
    setOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setSelectedIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Wybierz usługę lub wpisz czego szukasz"
        className="w-full rounded-2xl border border-gray-300 bg-white/90 px-5 py-3 text-lg shadow-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-black"
        autoComplete="off"
      />
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {items.map((name, idx) => (
            <li
              key={`${name}-${idx}`}
              className={`cursor-pointer px-4 py-2 hover:bg-gray-50 transition-colors ${
                idx === selectedIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
              }`}
              onClick={() => handleItemClick(name)}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
                <span className="font-medium text-black">{name}</span>
                {popularServices.includes(name) && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    Popularne
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


export default function LandingStart() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [seed, setSeed] = useState("");

  // Obsługa przewijania do sekcji po załadowaniu strony z hashem
  useEffect(() => {
    const hash = location.hash || window.location.hash;
    if (hash === '#jak-to-dziala') {
      // Czekamy na załadowanie DOM - dłuższe opóźnienie gdy przechodzimy z innej strony
      const timeout = setTimeout(() => {
        const element = document.getElementById('jak-to-dziala');
        if (element) {
          // Dodatkowe opóźnienie dla smooth scroll
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      }, location.pathname === '/' ? 100 : 300);
      
      return () => clearTimeout(timeout);
    }
  }, [location.hash, location.pathname]);

  const goToSearch = (term = query, slug) => {
    const params = new URLSearchParams();
    if (term?.trim()) {
      params.set("search", term.trim());
    }
    if (slug) {
      params.set("service", slug);
    }
    if (params.toString()) {
      nav(`/home?${params.toString()}`);
    } else {
      nav("/home");
    }
  };

  const triggerAI = (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setSeed(term);
    setAiOpen(true);
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)' }}>
      <Helmet>
        <title>Helpfli — Znajdź pomoc w swojej okolicy</title>
        <meta name="description" content="Znajdź pomoc do codziennych spraw i zadań — od drobnych przysług po profesjonalne usługi. Opisz potrzebę, a połączymy Cię z lokalnymi wykonawcami." />
        <meta property="og:title" content="Helpfli — Znajdź pomoc w swojej okolicy" />
        <meta property="og:description" content="Znajdź pomoc do codziennych spraw i zadań. Opisz potrzebę, a połączymy Cię z lokalnymi wykonawcami." />
      </Helmet>
      {/* Pastelowe plamy gradientowe w tle */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#A2B9FF] opacity-30 blur-[160px]" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[#D4B3FF] opacity-30 blur-[160px]" />
      </div>
      
      {/* HERO */}
      <section className="pt-5 md:pt-6 pb-4 md:pb-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text + primary actions */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Znajdź pomoc<br />
                w kilka sekund
              </h1>
              <p className="text-lg mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Opisz problem lub zapytaj AI, a otrzymasz dopasowane oferty od zweryfikowanych specjalistów w Twojej okolicy.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const seedValue = query || "";
                    if (user?.role === "provider") {
                      window.dispatchEvent(
                        new CustomEvent("openProviderAi", {
                          detail: { prefill: seedValue || "Pomóż mi przygotować lepszą ofertę." },
                        })
                      );
                    } else {
                      setSeed(seedValue);
                      setAiOpen(true);
                    }
                  }}
                  className="btn-helpfli-primary px-6 py-3 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Zapytaj Asystenta AI</span>
                </button>
                <button
                  onClick={() => {
                    if (user?.role === "provider") {
                      nav("/provider-home");
                    } else {
                      nav("/home");
                    }
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-sm md:text-base text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'oklch(0.92 0.05 240)' }}>
                    <MapPin className="w-4 h-4 text-indigo-600" />
                  </span>
                  <span>{user?.role === "provider" ? "Znajdź oferty w okolicy" : "Znajdź specjalistę w okolicy"}</span>
                </button>
              </div>
            </div>

            {/* Right: Map Image */}
            <Suspense fallback={<div className="w-full h-[260px] rounded-3xl bg-slate-100 animate-pulse" />}>
              <HeroMapAI />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Popularne usługi */}
      <section className="pt-6 md:pt-8 pb-2 md:pb-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="rounded-xl p-4 sm:p-6 md:p-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
            <PopularServices 
              onPick={(serviceName) => {
                // serviceName to nazwa usługi (np. "Naprawa wycieku")
                // Musimy znaleźć odpowiedni slug kategorii z SERVICES_CATALOG
                let categorySlug = null;
                // Szukaj w SERVICES_CATALOG
                for (const category of SERVICES_CATALOG) {
                  // Sprawdź czy to nazwa głównej kategorii
                  if (category.label === serviceName || category.id === serviceName) {
                    categorySlug = category.id;
                    break;
                  }
                  // Sprawdź czy to nazwa podkategorii
                  for (const subcat of category.children || []) {
                    if (subcat.label === serviceName || subcat.slug === serviceName) {
                      categorySlug = category.id; // Używamy id głównej kategorii jako parent_slug
                      break;
                    }
                  }
                  if (categorySlug) break;
                }
                // Jeśli nie znaleziono, użyj nazwy jako fallback
                if (!categorySlug) {
                  // Mapowanie popularnych nazw na slugi
                  const nameToSlug = {
                    'Naprawa wycieku': 'hydraulika',
                    'Montaż gniazdek': 'elektryka',
                    'Naprawa AGD': 'agd_rtv',
                    'Sprzątanie mieszkania': 'sprzatanie',
                    'Montaż mebli': 'stolarstwo_montaz',
                    'Złota rączka': 'zlota-raczka',
                    'Malowanie': 'remont_wykończenia',
                    'Klimatyzacja': 'klimatyzacja_ogrzewanie'
                  };
                  categorySlug = nameToSlug[serviceName] || serviceName.toLowerCase().replace(/\s+/g, '-');
                }
                nav(`/home?service=${encodeURIComponent(categorySlug)}`);
              }}
            />
          </div>
        </div>
      </section>

      {/* Promo Carousel */}
      <Suspense fallback={<div className="w-full h-40 rounded-3xl bg-slate-100 animate-pulse" />}>
        <HelpfliPromoCarousel />
      </Suspense>

      {/* Banner reklamowy */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <SponsorAdBanner 
            position="banner" 
            page="landing_page_banner" 
            limit={3}
          />
        </div>
      </section>

      {/* Baner sezonowy */}
      <section className="pt-2 md:pt-3 pb-6 md:pb-8">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="rounded-xl p-6 md:p-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
            <SeasonalBanner />
          </div>
        </div>
      </section>

      {/* CTA dla wykonawców */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="rounded-xl p-6 md:p-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
            <div className="rounded-xl p-6 md:p-8" style={{ background: 'linear-gradient(to right, var(--primary), oklch(from var(--primary) calc(l * 1.1) calc(c * 1.2) h))', color: 'var(--primary-foreground)' }}>
              <div className="flex flex-col items-center text-center gap-6 sm:flex-row sm:text-left">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-3">Jesteś usługodawcą?</h3>
                  <p className="text-base md:text-lg opacity-90">
                    Dołącz do Helpfli i pozyskuj zlecenia. Wyróżnienia, pakiety PRO i gwarancja.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => nav("/register?role=provider")}
                    className="btn-helpfli-primary px-6 py-3"
                    style={{ backgroundColor: 'var(--primary-foreground)', color: 'var(--primary)' }}
                  >
                    Zarejestruj się jako wykonawca
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dlaczego Helpfli + Jak to działa */}
      <section className="py-6 md:py-8" id="jak-to-dziala">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Image with speech bubble */}
            <div className="relative">
              <img
                src="/img/quicksy-happy-user.png"
                alt="Helpfli Platform"
                className="w-full h-auto rounded-xl"
                style={{ mixBlendMode: 'multiply' }}
              />
              {/* Speech bubble */}
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-3 shadow-lg border" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Helpfli ogarnelo fachowca w 10 minut!
                </p>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-5 md:space-y-6">
              {/* Dlaczego Helpfli */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>Dlaczego Helpfli?</h2>
                <p className="text-sm md:text-base mb-4 md:mb-6" style={{ color: 'var(--muted-foreground)' }}>
                  Znajdź sprawdzonego wykonawcę w swojej okolicy w kilka minut. Bezpieczne rozliczenia i ochrona płatności.
                </p>
                <p className="md:hidden text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  Przesuń palcem, aby zobaczyć kolejne atuty
                </p>
                <div className="flex sm:grid sm:grid-cols-2 gap-3 overflow-x-auto sm:overflow-visible -mx-6 px-6 sm:mx-0 sm:px-0 pb-1 snap-x snap-mandatory scrollbar-hide touch-pan-x [-webkit-overflow-scrolling:touch]">
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Szybkość</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>Znajdziesz wykonawcę w kilka minut</p>
                  </div>
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Gwarancja Helpfli</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>Ochrona płatności i bezpieczne rozliczenia</p>
                  </div>
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Asystent AI</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>Inteligentny asystent pomoże</p>
                  </div>
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <Star className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Zweryfikowani wykonawcy</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>KYC i opinie klientów</p>
                  </div>
                </div>
              </div>

              {/* Jak to działa */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Jak to działa</h2>
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Opisz problem", desc: "Krótko napisz co się dzieje. Możesz dodać zdjęcia." },
                    { step: 2, title: "AI diagnozuje", desc: "Otrzymasz wskazówki, widełki ceny i propozycję zlecenia." },
                    { step: 3, title: "Wybierz specjalistę", desc: "Wykonawcy odpowiadają, a Ty wybierasz najlepszą ofertę." }
                  ].map((item) => (
                    <div key={item.step} className="relative p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                        {item.step}
                      </div>
                      <h3 className="font-semibold text-sm mb-1 ml-6" style={{ color: 'var(--foreground)' }}>{item.title}</h3>
                      <p className="text-xs md:text-sm ml-6" style={{ color: 'var(--muted-foreground)' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => nav("/create-order")}
                  className="btn-helpfli-primary px-6 py-3 mt-4"
                >
                  Zacznij teraz
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Announcements */}
      <Suspense fallback={null}>
        <FeaturedAnnouncements />
      </Suspense>

      {/* Mini FAQ */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="rounded-xl p-6 md:p-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Najczęściej zadawane pytania</h2>
              <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
                Odpowiedzi na najważniejsze pytania dotyczące naszej platformy
              </p>
            </div>
            <div className="space-y-4">
              <details className="rounded-lg p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <summary className="cursor-pointer font-medium" style={{ color: 'var(--foreground)' }}>Czy muszę zakładać konto, żeby korzystać?</summary>
                <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Nie – możesz przetestować Asystenta AI i wyszukiwanie wykonawców bez logowania. Konto potrzebne jest dopiero do utworzenia zlecenia lub płatności.
                </p>
              </details>
              <details className="rounded-lg p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <summary className="cursor-pointer font-medium" style={{ color: 'var(--foreground)' }}>Jak działa gwarancja Helpfli?</summary>
                <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Jeśli płacisz przez system, Twoje pieniądze są chronione do momentu zakończenia usługi. W razie problemów możesz zgłosić reklamację.
                </p>
              </details>
              <details className="rounded-lg p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <summary className="cursor-pointer font-medium" style={{ color: 'var(--foreground)' }}>Czy mogę zostać wykonawcą?</summary>
                <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Tak! Zarejestruj się jako usługodawca, przejdź weryfikację KYC i zacznij pozyskiwać zlecenia w swojej okolicy.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Popup powiadomień */}
      {(() => {
        // Sprawdź czy użytkownik już podjął decyzję
        const hasUserDecided = localStorage.getItem('notification-preference');
        
        // Jeśli użytkownik już podjął decyzję, nie pokazuj popupu
        if (hasUserDecided) return null;
        
        return (
          <div className="fixed top-20 right-4 z-50 max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Powiadomienia</h4>
                  <p className="text-sm text-gray-500">Włącz powiadomienia</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Otrzymuj powiadomienia o nowych ofertach, akceptacjach i ważnych aktualizacjach.
              </p>
              
              <button 
                onClick={() => {
                  // Zapisz wybór użytkownika
                  localStorage.setItem('notification-preference', 'enabled');
                  
                  // Tutaj można dodać logikę włączania powiadomień
                  const notification = document.querySelector('.fixed.top-20.right-4');
                  if (notification) {
                    notification.style.display = 'none';
                  }
                }}
                className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 font-medium hover:bg-indigo-700 transition-colors"
              >
                Włącz powiadomienia
              </button>
              
              <button 
                onClick={() => {
                  // Zapisz wybór użytkownika
                  localStorage.setItem('notification-preference', 'later');
                  
                  const notification = document.querySelector('.fixed.top-20.right-4');
                  if (notification) {
                    notification.style.display = 'none';
                  }
                }}
                className="w-full mt-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Później
              </button>
            </div>
          </div>
        );
      })()}

      <Footer />

      {/* Asystent AI - modal */}
      <Suspense fallback={null}>
        <UnifiedAIConcierge 
          mode="modal"
          open={aiOpen} 
          onClose={() => setAiOpen(false)} 
          seedQuery={seed}
        />
      </Suspense>
      
      {/* Live Camera AI Modal */}
      <Suspense fallback={null}>
        <LiveCameraAI
          open={showLiveCamera}
          onClose={() => setShowLiveCamera(false)}
          onAnalyzeComplete={(result) => {
            // Po analizie można otworzyć Asystenta AI z wynikami lub przekierować do CreateOrder
            setShowLiveCamera(false);
            if (result.serviceCandidate) {
              // Opcjonalnie: otwórz Asystenta AI z wynikami
              // setAiOpen(true);
              // setSeed(`Widzę problem związany z ${result.serviceCandidate.name}`);
            }
          }}
        />
      </Suspense>
    </div>
  );
}
