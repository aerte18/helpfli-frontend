import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AutosuggestInput from "../components/AutosuggestInput";
import PopularServices from "../components/PopularServices";
import SeasonalBanner from "../components/SeasonalBanner";
import ServiceCategoryDropdown from "../components/ServiceCategoryDropdown";
import { CATEGORY_ICONS } from "../components/icons/HelpfliCategoryIcons";
import OriginalLogoIcon from "../components/icons/OriginalLogoIcon";
import AIBubble from "../components/chat/AIBubble";
const LiveCameraAI = lazy(() => import("../components/LiveCameraAI"));
const UnifiedAIConcierge = lazy(() => import("../components/ai/UnifiedAIConcierge"));
const FeaturedAnnouncements = lazy(() => import("../components/FeaturedAnnouncements"));
const HelpfliPromoCarousel = lazy(() => import("../components/HelpfliPromoCarousel"));
const HeroMapAI = lazy(() => import("../components/HeroMapAI"));
const Footer = lazy(() => import("../components/Footer"));
const FoundingProviderPopup = lazy(() => import("../components/FoundingProviderPopup"));
const SponsorAdBanner = lazy(() => import("../components/SponsorAdBanner"));
const FoundingProviderBanner = lazy(() => import("../components/FoundingProviderBanner"));
const LandingTopPromoCarousel = lazy(() => import("../components/LandingTopPromoCarousel"));
import { openHowItWorksModal } from "../utils/openHowItWorksModal";
import { Lightbulb, Target, Zap, Sparkles, ShieldCheck, Star, Users, CheckCircle, MapPin, Search, ChevronRight, Briefcase, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const HERO_QUICK_START = {
  client: {
    eyebrow: "Szybki start",
    lead: "Wybierz usługę i porównaj oferty w swojej okolicy.",
    emphasis: "Szybko, bezpiecznie, bez dzwonienia po znajomych.",
    steps: [
      { Icon: Search, title: "Opisz problem", text: "Usługa + krótki opis lub AI" },
      { Icon: Users, title: "Porównaj oferty", text: "Wykonawcy odpowiadają z wyceną" },
      { Icon: ShieldCheck, title: "Wybierz i zapłać", text: "Bezpiecznie przez Helpfli" },
    ],
  },
  provider: {
    eyebrow: "Start wykonawcy",
    lead: "Dołącz do sieci lokalnych specjalistów i odbieraj zapytania od klientów.",
    emphasis: "Zero opłat startowych — płacisz dopiero, gdy zarabiasz.",
    steps: [
      { Icon: Briefcase, title: "Uzupełnij profil", text: "Usługi, obszar i weryfikacja" },
      { Icon: ClipboardList, title: "Przeglądaj zlecenia", text: "Mapa i lista w Twojej okolicy" },
      { Icon: Sparkles, title: "Wyślij ofertę", text: "AI podpowie cenę i treść" },
    ],
  },
};

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
        const url = apiUrl(`/api/services?query=${encodeURIComponent(q)}`);
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

function LandingHappyUserFigure({ className = "", imageClassName = "" }) {
  return (
    <div className={`relative ${className}`.trim()}>
      <img
        src="/img/jak%20to%20dzia%C5%82a.png"
        alt="Jak działa Helpfli — od opisu problemu do wybranej oferty"
        className={`block w-full h-auto rounded-xl ${imageClassName}`.trim()}
      />
    </div>
  );
}

export default function LandingStart() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("client");
  const [aiOpen, setAiOpen] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [seed, setSeed] = useState("");

  const quickStart = useMemo(() => {
    const mode = user?.role === "provider" || audience === "provider" ? "provider" : "client";
    return HERO_QUICK_START[mode];
  }, [user?.role, audience]);

  useEffect(() => {
    if (user?.role === "provider") {
      setAudience("provider");
    } else {
      setAudience("client");
    }
  }, [user?.role]);

  useEffect(() => {
    if (location.hash !== "#jak-to-dziala") return undefined;
    const timeout = setTimeout(() => openHowItWorksModal("client"), 150);
    return () => clearTimeout(timeout);
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

      {/* Kompaktowa karuzela promo (klient / wykonawca) — pod nagłówkiem, nad hero */}
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 pt-2"><div className="h-[128px] sm:h-[140px] md:h-[152px] w-full rounded-xl bg-slate-100 animate-pulse" /></div>}>
        <LandingTopPromoCarousel />
      </Suspense>

      {/* HERO */}
      <section className="pt-3 md:pt-4 pb-4 md:pb-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text + primary actions */}
            <div className="min-w-0">
              {!user && (
                <div className="mb-3 inline-flex rounded-xl border p-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                  <button
                    type="button"
                    onClick={() => setAudience("client")}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${audience === "client" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Szukam pomocy
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience("provider")}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${audience === "provider" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Jestem wykonawcą
                  </button>
                </div>
              )}
              <h1 className="mb-3 text-[1.65rem] font-bold leading-tight tracking-tight sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl whitespace-pre-line" style={{ color: 'var(--foreground)' }}>
                {audience === "provider" ? "Pozyskuj zlecenia\nw swojej okolicy" : "Znajdź sprawdzoną pomoc\nw kilka minut"}
              </h1>

              <div
                key={quickStart.eyebrow}
                className="mb-5 sm:mb-6 overflow-hidden rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/40 px-4 py-4 sm:px-5 sm:py-5 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-2">
                  {quickStart.eyebrow}
                </p>
                <p className="text-sm sm:text-[15px] leading-relaxed text-slate-600">
                  {quickStart.lead}{" "}
                  <span className="font-semibold text-slate-900">{quickStart.emphasis}</span>
                </p>
                <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-indigo-100/80">
                  {quickStart.steps.map((step, index) => {
                    const StepIcon = step.Icon;
                    return (
                      <li
                        key={step.title}
                        className="flex gap-3 sm:flex-col sm:gap-2.5 sm:px-4 first:sm:pl-0 last:sm:pr-0"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-indigo-100">
                          <StepIcon className="h-[18px] w-[18px] text-indigo-600" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600/90">
                            Krok {index + 1}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{step.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-3 lg:max-w-2xl">
                <button
                  type="button"
                  onClick={() => {
                    if (user?.role === "provider" || audience === "provider") {
                      nav("/provider-home");
                    } else {
                      nav("/home");
                    }
                  }}
                  className="btn-helpfli-primary w-full min-h-[52px] rounded-2xl px-4 py-3.5 text-left shadow-md shadow-indigo-900/10 active:scale-[0.99] transition-transform md:flex-1 !inline-flex !items-center !justify-between gap-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <MapPin className="h-5 w-5 shrink-0" aria-hidden />
                    </span>
                    <span className="min-w-0 text-[15px] font-semibold leading-tight">
                      {user?.role === "provider" || audience === "provider" ? "Przejdź do zleceń" : "Znajdź pomoc"}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 opacity-85" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const seedValue = query || "";
                    if (user?.role === "provider" || audience === "provider") {
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
                  className="btn-helpfli-secondary w-full min-h-[52px] rounded-2xl px-4 py-3.5 text-left active:scale-[0.99] transition-transform md:flex-1 !inline-flex !items-center !justify-between gap-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: 'oklch(0.92 0.05 240)' }}
                    >
                      <Sparkles className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
                    </span>
                    <span className="min-w-0 text-[15px] font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
                      {user?.role === "provider" || audience === "provider" ? "Zapytaj Asystenta AI" : "Opisz problem z AI"}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 opacity-45" style={{ color: 'var(--muted-foreground)' }} aria-hidden />
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

      <div className="flex flex-col">
      {/* Popularne usługi */}
      <section className="order-1 pt-6 md:pt-8 pb-2 md:pb-3 md:order-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="rounded-xl p-4 sm:p-6 md:p-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
            <PopularServices 
              onPick={(payload, isActive) => {
                // Klik aktywuje/dezaktywuje kafelek; przekierowuj tylko przy aktywacji.
                if (!isActive) return;

                // PopularServices przekazuje obiekt { slug, parentSlug, label }.
                // Dla zgodności z Home przekazujemy `service` = slug (jak SeasonalBanner).
                const rawSlug =
                  (payload && typeof payload === "object"
                    ? (payload.slug || payload.parentSlug || payload.label)
                    : payload) || "";
                const serviceSlug = String(rawSlug).trim();
                if (!serviceSlug) return;

                nav(`/home?service=${encodeURIComponent(serviceSlug)}`);
              }}
            />
          </div>
        </div>
      </section>

      {/* Dlaczego Helpfli — szczegóły platformy */}
      <section className="order-2 py-6 md:py-8 md:order-none" id="platforma-szczegoly">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div
            className="rounded-xl p-4 sm:p-6 md:p-8"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}
          >
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Obraz — tylko desktop (obok „Dlaczego…”); na mobile obraz jest przy krokach 1–3 */}
            <div className="hidden lg:block self-start w-full min-w-0">
              <LandingHappyUserFigure
                className="w-full"
                imageClassName="object-contain object-center"
              />
            </div>

            <div className="space-y-6 md:space-y-8 min-w-0">
              {/* Dlaczego Helpfli */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>Dlaczego Helpfli?</h2>
                <p className="text-sm md:text-base mb-4 md:mb-6" style={{ color: 'var(--muted-foreground)' }}>
                  Znajdź sprawdzoną pomoc w swojej okolicy w kilka minut. Bezpieczne rozliczenia i ochrona płatności.
                </p>
                <div className="flex sm:grid sm:grid-cols-2 gap-3 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 snap-x snap-mandatory scrollbar-hide touch-pan-x [-webkit-overflow-scrolling:touch]">
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Szybkość</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>Znajdziesz pomoc w kilka minut</p>
                  </div>
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Gwarancja Helpfli</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>Ochrona płatności i bezpieczne rozliczenia</p>
                  </div>
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Asystent AI</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>Inteligentny asystent pomoże</p>
                  </div>
                  <div className="shrink-0 w-[min(220px,78vw)] sm:w-auto snap-start p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: 'oklch(0.65 0.08 264)' }}>
                      <Star className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'white' }} fill="white" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 leading-tight" style={{ color: 'var(--foreground)' }}>Zweryfikowani wykonawcy</h3>
                    <p className="text-[11px] sm:text-xs md:text-sm leading-snug line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>KYC i opinie klientów</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => nav("/login?next=" + encodeURIComponent("/create-order"))}
                  className="btn-helpfli-primary mt-4 w-full px-6 py-3 sm:w-auto"
                >
                  Zacznij teraz
                </button>
              </div>

              <div className="mt-6 lg:hidden">
                <LandingHappyUserFigure
                  className="w-full max-w-md mx-auto"
                  imageClassName="object-contain object-center"
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Promo Carousel */}
      <div className="order-3 md:order-none">
        <Suspense fallback={<div className="w-full h-40 rounded-3xl bg-slate-100 animate-pulse" />}>
          <HelpfliPromoCarousel />
        </Suspense>
      </div>

      {/* Banner reklamowy */}
      <section className="order-4 py-6 md:py-8 md:order-none">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <Suspense fallback={null}>
            <SponsorAdBanner
              position="banner"
              page="landing_page_banner"
              limit={3}
            />
          </Suspense>
        </div>
      </section>

      {/* Baner sezonowy — ciaśniejszy wrapper na mobile (aplikacyjny panel) */}
      <section className="order-5 pt-1 pb-4 md:pt-3 md:pb-8 md:order-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div
            className="rounded-2xl border p-3 sm:p-4 md:p-8 md:rounded-xl"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}
          >
            <SeasonalBanner />
          </div>
        </div>
      </section>

      {/* Program Founding Provider + CTA wykonawcy */}
      <section className="order-6 py-4 md:py-8 md:order-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 space-y-4">
          <Suspense fallback={null}>
            <FoundingProviderBanner variant="marketing" />
          </Suspense>
        </div>
      </section>

      {/* Featured Announcements */}
      <div className="order-7 md:order-none">
        <Suspense fallback={null}>
          <FeaturedAnnouncements />
        </Suspense>
      </div>

      {/* Mini FAQ */}
      <section className="order-8 py-6 md:py-8 md:order-none">
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
              <details className="rounded-lg p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <summary className="cursor-pointer font-medium" style={{ color: 'var(--foreground)' }}>Co to jest program „Pierwszy wykonawca”?</summary>
                <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Dla pierwszych 1000 wykonawców: 0% prowizji platformy przez 60 dni, badge na profilu, wyższa widoczność w wyszukiwaniu i 10 darmowych wyróżnień ofert. Program działa obok subskrypcji PRO — abonament PRO to osobna opłata za limity pakietu.
                </p>
              </details>
              <details className="rounded-lg p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <summary className="cursor-pointer font-medium" style={{ color: 'var(--foreground)' }}>Czy jako klient dostanę bonus za pierwsze zlecenie?</summary>
                <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Tak — po potwierdzeniu odbioru pierwszego opłaconego zlecenia w Helpfli otrzymasz 20 zł w portfelu punktów (200 pkt, 1 pkt = 0,10 zł). Możesz też polecać znajomych i zbierać nagrody w programie poleceń.
                </p>
              </details>
              <details className="rounded-lg p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <summary className="cursor-pointer font-medium" style={{ color: 'var(--foreground)' }}>Jak działają polecenia?</summary>
                <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Udostępniasz swój link lub kod z konta (zakładka Polecenia). Po rejestracji zaproszonej osoby obie strony dostają punkty, a po spełnieniu warunku (pierwsze zlecenie klienta lub ukończenie profilu wykonawcy) — dodatkowe nagrody w portfelu lub przedłużenie PRO.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Powiadomienia są obsługiwane przez globalny PermissionQueueManager
          (SoftAskNotifications) — pojawiają się dopiero gdy user zaakceptował
          cookies i kontekst tego wymaga (np. po stworzeniu zlecenia). */}

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

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

      {/* Pop-up "Pierwszy Wykonawca" – goście, przy każdej wizycie */}
      <Suspense fallback={null}>
        <FoundingProviderPopup />
      </Suspense>
    </div>
  );
}
