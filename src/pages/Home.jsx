import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTelemetry } from "../hooks/useTelemetry";
import { UI } from "../i18n/pl_ui";
import ServiceCategoryDropdown from "../components/ServiceCategoryDropdown";
import { CATEGORY_ICONS } from "../components/icons/QuicksyCategoryIcons";
import QuickFilters from "../components/QuickFilters";
import ProviderCard from "../components/ProviderCard";
import MapViewEnhanced from "../components/MapViewEnhanced";
import TopProviders from "../components/TopProviders";
import Testimonials from "../components/Testimonials";
import MiniFAQ from "../components/MiniFAQ";
import CompareBar from "../components/CompareBar";
import CompareModal from "../components/CompareModal";
import QuickActionBar from "../components/QuickActionBar";
import ResultsToolbar from "../components/ResultsToolbar";
import FilterChips from "../components/FilterChips";
import AdvancedFilters from "../components/AdvancedFilters";
import Footer from "../components/Footer";
import PopularServices from "../components/PopularServices";
import UnifiedAIConcierge from "../components/ai/UnifiedAIConcierge";
import ProviderPreview from "../components/ProviderPreview";
import { useAuth } from "../context/AuthContext";
import useCompare from "../hooks/useCompare";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Star, Building2, Sparkles, List, Map, LayoutGrid, Wallet, MapPin, Zap, Layers, Users } from "lucide-react";

const MOBILE_VIEW_STORAGE_KEY = "quicksy_home_mobile_view_mode";

function normalizeMobileViewMode(value) {
  return value === "list" || value === "map" ? value : null;
}

// Dane z backendu /api/search – fetchowane w useEffect poniżej
// Tylko import.meta.env.DEV: przykładowi wykonawcy, gdy API zwróci pustą listę (bez ścisłych filtrów)
const DEMO_PROVIDERS = [
  {
    id: "demo-1",
    name: "Wykonawca A",
    rating: 4.8,
    distanceKm: 2.1,
    priceFrom: 120,
    priceTo: 180,
    level: "pro",
    verified: true,
    lat: 52.2297,
    lng: 21.0122,
    avatarUrl: "",
    service: "Hydraulik",
    provider_status: { isOnline: true },
    promo: {},
    bio: "Hydraulik 10+ lat doświadczenia. Szybkie naprawy.",
    online: true,
    b2b: true,
  },
  {
    id: "demo-2",
    name: "Anna Nowak",
    rating: 4.6,
    distanceKm: 5.3,
    priceFrom: 90,
    priceTo: 140,
    level: "standard",
    verified: false,
    lat: 52.235,
    lng: 21.02,
    avatarUrl: "",
    service: "Elektryk",
    provider_status: { isOnline: false },
    promo: {},
    bio: "Elektryk. Montaże i naprawy.",
    online: false,
    b2b: false,
  },
  {
    id: "demo-3",
    name: "Piotr Wiśniewski",
    rating: 4.5,
    distanceKm: 7.8,
    priceFrom: 80,
    priceTo: 120,
    level: "basic",
    verified: true,
    lat: 52.24,
    lng: 21.0,
    avatarUrl: "",
    service: "Złota rączka",
    provider_status: { status: "offline" },
    promo: {},
    bio: "Drobne naprawy domowe.",
    online: true,
    b2b: true,
  },
];

/** Wybrane kafelki „Popularne usługi” przekazują pełny tekst etykiety; backend zwraca inne nazwy (np. „Hydraulika”). */
function matchesSelectedServiceLabel(selected, haystack) {
  const sel = String(selected).toLowerCase().trim();
  if (!sel) return true;
  const flat = haystack.map(String).map((s) => s.toLowerCase());
  if (flat.some((h) => h === sel || h.includes(sel) || sel.includes(h))) return true;
  const head = sel.split(/[–—\-]/)[0].trim().toLowerCase();
  if (head.length >= 2 && flat.some((h) => h.includes(head))) return true;
  const tokens = head.split(/\s+/).filter((t) => t.length >= 4);
  return tokens.some((t) => flat.some((h) => h.includes(t)));
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const { trackSearch, trackFilterApplied, trackCategorySelected, trackProviderView } = useTelemetry();
  const [quick, setQuick] = useState(null);
  const [providers, setProviders] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [providerPreview, setProviderPreview] = useState({ open: false, providerId: null });
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [b2bOnly, setB2bOnly] = useState(false);
  const [proOnly, setProOnly] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [aiConciergeOpen, setAiConciergeOpen] = useState(false);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('split');
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedServiceSlugs, setSelectedServiceSlugs] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [clearCategoryTrigger, setClearCategoryTrigger] = useState(0);

  // Aktualizuj activeFilters gdy zmieniają się filtry
  useEffect(() => {
    const newActiveFilters = [];
    
    if (verifiedOnly) newActiveFilters.push('Zweryfikowani');
    if (b2bOnly) newActiveFilters.push('Firma');
    if (proOnly) newActiveFilters.push('PRO');
    if (availableNow) newActiveFilters.push('Dostępny teraz');
    if (filters.search) newActiveFilters.push(`"${filters.search}"`);
    if (filters.level && filters.level !== 'any') newActiveFilters.push(filters.level);
    if (filters.minRating) newActiveFilters.push(`Ocena ≥ ${filters.minRating}`);
    if (filters.available && filters.available !== 'any') newActiveFilters.push(filters.available);
    if (filters.budgetMin || filters.budgetMax) {
      const min = filters.budgetMin || 0;
      const max = filters.budgetMax || '∞';
      newActiveFilters.push(`Budżet: ${min}-${max} zł`);
    }
    
    // Dodaj wybrane usługi
    selectedServices.forEach(service => {
      if (!newActiveFilters.includes(service)) {
        newActiveFilters.push(service);
      }
    });
    
    setActiveFilters(newActiveFilters);
  }, [verifiedOnly, b2bOnly, proOnly, availableNow, filters, selectedServices]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [maxDistance, setMaxDistance] = useState(300); // km — bezpieczny domyślny zasięg
  const { user } = useAuth();
  const compare = useCompare();

  // Funkcja do pobierania geolokalizacji użytkownika
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolokalizacja nie jest obsługiwana przez przeglądarkę');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setLocationError(null);
      },
      (error) => {
        setLocationError('Nie udało się pobrać lokalizacji');
        // Fallback do Warszawy dla testów
        setUserLocation({ lat: 52.2297, lng: 21.0122 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minut
      }
    );
  }, []);

  // Pobierz geolokalizację przy załadowaniu komponentu
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Funkcja do kalkulacji odległości między dwoma punktami (Haversine formula)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Promień Ziemi w km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Obsługa parametru search oraz service z URL
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const serviceSlug = searchParams.get('service');
    const availableNowParam = searchParams.get('availableNow');
    if (searchQuery) {
      // Ustaw filtr wyszukiwania
      setFilters(prev => ({ ...prev, search: searchQuery }));
    }
    if (serviceSlug) {
      setSelectedServiceSlugs(prev => Array.from(new Set([...(prev || []), serviceSlug])));
      setSelectedServices(prev => Array.from(new Set([...(prev||[]), serviceSlug])));
    }
    if (availableNowParam === 'true') {
      setAvailableNow(true);
    }
  }, [searchParams]);

  // Funkcja do aktualizacji filtrów i URL
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Aktualizuj URL
    const newSearchParams = new URLSearchParams(searchParams);
    if (newFilters.search) {
      newSearchParams.set('search', newFilters.search);
    } else {
      newSearchParams.delete('search');
    }
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // Funkcja do czyszczenia filtra wyszukiwania
  const clearSearchFilter = () => {
    const newFilters = { ...filters };
    delete newFilters.search;
    updateFilters(newFilters);
  };

  // Przekierowanie usługodawcy na jego Home
  useEffect(() => {
    if (!user) return;
    
    // Sprawdź czy użytkownik jest company i przekieruj do panelu firmy
    const isCompanyUser = user.role === "company_owner" || 
                         user.role === "company_manager" ||
                         (user.company && (user.roleInCompany === "owner" || user.roleInCompany === "manager"));
    
    if (isCompanyUser) {
        navigate("/account/company", { replace: true });
      return;
    }
    
    // Sprawdź czy użytkownik jest provider i przekieruj do panelu providera
    if (user.role === "provider") {
      navigate("/provider-home", { replace: true });
    }
  }, [user, navigate]);

  // NEW: rozmiar mapy: 'sm' | 'lg' | 'full'
  const [mapSize, setMapSize] = useState("lg"); // domyślnie większa
  const [isProviderListExpanded, setIsProviderListExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileViewMenuOpen, setIsMobileViewMenuOpen] = useState(false);
  const mobileViewMenuRef = useRef(null);

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) return;
    try {
      const savedView = normalizeMobileViewMode(localStorage.getItem(MOBILE_VIEW_STORAGE_KEY));
      if (savedView && viewMode !== savedView) {
        setViewMode(savedView);
      }
    } catch (_) {}
  }, [isMobileViewport]);

  useEffect(() => {
    if (isMobileViewport && viewMode === "split") {
      setViewMode("map");
    }
  }, [isMobileViewport, viewMode]);

  useEffect(() => {
    if (!isMobileViewport) return;
    const current = normalizeMobileViewMode(viewMode);
    if (!current) return;

    try {
      localStorage.setItem(MOBILE_VIEW_STORAGE_KEY, current);
    } catch (_) {}
  }, [isMobileViewport, viewMode]);

  // Obsługa viewMode - synchronizuj z mapSize
  useEffect(() => {
    if (viewMode === 'list') {
      setMapSize('sm'); // tylko lista, bez mapy
    } else if (viewMode === 'map') {
      setMapSize('full'); // pełna mapa
      setIsProviderListExpanded(false); // Zwiń listę przy zmianie na mapę
    } else if (viewMode === 'split') {
      setMapSize('lg'); // podział 50/50
    }
    // Resetuj stan "pokaż więcej" przy zmianie trybu
    setShowAllProviders(false);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "map" || showAdvancedFilters) {
      setIsMobileViewMenuOpen(false);
      setIsProviderListExpanded(false);
    }
  }, [viewMode, showAdvancedFilters]);

  useEffect(() => {
    if (!isMobileViewMenuOpen) return;
    const onPointerDown = (e) => {
      if (!mobileViewMenuRef.current) return;
      if (!mobileViewMenuRef.current.contains(e.target)) {
        setIsMobileViewMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isMobileViewMenuOpen]);

  // PRZYKŁADOWA filtracja po stronie frontu (docelowo backend /api/search)
  const list = useMemo(() => {
    const effectiveMaxDistance = isMobileViewport
      ? Math.max(Number(maxDistance) || 0, 600)
      : Number(maxDistance) || 0;
    const filtered = providers.filter((p) => {
      // Filtrowanie po wyszukiwanym tekście
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(searchLower);
        const matchesService = p.service?.toLowerCase().includes(searchLower);
        const matchesBio = p.bio?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesService && !matchesBio) return false;
      }
      
      if (filters.level && filters.level !== "any" && p.level !== filters.level) return false;
      if (filters.minRating && (p.rating ?? 0) < filters.minRating) return false;
      if (filters.available && filters.available !== "any" && p.available !== filters.available) return false;
      if (filters.budgetMin || filters.budgetMax) {
        const [min, max] = (p.priceRange || "0–0").split("–").map(Number);
        const lo = Number(filters.budgetMin || 0);
        const hi = Number(filters.budgetMax || 99999);
        if (max < lo || min > hi) return false;
      }
      
      // Filtrowanie po odległości
      if (userLocation && p.lat && p.lng) {
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          p.lat, 
          p.lng
        );
        p.distanceKm = Math.round(distance * 10) / 10; // Zaokrąglij do 1 miejsca po przecinku
        if (effectiveMaxDistance && distance > effectiveMaxDistance) return false;
      }
      
      // Filtry z ResultsToolbar
      if (verifiedOnly && !p.verified) return false;
      if (b2bOnly && !p.b2b) return false;
      // PRO: sprawdź providerTier (nowy system) lub level (stary system) dla kompatybilności
      if (proOnly && !(p.providerTier === 'pro' || p.level === 'pro')) return false;
      // Teraz: użyj availableNow jeśli dostępne, w przeciwnym razie isOnline
      if (availableNow && !(p.provider_status?.availableNow === true || p.provider_status?.isOnline === true)) return false;
      
      // quick filter – tu możesz mapować quick->service id i zapytać backend
      return true;
    });

    // Sortowanie
    if (sortBy && sortBy !== 'default') {
      const getPrice = (p) => {
        const from = p.priceFrom ?? p.price?.from ?? p.price ?? 0;
        const to = p.priceTo ?? p.price?.to ?? p.price ?? 0;
        return typeof from === 'number' && typeof to === 'number' ? (from + to) / 2 : (Number(from) || Number(to) || 0);
      };
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'rating_desc':
            return (b.rating ?? b.averageRating ?? 0) - (a.rating ?? a.averageRating ?? 0);
          case 'rating_asc':
            return (a.rating ?? a.averageRating ?? 0) - (b.rating ?? b.averageRating ?? 0);
          case 'distance_far':
            return (b.distanceKm ?? 0) - (a.distanceKm ?? 0);
          case 'distance_near':
            return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
          case 'price_desc':
            return getPrice(b) - getPrice(a);
          case 'price_asc':
            return getPrice(a) - getPrice(b);
          default:
            return 0;
        }
      });
      return sorted;
    }
    return filtered;
  }, [providers, filters, quick, userLocation, maxDistance, isMobileViewport, calculateDistance, verifiedOnly, b2bOnly, proOnly, availableNow, selectedServices, selectedServiceSlugs, sortBy]);

  // Podłączone do /api/search z filtrami
  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams();
    // Usunięto hardkodowaną lokalizację - pozwalamy na wyszukiwanie we wszystkich miastach
    if (filters.search) qs.set("q", String(filters.search));
    if (filters.level && filters.level !== "any") qs.set("level", String(filters.level));
    if (filters.minRating) qs.set("minRating", String(filters.minRating));
    if (filters.available && filters.available !== "any") qs.set("available", String(filters.available));
    if (filters.budgetMin) qs.set("budgetMin", String(filters.budgetMin));
    if (filters.budgetMax) qs.set("budgetMax", String(filters.budgetMax));
    if (filters.paymentType && filters.paymentType !== 'any') qs.set("paymentType", String(filters.paymentType));
    if (quick) qs.set("quick", String(quick));
    if (verifiedOnly) qs.set("verifiedOnly", String(verifiedOnly));
    if (availableNow) qs.set("availableNow", "true");
    if (selectedServiceSlugs.length > 0) qs.set("service", selectedServiceSlugs.join(","));

    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/search?${qs.toString()}`), {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Błąd pobierania wykonawców");
        // Backend zwraca dane bezpośrednio w tablicy, nie w data.providers
        const items = Array.isArray(data) ? data : (data?.providers || data?.results || []);
        
        // Track search event
        trackSearch(filters.search || '', {
          level: filters.level,
          minRating: filters.minRating,
          available: filters.available,
          budgetMin: filters.budgetMin,
          budgetMax: filters.budgetMax,
          quick,
          verifiedOnly,
          b2bOnly,
          proOnly
        }, items.length);
        
        const mapped = items.map((p) => ({
          id: p._id || p.id,
          _id: p._id || p.id, // Dodaj _id dla kompatybilności z chatFlow
          name: p.name || p.displayName || "Wykonawca",
          rating: p.rating ?? p.averageRating ?? 0,
          distanceKm: p.distanceKm ?? p.distance ?? null,
          priceFrom: p.priceFrom ?? p.price?.from ?? p.price ?? null,
          priceTo: p.priceTo ?? p.price?.to ?? null,
          level: p.level || p.tier || null,
          verified: !!p.verified || !!p.verification?.verified,
          verification: p.verification || null, // Dodaj pełny obiekt verification
          badges: p.badges || [], // Dodaj badges
          lat: p.location?.lat ?? p.lat,
          lng: p.location?.lng ?? p.lng,
          avatarUrl: p.avatarUrl || p.avatar || null,
          service: p.matchedServiceName || p.serviceName || p.service || null,
          services: p.services || [], // Tablica ID usług (ObjectId) - potrzebne dla chatFlow
          allServices: p.allServices || [], // wszystkie usługi providera (nazwy)
          serviceIds: p.serviceIds || p.services || [],
          provider_status: p.provider_status || null,
          promo: p.promo || {},
          headline: p.headline || "",
          bio: p.bio || p.description || "",
          online: p.online ?? false,
          b2b: p.b2b ?? false,
        }));
        const strictFiltersActive =
          selectedServiceSlugs.length > 0 ||
          !!(filters?.search && String(filters.search).trim()) ||
          verifiedOnly ||
          availableNow ||
          b2bOnly ||
          proOnly;
        const allowDemoFallback =
          import.meta.env.DEV && !strictFiltersActive;
        if (!mapped.length) {
          setProviders(allowDemoFallback ? DEMO_PROVIDERS : []);
        } else {
          setProviders(mapped);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          const strict =
            selectedServiceSlugs.length > 0 ||
            !!(filters?.search && String(filters.search).trim()) ||
            verifiedOnly ||
            availableNow ||
            b2bOnly ||
            proOnly;
          setProviders(import.meta.env.DEV && !strict ? DEMO_PROVIDERS : []);
        }
      }
    })();

    return () => controller.abort();
  }, [filters, quick, verifiedOnly, availableNow, b2bOnly, proOnly, selectedServiceSlugs]);

  const handleSelect = (provider) => {
    navigate(`/provider/${provider.id || provider._id}`);
  };

  const handleQuote = async (provider) => {
    if (!user) {
      return navigate("/login?next=" + encodeURIComponent(window.location.pathname));
    }

    // Przejście do profilu providera z otwartym modalem "Zapytaj o wycenę"
    navigate(`/provider/${provider.id || provider._id}`, {
      state: {
        provider,
        openQuote: true,
      },
    });
  };

  const handleQuickView = (provider) => {
    setProviderPreview({ 
      open: true, 
      providerId: provider.id || provider._id 
    });
  };


  const center = [52.2297, 21.0122];

  // map layout helpers
  const mapHeightClass = viewMode === "list" ? "h-[320px]" : viewMode === "split" ? "h-[520px]" : "h-screen";
  const gridClass =
    viewMode === "map"
      ? "grid-cols-1"
      : viewMode === "list"
      ? "grid-cols-1" // tylko lista, bez mapy
      : "lg:grid-cols-[1.1fr_520px]"; // podział 50/50
  const isCompactMobileSplit = isMobileViewport && viewMode === "split";
  const providersInList =
    viewMode === "list"
      ? (showAllProviders ? list : list.slice(0, 20))
      : isCompactMobileSplit
      ? list.slice(0, 3)
      : list;

  // Handler dla Asystenta AI - przejście do tworzenia zlecenia
  const handleAIConciergeOrder = useCallback((orderData) => {
    if (!orderData) {
      console.error('handleAIConciergeOrder: brak danych zlecenia');
      return;
    }

    // Przekieruj do tworzenia zlecenia z danymi z AI Concierge
    navigate('/create-order', { 
      state: { 
        fromAI: true,
        prefill: {
        description: orderData.description,
        service: orderData.service,
          urgency: orderData.urgency || 'flexible',
          diySteps: orderData.diySteps,
          parts: orderData.parts,
        }
      } 
    });
    setAiConciergeOpen(false);
  }, [navigate]);

  return (
    <div className={`min-h-screen ${viewMode === "map" ? "overflow-hidden" : "bg-slate-50"}`}>
      <Helmet>
        <title>Szukaj wykonawców | Quicksy</title>
        <meta name="description" content="Znajdź sprawdzonych wykonawców w swojej okolicy. Hydraulik, elektryk, sprzątanie i inne usługi — porównaj oferty i wybierz najlepszą." />
      </Helmet>
      {/* Pasek: dropdown kategorii (dwukolumnowy) + toolbar wyników */}
      {viewMode === "map" ? (
        // Tryb mapy - fixed toolbar na górze
        <div className="fixed left-0 right-0 top-16 z-50 max-w-[100vw] border-b border-gray-200/20 shadow-sm">
          <div className="mx-auto min-w-0 max-w-6xl px-3 py-2.5 sm:px-4 sm:py-3">
            <ResultsToolbar
              searchQuery={filters.search}
              resultsCount={list.length}
              location="Warszawa"
              sortBy={sortBy}
              onSortChange={setSortBy}
              verifiedOnly={verifiedOnly}
              onVerifiedOnlyChange={setVerifiedOnly}
              b2bOnly={b2bOnly}
              onB2bOnlyChange={setB2bOnly}
              proOnly={proOnly}
              availableNow={availableNow}
              onAvailableNowChange={setAvailableNow}
              onProOnlyChange={setProOnly}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              categorySelector={
                <ServiceCategoryDropdown
                  className="w-64"
                  placeholder="Kategoria"
                  clearTrigger={clearCategoryTrigger}
                  onCategorySelect={(sel) => {
                    setSelectedServices((prev) => Array.from(new Set([...(prev || []), sel.subcategory])));
                    const slug = sel.subcategorySlug || sel.categorySlug;
                    if (slug) {
                      setSelectedServiceSlugs((prev) =>
                        Array.from(new Set([...(prev || []), String(slug)]))
                      );
                    }
                  }}
                />
              }
              showLeftInfo={false}
              hasActiveFilters={activeFilters.length > 0}
              onClearFilters={() => {
                setVerifiedOnly(false);
                setB2bOnly(false);
                setProOnly(false);
                setAvailableNow(false);
                setSelectedServices([]);
                setSelectedServiceSlugs([]);
                updateFilters({});
                setActiveFilters([]);
                setClearCategoryTrigger((prev) => prev + 1);
              }}
              rightExtra={
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(true)}
                  className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 sm:px-3 sm:py-2 sm:text-sm"
                >
                  <span className="sm:hidden">Filtry</span>
                  <span className="hidden sm:inline">Wszystkie filtry</span>
                </button>
              }
              hideViewSwitcher
            />
          </div>
        </div>
      ) : (
        // Tryb listy/split - normalny layout
        <>
          {/* Toolbar - poza flex container, aby sticky działało poprawnie */}
          <ResultsToolbar
            searchQuery={filters.search}
            resultsCount={list.length}
            location="Warszawa"
            sortBy={sortBy}
            onSortChange={setSortBy}
            verifiedOnly={verifiedOnly}
            onVerifiedOnlyChange={setVerifiedOnly}
            b2bOnly={b2bOnly}
            onB2bOnlyChange={setB2bOnly}
            proOnly={proOnly}
            availableNow={availableNow}
            onAvailableNowChange={setAvailableNow}
            onProOnlyChange={setProOnly}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hideViewSwitcher
            categorySelector={
              <ServiceCategoryDropdown
                className="w-64"
                placeholder="Kategoria"
                clearTrigger={clearCategoryTrigger}
                onCategorySelect={(sel) => {
                  setSelectedServices((prev) => Array.from(new Set([...(prev || []), sel.subcategory])));
                  const slug = sel.subcategorySlug || sel.categorySlug;
                  if (slug) {
                    setSelectedServiceSlugs((prev) =>
                      Array.from(new Set([...(prev || []), String(slug)]))
                    );
                  }
                }}
              />
            }
            showLeftInfo={false}
            hasActiveFilters={activeFilters.length > 0}
            onClearFilters={() => {
              setVerifiedOnly(false);
              setB2bOnly(false);
              setProOnly(false);
              setAvailableNow(false);
              setSelectedServices([]);
              setSelectedServiceSlugs([]);
              updateFilters({});
              setActiveFilters([]);
              setClearCategoryTrigger((prev) => prev + 1);
            }}
            rightExtra={
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(true)}
                className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 sm:px-3 sm:py-2 sm:text-sm"
              >
                <span className="sm:hidden">Filtry</span>
                <span className="hidden sm:inline">Wszystkie filtry</span>
              </button>
            }
          />
          <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="flex flex-col gap-4 items-stretch">

          {/* Top usługi (jak na landing page) - ukryj w trybie mapy */}
          {viewMode !== "map" && (
          <div className="mt-3">
            <PopularServices
              onPick={(payload, isSelected) => {
                if (!payload?.slug) return;
                const slug = String(payload.slug).trim();
                const label = payload.label || slug;
                setSelectedServiceSlugs((prev) => {
                  const cur = prev || [];
                  if (isSelected) return Array.from(new Set([...cur, slug]));
                  return cur.filter((s) => s !== slug);
                });
                setSelectedServices((prev) => {
                  const current = prev || [];
                  if (isSelected) {
                    return Array.from(new Set([...current, label]));
                  }
                  return current.filter((n) => n !== label);
                });
              }}
            />
          </div>
          )}
          </div>
        </div>
        </>
      )}

      {/* Advanced Filters Drawer */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={(next) => updateFilters(next)}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
        userLocation={userLocation}
        locationError={locationError}
        onRequestLocation={getUserLocation}
        onApply={() => {
          setShowAdvancedFilters(false);
        }}
        onClear={() => {
          setVerifiedOnly(false);
          setB2bOnly(false);
          setProOnly(false);
          setSelectedServices([]);
          setSelectedServiceSlugs([]);
          updateFilters({});
        }}
      />

      {/* Usunięto sekcję rekomendacji pod aktywnymi filtrami */}

      {/* Przycisk rozwiń/zwijaj listę wykonawców - zawsze widoczny w tym samym miejscu */}
      {viewMode === "map" && !showAdvancedFilters && (
        <button
          onClick={() => setIsProviderListExpanded(!isProviderListExpanded)}
          className={`fixed z-40 flex items-center justify-between border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 ${
            isMobileViewport
              ? `left-3 rounded-full ${isProviderListExpanded ? "px-3 py-2 gap-2" : "w-11 h-11 p-0 justify-center"} ${user ? "bottom-[calc(5.8rem+env(safe-area-inset-bottom,0px))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]"}`
              : "right-4 w-80 rounded-lg px-4 py-3"
          }`}
          style={!isMobileViewport ? { top: activeFilters.length > 0 ? "298px" : "300px" } : undefined}
        >
          {isMobileViewport ? (
            <>
              <div className="relative">
                <Users className="w-5 h-5 text-slate-700" />
                {!isProviderListExpanded && (
                  <span className="absolute -right-2 -top-2 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] leading-[18px] text-center">
                    {list.length}
                  </span>
                )}
              </div>
              {isProviderListExpanded && (
                <h3 className="font-medium text-slate-800 text-sm">Wykonawcy ({list.length})</h3>
              )}
            </>
          ) : (
            <h3 className="font-medium text-slate-800 text-sm">Dostępni wykonawcy ({list.length})</h3>
          )}
          <svg 
            className={`w-4 h-4 text-slate-600 transition-transform ${isProviderListExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Lista + Mapa */}
      {viewMode === "map" ? (
        // Tryb mapy - pełnoekranowy; przyciski widoku w prawym górnym rogu na mapie
        <div 
          className="fixed inset-0 z-0 isolate w-full relative" 
          style={{ 
            top: activeFilters.length > 0 ? '128px' : '112px',
            height: activeFilters.length > 0 ? 'calc(100vh - 128px)' : 'calc(100vh - 112px)'
          }}
        >
          <div className="absolute top-2 right-2 z-20 hidden sm:flex items-center gap-1 bg-white/40 backdrop-blur-sm rounded-lg shadow border border-slate-200/60 p-1.5">
            <button
              onClick={() => setViewMode("list")}
              className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === "list" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              title="Lista"
            ><List className="w-4 h-4" aria-hidden /></button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === "map" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              title="Mapa"
            ><Map className="w-4 h-4" aria-hidden /></button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === "split" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
              title="Podział"
            ><LayoutGrid className="w-4 h-4" aria-hidden /></button>
          </div>
          <div className="w-full h-full">
            <MapViewEnhanced
              providers={list.map(p => ({ 
                ...p, 
                lat: p.lat || p.location?.lat, 
                lng: p.lng || p.location?.lng 
              }))}
              center={center}
              height="h-full"
              onFullscreenToggle={setMapSize}
              onSelect={(p) => {
                trackProviderView(p.id);
                handleSelect(p);
              }}
              onQuickView={handleQuickView}
              onCompare={(p) => {
                compare.toggle(p);
              }}
            />
          </div>

        </div>
      ) : (
        <>
          {/* Przełącznik widoku – w widoku lista nad listą, w prawym rogu (jak u providera) */}
          {viewMode === "list" && !isMobileViewport && (
            <div className="max-w-6xl mx-auto px-4 pt-8 pb-2 flex justify-end">
              <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-lg w-fit">
                <span className="text-xs text-slate-500 mr-1">Widok:</span>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === "list" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Lista"
                >
                  <List className="w-4 h-4" aria-hidden />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === "map" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Mapa"
                >
                  <Map className="w-4 h-4" aria-hidden />
                </button>
                {!isMobileViewport && (
                  <button
                    onClick={() => setViewMode("split")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      viewMode === "split" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                    title="Podział"
                  >
                    <LayoutGrid className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className={`max-w-6xl mx-auto px-4 grid ${gridClass} gap-6 mt-4`}>
          {/* Lista */}
          {viewMode !== "map" && (
            <div className={`space-y-3 ${isCompactMobileSplit ? "order-2" : ""}`}>
              {isCompactMobileSplit && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Podgląd wykonawców. Pełną listę zobaczysz w widoku listy.
                </div>
              )}
              {providersInList.map((p) => (
                <ProviderCard
                  key={p.id}
                  data={p}
                  onSelect={() => {
                    trackProviderView(p.id);
                    handleSelect(p);
                  }}
                  onQuote={handleQuote}
                  onCompare={() => {
                    compare.toggle(p);
                  }}
                  isCompared={!!compare.items.find(c => c.id === p.id)}
                />
              ))}
              {!list.length && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                  Brak wyników dla wybranych filtrów.
                </div>
              )}
              {/* Przycisk "Pokaż więcej" w trybie lista */}
              {viewMode === "list" && list.length > 20 && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowAllProviders(!showAllProviders)}
                    className="btn-quicksy-primary px-6 py-3"
                  >
                    {showAllProviders ? "Pokaż mniej" : `Pokaż więcej (${list.length - 20} więcej)`}
                  </button>
                </div>
              )}
              {isCompactMobileSplit && list.length > 3 && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Pokaż pełną listę ({list.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mapa – w split z przyciskami widoku w prawym górnym rogu na mapie */}
          {viewMode !== "list" && (
            <div className={`relative z-0 isolate ${viewMode !== "map" ? "lg:sticky lg:top-[92px] h-max" : ""} ${isCompactMobileSplit ? "order-1" : ""}`}>
              {viewMode === "split" && !isMobileViewport && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-white/40 backdrop-blur-sm rounded-lg shadow border border-slate-200/60 p-1.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === "list" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    title="Lista"
                  ><List className="w-4 h-4" aria-hidden /></button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === "map" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    title="Mapa"
                  ><Map className="w-4 h-4" aria-hidden /></button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === "split" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    title="Podział"
                  ><LayoutGrid className="w-4 h-4" aria-hidden /></button>
                </div>
              )}
              <MapViewEnhanced
                providers={list.map(p => ({ 
                  ...p, 
                  lat: p.lat || p.location?.lat, 
                  lng: p.lng || p.location?.lng 
                }))}
                center={center}
                height={isCompactMobileSplit ? "h-[44vh]" : mapHeightClass}
                onFullscreenToggle={setMapSize}
                onSelect={(p) => {
                  trackProviderView(p.id);
                  handleSelect(p);
                }}
                onQuickView={handleQuickView}
                onCompare={(p) => {
                  compare.toggle(p);
                }}
              />
            </div>
          )}
          </div>
        </>
      )}

      {/* Panel boczny z listą w trybie pełnoekranowym (zwijany) */}
      {viewMode === "map" && !showAdvancedFilters && (
        <div
          className={`fixed z-40 overflow-hidden border border-slate-200 bg-white shadow-xl transition-all duration-300 ${
            isMobileViewport
              ? `left-0 right-0 bottom-0 rounded-t-2xl ${isProviderListExpanded ? "max-h-[50vh]" : "max-h-0 border-0"}`
              : `${isProviderListExpanded ? "bottom-4 w-80 rounded-2xl" : "hidden"} right-4`
          }`}
          style={
            !isMobileViewport && isProviderListExpanded
              ? { top: activeFilters.length > 0 ? "298px" : "280px" }
              : undefined
          }
        >
          {/* Lista providerów - widoczna tylko gdy rozwinięta */}
          {isProviderListExpanded && (
            <div
              className="overflow-y-auto p-4 space-y-3"
              style={
                isMobileViewport
                  ? { maxHeight: "58vh" }
                  : { height: activeFilters.length > 0 ? "calc(100vh - 268px)" : "calc(100vh - 240px)" }
              }
            >
            {isMobileViewport && (
              <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-3 border-b border-slate-200 bg-white px-4 py-3">
                <button
                  onClick={() => setIsProviderListExpanded(false)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Zwiń listę wykonawców
                </button>
              </div>
            )}
            {list.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
                {/* Kompaktowa karta z gradientowym headerem */}
                <div className={`p-2.5 flex items-center gap-2 ${
                  p.level === "pro" 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600' 
                    : (p.verified || p.verification?.verified || (Array.isArray(p.badges) && p.badges.includes("verified")))
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700'
                }`}>
                  <img
                    src={p.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=4F46E5`}
                    alt={p.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white truncate">{p.name}</div>
                    <div className="text-[10px] text-white/90 truncate">{p.service || 'Usługodawca'}</div>
                  </div>
                  {(p.verified || p.verification?.verified || (Array.isArray(p.badges) && p.badges.includes("verified"))) && (
                    <div className="bg-white rounded-full p-0.5 shadow-sm">
                      <span className="text-emerald-600 text-[10px] font-bold">✓</span>
                    </div>
                  )}
                  {(p.providerTier === 'pro' || p.level === 'pro' || p.badges?.pro) && (
                    <div className="bg-white rounded-full px-1 py-0.5 shadow-sm">
                      <span className="text-orange-600 text-[9px] font-bold">TOP</span>
                    </div>
                  )}
                </div>
                
                {/* Treść */}
                <div className="p-2.5 space-y-1.5">
                  {/* Ocena i odległość */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{(p.rating || p.averageRating || 0).toFixed(1)}</span>
                    </span>
                    {p.distanceKm !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        <span>{p.distanceKm.toFixed(1)} km</span>
                      </span>
                    )}
                    {(p.priceFrom || p.priceTo) && (
                      <span className="flex items-center gap-0.5">
                        <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        <span>{p.priceFrom || '?'}–{p.priceTo || '?'} zł</span>
                      </span>
                    )}
                  </div>
                  
                  {/* Status dostępności */}
                  <div
                    className={`text-[10px] flex items-center gap-1 ${
                      (p.provider_status?.availableNow === true || p.provider_status?.isOnline === true)
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }`}
                  >
                    <Zap className="w-3 h-3 shrink-0" aria-hidden />
                    <span>
                      {(p.provider_status?.availableNow === true || p.provider_status?.isOnline === true)
                        ? "Może pomóc teraz"
                        : "Offline"}
                    </span>
                  </div>
                  
                  {/* Przyciski */}
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => handleSelect(p)}
                      className="flex-1 px-2 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Wybierz
                    </button>
                    <button
                      onClick={() => handleQuote(p)}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Wycenę
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!list.length && (
              <div className="text-center text-slate-500 text-sm py-8">
                Brak wyników dla wybranych filtrów.
              </div>
            )}
            </div>
          )}
        </div>
      )}


      {/* Sekcje poniżej wyników: Top usługodawcy + MiniFAQ - ukryj w trybie mapy */}
      {viewMode !== "map" && (
        <>
          <div className="max-w-6xl mx-auto px-4 mt-12 space-y-12">
            <TopProviders
              service={filters.search}
              city={userLocation ? "Warszawa" : ""}
            />
            <MiniFAQ />
          </div>
          <Footer />
        </>
      )}

      {/* Sticky porównywarka */}
      <CompareBar 
        items={compare.items} 
        onClear={compare.clear}
        onCompare={() => setCompareModalOpen(true)}
        onRemove={(i)=> compare.toggle(i)}
      />

      {/* Compare Modal */}
      <CompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        items={compare.items}
      />

      {/* AI Concierge Modal - ujednolicony chat z AI */}
      <UnifiedAIConcierge
        mode="modal"
        open={aiConciergeOpen}
        onClose={() => setAiConciergeOpen(false)}
        seedQuery=""
        onCreateOrder={handleAIConciergeOrder}
      />


      {/* Provider Preview Modal */}
      <ProviderPreview
        providerId={providerPreview.providerId}
        open={providerPreview.open}
        onClose={() => setProviderPreview({ open: false, providerId: null })}
      />

      {/* Mobilny przełącznik widoku - styl app (Google Maps/Uber) */}
      {!showAdvancedFilters && isMobileViewport && (viewMode === "map" || viewMode === "list") && (
        <div
          ref={mobileViewMenuRef}
          className={`sm:hidden fixed z-[70] ${
            viewMode === "map"
              ? `${user ? "bottom-[calc(9.2rem+env(safe-area-inset-bottom,0px))]" : "bottom-[calc(4.4rem+env(safe-area-inset-bottom,0px))]"} left-3`
              : "right-3"
          }`}
          style={viewMode === "list" ? { top: activeFilters.length > 0 ? "208px" : "192px" } : undefined}
        >
          <button
            type="button"
            onClick={() => setIsMobileViewMenuOpen((v) => !v)}
            className={`w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center transition-transform duration-150 ${
              isMobileViewMenuOpen ? "scale-105" : "scale-100"
            }`}
            title="Zmień widok"
          >
            <Layers className="w-5 h-5 text-slate-700" />
          </button>
          {isMobileViewMenuOpen && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5 flex flex-col gap-1 origin-top-right transition-all duration-150 opacity-100 translate-y-0 scale-100">
              <button
                onClick={() => {
                  setViewMode("list");
                  setIsMobileViewMenuOpen(false);
                }}
                className="px-2 py-2 text-xs rounded-lg transition-colors text-left flex items-center gap-2 text-slate-700 hover:bg-slate-100"
                title="Lista"
              >
                <List className="w-4 h-4" aria-hidden /> Lista
              </button>
              <button
                onClick={() => {
                  setViewMode("map");
                  setIsMobileViewMenuOpen(false);
                }}
                className="px-2 py-2 text-xs rounded-lg transition-colors text-left flex items-center gap-2 text-slate-700 hover:bg-slate-100"
                title="Mapa"
              >
                <Map className="w-4 h-4" aria-hidden /> Mapa
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
