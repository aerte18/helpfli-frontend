import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { List, LayoutGrid, Map, MapPin, Wallet, ClipboardList, ShieldCheck, Paperclip, Bot, CreditCard, Clock, Layers } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  MapInitialRecenter,
  MapLocateControl,
  UserLocationLayer,
} from "../components/MapUserLocation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import { getProviderLabel, getProviderServiceLabel } from "../utils/getProviderLabel";
import Footer from "../components/Footer";
import ProviderAdvancedFilters from "../components/ProviderAdvancedFilters";
import { getMyOffers } from "../api/offers";
import { orderServiceMatchesProvider, expandProviderServiceSlugs } from "../utils/orderServiceMatch";
// ResultsToolbar usunięty - nie jest potrzebny dla providera (filtry Verified/Firma/TOP są dla klientów)

// Funkcja do formatowania czasu "dodane X min temu"
function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'przed chwilą';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minutę' : diffMins < 5 ? 'minuty' : 'minut'} temu`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'godzinę' : diffHours < 5 ? 'godziny' : 'godzin'} temu`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} temu`;
  return past.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

function getExpiryInfo(x) {
  // backend /api/orders/open zwraca: expiresAt, isExpired, timeUntilExpiry (min), hoursUntilExpiry, minutesUntilExpiry
  const minutes = typeof x?.timeUntilExpiry === "number" ? x.timeUntilExpiry : null;
  const hasAny = !!x?.expiresAt || minutes !== null;
  if (!hasAny) return null;

  const expired = !!x?.isExpired || minutes === 0;
  if (expired) {
    return { text: "Wygasło", cls: "bg-slate-100 text-slate-700 border-slate-200" };
  }

  const h = typeof x?.hoursUntilExpiry === "number" ? x.hoursUntilExpiry : (minutes !== null ? Math.floor(minutes / 60) : null);
  const m = typeof x?.minutesUntilExpiry === "number" ? x.minutesUntilExpiry : (minutes !== null ? minutes % 60 : null);
  const timeText =
    minutes !== null
      ? (h && h > 0 ? `${h}h ${m}m` : `${m} min`)
      : (() => {
          const d = new Date(x.expiresAt);
          return isNaN(d) ? "" : d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
        })();

  let cls = "bg-slate-50 text-slate-700 border-slate-200";
  if (minutes !== null && minutes <= 120) cls = "bg-red-50 text-red-700 border-red-200";
  else if (minutes !== null && minutes <= 360) cls = "bg-amber-50 text-amber-800 border-amber-200";

  return { text: `Wygasa za ${timeText}`, cls };
}

function asDisplayText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const joined = value
      .filter(Boolean)
      .map((v) => (typeof v === "string" ? v : (v && typeof v === "object" ? (v.name || v.label || v.text || "") : String(v))))
      .filter(Boolean)
      .join(", ");
    return joined || fallback;
  }
  if (value && typeof value === "object") {
    const candidate = value.name || value.name_pl || value.label || value.text || value.title || value.code || value.message;
    if (typeof candidate === "string") return candidate;
  }
  return fallback;
}

// Funkcja do tworzenia nowoczesnych pinezek dla zleceń
function orderIcon(order) {
  const urgency = order.urgency || 'flexible';
  const isPilne = urgency === 'now'; // Tylko "now" jest pilne - spójne z kartami
  
  // Pilne zlecenia (urgency === 'now') mają najwyższy priorytet wizualny - pomarańczowa pin z animacją
  if (isPilne) {
    const size = 56;
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px; height: ${size}px; 
          border-radius: 50% 50% 50% 0;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
          box-shadow: 
            0 8px 25px rgba(245, 158, 11, 0.6),
            0 4px 12px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -1px 0 rgba(0,0,0,0.1);
          display: flex; align-items: center; justify-center;
          position: relative;
          transform: rotate(-45deg);
          transition: all 0.3s ease;
          border: 3px solid rgba(255,255,255,0.9);
          animation: fastTrackPulse 2s infinite;
        ">
          <div style="
            width: ${size - 16}px; height: ${size - 16}px; 
            border-radius: 50%;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            display: flex; align-items: center; justify-center;
            font-weight: bold; color: #1e293b;
            font-size: 18px;
            transform: rotate(45deg);
            box-shadow: 
              inset 0 2px 4px rgba(0,0,0,0.1),
              0 1px 2px rgba(255,255,255,0.8);
            border: 1px solid rgba(255,255,255,0.6);
          ">
            ⚡
          </div>
        </div>
        <style>
          @keyframes fastTrackPulse {
            0%, 100% { transform: rotate(-45deg) scale(1); }
            50% { transform: rotate(-45deg) scale(1.1); }
          }
        </style>
      `,
      className: "order-pin-fast-track",
      iconSize: [size, size],
      iconAnchor: [size/2, size]
    });
  }
  
  // Dla pozostałych terminów - standardowa niebieska pinezka bez wyróżnienia
  const size = 48;
  const gradient = "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)"; // niebieski - standard
  const shadowColor = "rgba(59, 130, 246, 0.4)";
  
  // Ikony dla różnych terminów (bez wyróżnienia wizualnego)
  const icons = {
    'today': '📅',
    'tomorrow': '⏰',
    'this_week': '📆',
    'flexible': '📋'
  };
  const icon = icons[urgency] || '📋';

  const html = `
    <div style="
      width: ${size}px; height: ${size}px; 
      border-radius: 50% 50% 50% 0;
      background: ${gradient};
      box-shadow: 
        0 8px 25px ${shadowColor},
        0 4px 12px rgba(0,0,0,0.15),
        inset 0 1px 0 rgba(255,255,255,0.3),
        inset 0 -1px 0 rgba(0,0,0,0.1);
      display: flex; align-items: center; justify-content: center;
      position: relative;
      transform: rotate(-45deg);
      transition: all 0.3s ease;
      border: 2px solid rgba(255,255,255,0.8);
    ">
      <div style="
        width: ${size - 16}px; height: ${size - 16}px; 
        border-radius: 50%;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; color: #1e293b;
        font-size: 14px;
        transform: rotate(45deg);
        box-shadow: 
          inset 0 2px 4px rgba(0,0,0,0.1),
          0 1px 2px rgba(255,255,255,0.8);
        border: 1px solid rgba(255,255,255,0.6);
      ">
        ${icon}
      </div>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: "order-pin",
    iconSize: [size, size],
    iconAnchor: [size/2, size]
  });
}

// MOCK – wpięcie realnego backendu: GET /api/orders?status=open&near=...
const MOCK_DEMAND = [
  {
    id: "o-101",
    title: "Hydraulik – cieknący syfon",
    service: "Hydraulik",
    urgency: "now", // now | today | tomorrow | flexible
    budgetFrom: 80,
    budgetTo: 150,
    lat: 52.2325,
    lng: 21.0080,
    distanceKm: 1.1,
    createdAt: "2025-08-19T07:40:00Z",
    clientNote: "Woda kapie spod zlewu, potrzebna szybka pomoc.",
  },
  {
    id: "o-102",
    title: "Montaż lampy sufitowej",
    service: "Elektryk",
    urgency: "today",
    budgetFrom: 120,
    budgetTo: 220,
    lat: 52.2387,
    lng: 21.017,
    distanceKm: 2.0,
    createdAt: "2025-08-19T08:05:00Z",
    clientNote: "Lampa IKEA, przygotowane zasilanie.",
  },
  {
    id: "o-103",
    title: "Złota rączka – drzwi skrzypią",
    service: "Złota rączka",
    urgency: "flexible",
    budgetFrom: 50,
    budgetTo: 120,
    lat: 52.226,
    lng: 21.02,
    distanceKm: 3.4,
    createdAt: "2025-08-18T18:10:00Z",
    clientNote: "Drobne poprawki w mieszkaniu.",
  },
  {
    id: "o-104",
    title: "Naprawa pralki",
    service: "AGD",
    urgency: "today",
    budgetFrom: 100,
    budgetTo: 200,
    lat: 52.2317,
    lng: 21.0142,
    distanceKm: 1.5,
    createdAt: "2025-08-19T09:15:00Z",
    clientNote: "Pralka nie wirowuje. Podejrzewam problem z silnikiem lub łożyskami.",
  },
  {
    id: "o-105",
    title: "Sprzątanie mieszkania",
    service: "Sprzątanie",
    urgency: "tomorrow",
    budgetFrom: 80,
    budgetTo: 150,
    lat: 52.2277,
    lng: 21.0102,
    distanceKm: 2.8,
    createdAt: "2025-08-19T10:30:00Z",
    clientNote: "Potrzebuję generalnego sprzątania 3-pokojowego mieszkania po remoncie.",
  },
  {
    id: "o-106",
    title: "Montaż szafy",
    service: "Montaż mebli",
    urgency: "flexible",
    budgetFrom: 150,
    budgetTo: 300,
    lat: 52.2327,
    lng: 21.0152,
    distanceKm: 0.5,
    createdAt: "2025-08-19T11:45:00Z",
    clientNote: "Mam nową szafę do sypialni do zmontowania. Instrukcja jest po angielsku.",
  },
  {
    id: "o-107",
    title: "Malowanie pokoju",
    service: "Malowanie",
    urgency: "tomorrow",
    budgetFrom: 200,
    budgetTo: 400,
    lat: 52.2267,
    lng: 21.0092,
    distanceKm: 3.2,
    createdAt: "2025-08-19T12:00:00Z",
    clientNote: "Chcę przemalować pokój dziecka. Mam farby, potrzebuję tylko wykonania.",
  },
  {
    id: "o-108",
    title: "Remont łazienki",
    service: "Remont",
    urgency: "flexible",
    budgetFrom: 1000,
    budgetTo: 2500,
    lat: 52.2337,
    lng: 21.0162,
    distanceKm: 0.3,
    createdAt: "2025-08-19T13:20:00Z",
    clientNote: "Kompleksowy remont małej łazienki. Płytki, armaturka, oświetlenie.",
  },
  {
    id: "o-109",
    title: "Pielęgnacja ogrodu",
    service: "Ogród",
    urgency: "today",
    budgetFrom: 120,
    budgetTo: 250,
    lat: 52.2257,
    lng: 21.0082,
    distanceKm: 4.1,
    createdAt: "2025-08-19T14:10:00Z",
    clientNote: "Przycinanie żywopłotu, koszenie trawy, pielęgnacja krzewów.",
  },
  {
    id: "o-110",
    title: "Transport mebli",
    service: "Transport",
    urgency: "now",
    budgetFrom: 80,
    budgetTo: 150,
    lat: 52.2347,
    lng: 21.0172,
    distanceKm: 0.8,
    createdAt: "2025-08-19T15:30:00Z",
    clientNote: "Przewóz szafy z mieszkania na 3. piętrze do nowego lokalu.",
  },
];

const URGENCY_BADGE = {
  now: { label: "Teraz", dot: "bg-red-500", ring: "ring-red-200" },
  today: { label: "Dziś", dot: "bg-orange-500", ring: "ring-orange-200" },
  tomorrow: { label: "Jutro", dot: "bg-amber-500", ring: "ring-amber-200" },
  this_week: { label: "W tym tygodniu", dot: "bg-purple-500", ring: "ring-purple-200" },
  flexible: { label: "Elastycznie", dot: "bg-slate-400", ring: "ring-slate-200" },
};

const urgencyToRadius = (u) => (u === "now" ? 12 : u === "today" ? 10 : u === "tomorrow" ? 9 : u === "this_week" ? 8.5 : 8);

export default function ProviderHome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Sprawdź czy użytkownik jest company_owner/manager - pozwól na dostęp do provider-home
  // ale pokaż dodatkowe informacje o firmie
  // Nie przekierowuj automatycznie - pozwól użytkownikowi wybrać między panelem firmy a provider-home

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Ładowanie panelu usługodawcy...</p>
        </div>
      </div>
    );
  }

  // Sprawdź czy user istnieje
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Nie udało się załadować danych użytkownika</p>
          <button 
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Przejdź do logowania
          </button>
        </div>
      </div>
    );
  }

  // Status wykonawcy (lokalnie; podepnij PATCH /api/providers/me/status)
  const [status, setStatus] = useState("online"); // online | offline

  // Sprawdź czy użytkownik jest w firmie wieloosobowej (przenieś przed fetchOrders)
  const isInCompany = user?.company && (user?.roleInCompany === 'owner' || user?.roleInCompany === 'manager' || user?.roleInCompany === 'provider');
  const isCompanyOwner = user?.role === 'company_owner' || user?.roleInCompany === 'owner';
  const isCompanyManager = user?.role === 'company_manager' || user?.roleInCompany === 'manager';
  const canManageCompany = isCompanyOwner || isCompanyManager;

  // Filtry
  const [filters, setFilters] = useState({
    service: "any",
    maxDistance: 300,
    budgetMin: "",
    budgetMax: "",
    providerId: "any",
    paymentType: "any",
    offersStatus: "any",
    sortBy: "default", // default | created_desc | created_asc | urgency_desc | urgency_asc | budget_desc | budget_asc
  });

  // Panel „Wszystkie filtry” (drawer jak u klienta)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Onboarding – pokazany raz, można zamknąć
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try { return localStorage.getItem("providerHome_onboarding") === "dismissed"; } catch { return false; }
  });

  // Lista providerów z firmy (dla właściciela/manager)
  const [companyProviders, setCompanyProviders] = useState([]);

  // Stan dla pokazywania wszystkich usług
  // false = tylko zlecenia pasujące do usług z profilu; true = pełny rynek (jak checkbox „Pokaż wszystkie”)
  const [showAllServices, setShowAllServices] = useState(false);

  // Widok mapy: sm | lg | full - synchronizacja z App.jsx
  // System widoków: 'list' | 'map' | 'split'
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('providerHome_viewMode');
    return saved || 'split';
  });
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });
  const [isMobileViewMenuOpen, setIsMobileViewMenuOpen] = useState(false);
  const mobileViewMenuRef = useRef(null);

  const [mapSize, setMapSize] = useState(() => {
    return localStorage.getItem('mapSize') || 'lg';
  });

  // Panel z listą zleceń w trybie mapy (rozwijany)
  const [isOrderListExpanded, setIsOrderListExpanded] = useState(false);

  // Toolbar przezroczysty po przewinięciu (tylko w widoku lista/podział)
  const [toolbarScrolled, setToolbarScrolled] = useState(false);
  useEffect(() => {
    if (viewMode === "map") return;
    const handleScroll = () => {
      setToolbarScrolled(window.scrollY > 20);
    };
    handleScroll(); // stan początkowy
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  // Synchronizacja viewMode z mapSize
  useEffect(() => {
    if (isMobileViewport && viewMode === "split") {
      setViewMode("map");
      return;
    }
    if (viewMode === 'list') {
      setMapSize('sm'); // tylko lista, bez mapy
    } else if (viewMode === 'map') {
      setMapSize('lg'); // pełna mapa
      setIsOrderListExpanded(false); // Zwiń listę przy zmianie na mapę
    } else if (viewMode === 'split') {
      setMapSize('full'); // podział 50/50
    }
    localStorage.setItem('providerHome_viewMode', viewMode);
  }, [viewMode, isMobileViewport]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 1023px)");
    const onChange = (e) => setIsMobileViewport(!!e.matches);
    onChange(media);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!isMobileViewMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (!mobileViewMenuRef.current) return;
      if (!mobileViewMenuRef.current.contains(event.target)) {
        setIsMobileViewMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isMobileViewMenuOpen]);

  // Nasłuchuj zmian rozmiaru mapy z App.jsx
  useEffect(() => {
    const handleMapSizeChange = (e) => {
      if (e.detail?.size) {
        setMapSize(e.detail.size);
      }
    };
    window.addEventListener('mapSizeChanged', handleMapSizeChange);
    return () => window.removeEventListener('mapSizeChanged', handleMapSizeChange);
  }, []);

  // Geolokalizacja użytkownika
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Dane – pobierane z API
  const [demand, setDemand] = useState([]);
  const openFetchSeqRef = useRef(0);
  const openFetchAbortRef = useRef(null);
  const [demandLoading, setDemandLoading] = useState(true);
  const [freeRepliesLeft, setFreeRepliesLeft] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [stats, setStats] = useState({
    newOrders24h: 0,
    sentOffers7d: 0,
    acceptanceRate: 0
  });
  // Polecane zlecenia z uzasadnieniem AI
  const [recommendedOrders, setRecommendedOrders] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const recommendedOrdersSafe = useMemo(
    () => (Array.isArray(recommendedOrders) ? recommendedOrders : []),
    [recommendedOrders]
  );
  const recommendedIdSet = useMemo(() => {
    const ids = new Set();
    recommendedOrdersSafe.forEach((rec) => {
      const id = String(rec?.id || rec?._id || "").trim();
      if (!id) return;
      ids.add(id);
    });
    return ids;
  }, [recommendedOrdersSafe]);
  const providerServiceSlugs = useMemo(
    () => expandProviderServiceSlugs(user?.services || [], allServices),
    [user?.services, allServices]
  );

  // Ten sam zasięg co effectiveMaxDistance w fetchOrders — inaczej API zwraca wężej/szerzej niż filtr lokalny.
  // Tryb "Wszystkie zlecenia" ma pokazywać pełny rynek, więc nie filtrujemy po dystansie.
  const clientMaxDistance = useMemo(
    () =>
      showAllServices
        ? null
        : Number(filters.maxDistance) || 300,
    [showAllServices, filters.maxDistance]
  );

  // Pobierz wszystkie usługi dla getProviderLabel
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || '';
        const res = await fetch(apiUrl(`/api/services?limit=5000`));
        if (res.ok) {
          const data = await res.json();
          setAllServices(data.items || data || []);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

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

  // Usunięto problematyczny useEffect który powodował przekierowanie do /home

  // Pobieranie zleceń z API
  const fetchOrders = useCallback(async () => {
    let requestUrl = "";
    const requestSeq = ++openFetchSeqRef.current;
    try {
      if (openFetchAbortRef.current) openFetchAbortRef.current.abort();
    } catch (_) {}
    const controller = new AbortController();
    openFetchAbortRef.current = controller;
    try {
      setDemandLoading(true);
      const token = localStorage.getItem('token');
      
      // Buduj parametry zapytania
      const params = new URLSearchParams();
      // W trybie "wszystkie zlecenia" nie przepuszczaj ewentualnego starego filtra `service`.
      if (!showAllServices && filters.service && filters.service !== 'any') params.append('service', filters.service);
      // Tryb "Wszystkie zlecenia" = pełny rynek (bez filtra dystansu).
      const effectiveMaxDistance = showAllServices ? null : (Number(filters.maxDistance) || 300);
      if (effectiveMaxDistance) params.append('maxDistance', effectiveMaxDistance);
      if (!showAllServices && userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      if (filters.budgetMin) params.append('budgetMin', filters.budgetMin);
      if (filters.budgetMax) params.append('budgetMax', filters.budgetMax);
      if (filters.paymentType && filters.paymentType !== 'any') params.append('paymentType', filters.paymentType);
      if (filters.offersStatus && filters.offersStatus !== 'any') params.append('offersStatus', filters.offersStatus);
      
      // Dodaj usługi providera jeśli nie pokazujemy wszystkich
      // Dla firm wieloosobowych - pokaż zlecenia dla wszystkich wykonawców
      if (isInCompany && (isCompanyOwner || isCompanyManager)) {
        // Dla owner/manager - pokaż zlecenia dla całej firmy
        params.append('showCompany', 'true');
        // Jeśli wybrano konkretnego providera, dodaj filtr
        if (filters.providerId && filters.providerId !== 'any') {
          params.append('providerId', filters.providerId);
        }
        // Nie filtruj po usługach - pokaż wszystkie zlecenia dostępne dla firmy
      } else if (!showAllServices && user?.services && user.services.length > 0) {
        // Dla pojedynczego providera - zawsze wysyłaj slugi katalogowe (bez nazw display).
        const serviceSlugs = providerServiceSlugs;

        // Dodaj usługi jako osobne parametry (nie jako tablicę)
        serviceSlugs.forEach((service) => {
          if (service) params.append('services', String(service));
        });
        
      }

      // Zasięg dla "wszystkie usługi" / brak usług jest już ustawiony wyżej na 600 km (effectiveMaxDistance)

      requestUrl = apiUrl(`/api/orders/open?${params.toString()}`);
      const response = await fetch(requestUrl, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        // Ignoruj odpowiedzi starszych requestów (race condition przy suwaku / wielu zmianach filtrów).
        if (requestSeq !== openFetchSeqRef.current) return;
        setDemand(orders);
      } else {
        if (requestSeq !== openFetchSeqRef.current) return;
        setDemand([]);
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (requestSeq !== openFetchSeqRef.current) return;
      setDemand([]);
    } finally {
      if (requestSeq === openFetchSeqRef.current) setDemandLoading(false);
    }
  }, [filters, userLocation, showAllServices, user?.services, user?.company, user?.roleInCompany, user?.role, isInCompany, isCompanyOwner, isCompanyManager, providerServiceSlugs, allServices?.length]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  useEffect(() => {
    return () => {
      try {
        if (openFetchAbortRef.current) openFetchAbortRef.current.abort();
      } catch (_) {}
    };
  }, []);

  // Pobierz licznik darmowych wycen
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/provider-stats/free-replies-left'), { headers: { Authorization: `Bearer ${token}` }});
        const data = await res.json();
        if (res.ok) setFreeRepliesLeft(data.freeRepliesLeft);
      } catch {}
    })();
  }, []);

  // Polecane zlecenia (AI) – tylko dla providera
  useEffect(() => {
    if (!user || (user.role !== 'provider' && user.role !== 'company_owner')) return;
    const API = import.meta.env.VITE_API_URL || '';
    setRecommendedLoading(true);
    fetch(apiUrl(`/api/orders/recommended-for-provider`), {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.ok ? res.json() : { orders: [] })
      .then((data) => {
        const orders = Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data)
            ? data
            : [];
        setRecommendedOrders(orders);
      })
      .catch(() => setRecommendedOrders([]))
      .finally(() => setRecommendedLoading(false));
  }, [user]);

  // Pobierz oferty providera
  useEffect(() => {
    const fetchOffers = async () => {
      if (!user || user.role !== 'provider') return;
      try {
        const token = localStorage.getItem('token');
        const data = await getMyOffers({ token });
        setOffers(data || []);
        
        // Oblicz statystyki
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Nowe zlecenia w ostatnich 24h (z demand)
        const newOrders24h = demand.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= last24h;
        }).length;
        
        // Wysłane oferty w ostatnich 7 dniach
        const sentOffers7d = data.filter(offer => {
          const offerDate = new Date(offer.createdAt);
          return offerDate >= last7d;
        }).length;
        
        // Współczynnik akceptacji (zaakceptowane / wszystkie)
        const totalOffers = data.length;
        const acceptedOffers = data.filter(o => o.status === 'accepted').length;
        const acceptanceRate = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0;
        
        setStats({
          newOrders24h,
          sentOffers7d,
          acceptanceRate
        });
      } catch (error) {
        console.error('Błąd pobierania ofert:', error);
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    if (user && demand.length >= 0) {
      fetchOffers();
    }
  }, [user, demand]);

  const list = useMemo(() => {
    const filtered = demand.filter((o) => {
      // "Tylko moje usługi" filtrujemy po stronie backendu (/api/orders/open?services=...).
      // Lokalny filtr profilu bywał zbyt restrykcyjny dla historycznych formatów service i powodował puste listy.
      
      // Filtr usługi w toolbarze — zgodny z orderServiceMatchesProvider (kategoria vs pełny slug)
      if (!showAllServices && filters.service && filters.service !== "any") {
        if (!orderServiceMatchesProvider(o.service, [filters.service], allServices)) return false;
      }
      
      // Kalkuluj rzeczywistą odległość jeśli mamy geolokalizację
      if (userLocation && o.locationLat && o.locationLon) {
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          o.locationLat, 
          o.locationLon
        );
        o.distanceKm = Math.round(distance * 10) / 10; // Zaokrąglij do 1 miejsca po przecinku
        
        if (clientMaxDistance && distance > Number(clientMaxDistance)) {
          return false;
        }
      } else if (clientMaxDistance && o.distanceKm && o.distanceKm > Number(clientMaxDistance)) {
        // Fallback do hardkodowanej odległości jeśli nie ma geolokalizacji, ale tylko jeśli distanceKm jest ustawione
        return false;
      }
      // Jeśli zlecenie nie ma koordynatów, pokaż je zawsze (nie filtruj po dystansie)
      
      if (filters.budgetMin || filters.budgetMax) {
        const lo = Number(filters.budgetMin || 0);
        const hi = Number(filters.budgetMax || 999999);
        // Backend zwraca budget (liczba) lub budgetRange (obiekt z min/max)
        const budgetMin = o.budgetRange?.min ?? o.budgetFrom ?? (o.budget ? o.budget * 0.8 : 0);
        const budgetMax = o.budgetRange?.max ?? o.budgetTo ?? (o.budget ? o.budget * 1.2 : 999999);
        if (budgetMax < lo || budgetMin > hi) return false;
      }

      // Typ płatności: w systemie / poza systemem
      if (filters.paymentType !== "any") {
        const method = o.paymentMethod || o.paymentPreference || o.payment_method || null;
        if (filters.paymentType === "system") {
          if (method && method !== "system" && method !== "both") return false;
        } else if (filters.paymentType === "external") {
          if (method && method !== "external") return false;
        }
      }

      // Status ofert (bez ofert / max 3 oferty)
      if (filters.offersStatus !== "any") {
        const count =
          typeof o.offersCount === "number"
            ? o.offersCount
            : Array.isArray(o.offers)
            ? o.offers.length
            : null;
        if (count != null) {
          if (filters.offersStatus === "no_offers" && count > 0) return false;
          if (filters.offersStatus === "max_3" && count > 3) return false;
        }
      }

      return true;
    });

    // Sortowanie
    const urgencyOrder = (u) => {
      if (u === "now") return 0;
      if (u === "today") return 1;
      if (u === "tomorrow") return 2;
      if (u === "this_week") return 3;
      if (u === "flexible") return 4;
      return 5;
    };
    const getBudget = (o) =>
      Number(o.budgetTo ?? o.budget ?? o.budgetFrom ?? o.budgetRange?.max ?? 0);
    const getCreated = (o) => (o.createdAt ? new Date(o.createdAt).getTime() : 0);

    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case "urgency_desc":
          return urgencyOrder(a.urgency) - urgencyOrder(b.urgency);
        case "urgency_asc":
          return urgencyOrder(b.urgency) - urgencyOrder(a.urgency);
        case "created_desc":
        case "default":
          return getCreated(b) - getCreated(a);
        case "created_asc":
          return getCreated(a) - getCreated(b);
        case "budget_desc":
          return getBudget(b) - getBudget(a);
        case "budget_asc":
          return getBudget(a) - getBudget(b);
        default:
          return getCreated(b) - getCreated(a);
      }
    });

    const withRecommendation = sorted.map((o) => {
      const id = String(o?._id || o?.id || "").trim();
      return {
        ...o,
        isRecommendedForProvider: !!(id && recommendedIdSet.has(id)),
        recommendedReason: "",
      };
    });

    if (recommendedOnly) {
      return withRecommendation.filter((o) => o.isRecommendedForProvider);
    }

    return withRecommendation;
  }, [demand, filters, userLocation, calculateDistance, showAllServices, user, allServices, providerServiceSlugs, clientMaxDistance, recommendedIdSet, recommendedOnly]);

  // Zlecenia, do których wykonawca już złożył ofertę (do zielonego przycisku "Twoja oferta")
  const orderIdsWithMyOffer = useMemo(() => {
    const set = new Set();
    (offers || []).forEach((off) => {
      const id = off.orderId?._id || off.orderId;
      if (id) set.add(String(id));
    });
    return set;
  }, [offers]);

  const hasActiveFilters = useMemo(() => {
    const d = filters;
    return (
      (d.sortBy !== "default" && d.sortBy !== "created_desc") ||
      d.maxDistance !== 300 ||
      (d.budgetMin !== "" && d.budgetMin != null) ||
      (d.budgetMax !== "" && d.budgetMax != null) ||
      d.paymentType !== "any" ||
      d.offersStatus !== "any" ||
      d.providerId !== "any" ||
      d.service !== "any" ||
      recommendedOnly
    );
  }, [filters, recommendedOnly]);

  const center = useMemo(
    () =>
      userLocation?.lat != null && userLocation?.lng != null
        ? [userLocation.lat, userLocation.lng]
        : [52.2297, 21.0122],
    [userLocation]
  );
  
  // Layout helpers - używamy viewMode zamiast mapSize
  const mapHeightClass = viewMode === "list" ? "h-[320px]" : viewMode === "split" ? "h-[520px]" : "h-screen";
  const gridClass =
    viewMode === "map"
      ? "grid-cols-1"
      : viewMode === "list"
      ? "lg:grid-cols-[280px_1fr]" // filtry po lewej, zlecenia po prawej
      : "lg:grid-cols-[1.1fr_520px]"; // podział 50/50 - zlecenia po lewej, mapa po prawej

  const handleProposeQuote = (order) => {
    // Sprawdź czy to prawdziwe zlecenie z API (ma _id) czy demo (ma id)
    const orderId = order._id || order.id;
    const looksLikeMongoId = typeof orderId === "string" && /^[a-fA-F0-9]{24}$/.test(orderId);
    
    console.log('🔍 handleProposeQuote:', { 
      orderId, 
      looksLikeMongoId, 
      hasId: !!order.id, 
      hasUnderscoreId: !!order._id 
    });
    
    // Przekieruj do strony szczegółów zlecenia z zakładką "offers", gdzie formularz jest w prawej kolumnie
    navigate(`/orders/${orderId}?tab=offers`);
  };

  const handleOpenChat = (order) => {
    const orderId = order._id || order.id;
    if (!orderId) {
      console.warn("Brak orderId dla czatu", order);
      return;
    }
    navigate(`/orders/${orderId}/chat`);
  };

  const handleOpenDetails = (order, tab) => {
    const orderId = order._id || order.id;
    if (!orderId) {
      console.warn("Brak orderId dla szczegółów", order);
      return;
    }
    const query = tab ? `?tab=${tab}` : "";
    navigate(`/orders/${orderId}${query}`);
  };

  const handleStatusChange = async (next) => {
    setStatus(next);
    try {
      const token = localStorage.getItem("token");
      await fetch(apiUrl("/api/providers/me/status"), { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next }) 
      });
    } catch (error) {
      console.error("Błąd aktualizacji statusu:", error);
    }
  };


  // Pobierz listę providerów z firmy (dla właściciela/manager)
  useEffect(() => {
    const fetchCompanyProviders = async () => {
      if (!canManageCompany || !user?.company) return;
      
      try {
        const token = localStorage.getItem('token');
        const companyId = typeof user.company === 'string' ? user.company : user.company._id;
        const response = await fetch(apiUrl(`/api/companies/${companyId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.company) {
            // Pobierz wszystkich providerów z firmy (owner + providers + managers którzy są providerami)
            const providers = [];
            if (data.company.owner) {
              providers.push({ _id: data.company.owner._id || data.company.owner, name: data.company.owner.name || 'Właściciel', email: data.company.owner.email });
            }
            if (data.company.providers) {
              data.company.providers.forEach(p => {
                if (!providers.find(pr => pr._id === (p._id || p))) {
                  providers.push({ _id: p._id || p, name: p.name || 'Provider', email: p.email });
                }
              });
            }
            if (data.company.managers) {
              data.company.managers.forEach(m => {
                // Dodaj tylko jeśli manager jest też providerem
                if (!providers.find(pr => pr._id === (m._id || m))) {
                  providers.push({ _id: m._id || m, name: m.name || 'Manager', email: m.email });
                }
              });
            }
            setCompanyProviders(providers);
          }
        }
      } catch (err) {
        console.error('Error fetching company providers:', err);
      }
    };
    
    fetchCompanyProviders();
  }, [canManageCompany, user?.company]);

  // Blokuj scrollowanie w widoku mapy
  useEffect(() => {
    if (viewMode === "map") {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewMode]);

  return (
    <div className={`${viewMode === "map" ? "h-screen overflow-hidden fixed inset-0 bg-white" : "min-h-screen bg-[var(--qs-color-bg-soft)]"}`}>
      {/* Onboarding – pierwszy raz (3 kroki) */}
      {!onboardingDismissed && viewMode !== "map" && (
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Witaj w panelu wykonawcy – krótki start</h3>
              <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
                <li>Ustaw status na <strong>Online</strong>, aby klienci widzieli Cię w wynikach</li>
                <li>Sprawdź dostępne zlecenia w Twojej okolicy (lista lub mapa)</li>
                <li>Złóż pierwszą ofertę – przyciskiem „AI podpowie cenę” możesz uzyskać sugestię</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() => {
                setOnboardingDismissed(true);
                try { localStorage.setItem("providerHome_onboarding", "dismissed"); } catch (_) {}
              }}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Rozumiem
            </button>
          </div>
        </div>
      )}

      {/* Banner dla firm wieloosobowych */}
      {isInCompany && viewMode !== "map" && (
        <div className="bg-indigo-50 border-b border-indigo-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-indigo-600 text-lg">🏢</span>
                <div>
                  <div className="font-semibold text-indigo-900">
                    {isCompanyOwner ? 'Właściciel firmy' : isCompanyManager ? 'Manager firmy' : 'Członek firmy'}
                  </div>
                  <div className="text-sm text-indigo-700">
                    {isCompanyOwner || isCompanyManager 
                      ? 'Możesz zarządzać firmą i widzieć zlecenia wszystkich wykonawców'
                      : 'Widzisz zlecenia dostępne dla Twojej firmy'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pasek statusu wykonawcy */}
      <div className={`${viewMode === "map" ? "fixed" : "sticky"} ${viewMode === "map" ? "top-16" : "top-0"} left-0 right-0 z-40 ${viewMode === "map" ? "bg-white/30 backdrop-blur-lg" : "bg-white/60 backdrop-blur-lg"} border-b ${viewMode === "map" ? "border-slate-200/20" : "border-slate-200/30"} shadow-sm transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-700 font-medium">Mój status:</span>
            <div className="flex flex-wrap gap-2">
              <StatusPill
                active={status === "online"}
                onClick={() => handleStatusChange("online")}
                color="emerald"
              >
                Online
              </StatusPill>
              <StatusPill
                active={status === "offline"}
                onClick={() => handleStatusChange("offline")}
                color="slate"
              >
                Offline
              </StatusPill>
            </div>
            {status === "offline" && (
              <p className="text-xs text-slate-600 max-w-xs">
                Gdy jesteś offline, nadal jesteś widoczny w wynikach wyszukiwania, ale klienci widzą status Offline. Przełącz na Online, aby zwiększyć szansę na szybki kontakt.
              </p>
            )}
            <Link 
              to="/account?tab=schedule" 
              className="ml-4 text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
            >
              📅 Harmonogram dostępności
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2 flex-wrap">
              <span className="qs-badge qs-badge-dark text-[10px] whitespace-nowrap">
                {list.length} zleceń
              </span>
              {freeRepliesLeft != null && (
                <span className="qs-badge qs-badge-success text-[11px] whitespace-nowrap">
                  Darmowe wyceny: {freeRepliesLeft}
                </span>
              )}
              <button
                type="button"
                title={
                  showAllServices
                    ? "Widzisz wszystkie otwarte zlecenia w zasięgu. Kliknij, aby ograniczyć do usług z profilu."
                    : "Widzisz tylko zlecenia zgodne z usługami w koncie. Kliknij, aby zobaczyć pełny rynek."
                }
                onClick={() => {
                  const next = !showAllServices;
                  setShowAllServices(next);
                  // Czyść ukryty filtr usługi przy zmianie trybu, żeby nie blokował wyników.
                  setFilters((s) => ({ ...s, service: "any" }));
                }}
                className={`qs-chip text-xs whitespace-nowrap ${
                  !showAllServices
                    ? 'active shadow-md shadow-indigo-200'
                    : 'bg-white/70 border border-white/60 text-slate-600 hover:bg-white'
                }`}
              >
                {showAllServices ? 'Wszystkie zlecenia' : 'Tylko moje usługi'}
              </button>
              <button
                type="button"
                title="Pokaż tylko zlecenia rekomendowane przez AI"
                onClick={() => setRecommendedOnly((v) => !v)}
                className={`qs-chip text-xs whitespace-nowrap ${
                  recommendedOnly
                    ? "active shadow-md shadow-indigo-200"
                    : "bg-white/70 border border-white/60 text-slate-600 hover:bg-white"
                }`}
              >
                {recommendedLoading ? "✨ Polecane..." : "✨ Tylko polecane"}
              </button>
            </div>
          </div>
        </div>

      {/* Toolbar z przełącznikami widoków - uproszczony dla providera */}
      {viewMode === "map" ? (
        // Tryb mapy - fixed toolbar na górze (pod paskiem statusu)
        <div className="fixed left-0 right-0 z-50 border-b border-gray-200/20 shadow-sm bg-white relative" style={{ top: '128px' }}>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilters({
                  service: "any",
                  maxDistance: 300,
                  budgetMin: "",
                  budgetMax: "",
                  providerId: "any",
                  paymentType: "any",
                  offersStatus: "any",
                  sortBy: "default",
                });
                setRecommendedOnly(false);
              }}
              className="absolute top-2 right-4 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Wyczyść filtry
            </button>
          )}
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {list.length} {list.length === 1 ? 'zlecenie' : list.length < 5 ? 'zlecenia' : 'zleceń'} w {user?.location || "Warszawie"}
              </div>
              <div className="flex items-center gap-2">
                {/* Przyciski widoku (📋📊🗺️) są na mapie w prawym górnym rogu – nie w toolbare */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(true)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 transition-colors"
                >
                  Wszystkie filtry
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Tryb lista/podział - sticky toolbar (kompaktowy); przy przewijaniu – przezroczysty
        <div
          className={`sticky top-16 z-40 border-b min-h-[88px] flex items-center transition-all duration-300 ${
            toolbarScrolled
              ? "border-gray-200/60 bg-white/75 backdrop-blur-md shadow-sm"
              : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 w-full">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div className="flex items-end gap-4 flex-wrap">
                <Select
                  compact
                  label="Sortowanie"
                  value={filters.sortBy}
                  onChange={(v) => setFilters((s) => ({ ...s, sortBy: v }))}
                  options={[
                    { label: "Domyślne", value: "default" },
                    { label: "Czas: najnowsze", value: "created_desc" },
                    { label: "Czas: najstarsze", value: "created_asc" },
                    { label: "Pilność: od najpilniejszego", value: "urgency_desc" },
                    { label: "Pilność: od najmniej pilnego", value: "urgency_asc" },
                    { label: "Budżet: największy", value: "budget_desc" },
                    { label: "Budżet: najmniejszy", value: "budget_asc" },
                  ]}
                />
                <Range
                  compact
                  label="Maks. dystans (km)"
                  value={filters.maxDistance}
                  onChange={(v) => setFilters((s) => ({ ...s, maxDistance: v }))}
                  min={1}
                  max={600}
                />
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({
                        service: "any",
                        maxDistance: 300,
                        budgetMin: "",
                        budgetMax: "",
                        providerId: "any",
                        paymentType: "any",
                        offersStatus: "any",
                        sortBy: "default",
                      });
                      setRecommendedOnly(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Wyczyść filtry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Wszystkie filtry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Przełącznik widoku – od razu pod toolbarem, tylko w widoku lista */}
      {viewMode === "list" && !isMobileViewport && (
        <div className="max-w-6xl mx-auto px-4 py-2 w-full flex justify-end">
          <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-lg w-fit">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Lista"
            >
              <List className="w-4 h-4" aria-hidden />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Lista + mapa"
            >
              <LayoutGrid className="w-4 h-4" aria-hidden />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Mapa"
            >
              <Map className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Lista + Mapa */}
      {viewMode !== "map" && (
      <div className={`max-w-7xl mx-auto px-4 grid ${gridClass} gap-6 mt-4`}>
        {/* Filtry po lewej stronie - tylko w widoku lista */}
        {viewMode === "list" && (
          <div className={`
            bg-white 
            shadow-[0_4px_30px_rgba(0,0,0,0.05)] 
            border 
            border-[#E9ECF5] 
            p-5
          `}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Filtry</h3>
              <button
                onClick={() => {
                  setFilters({
                    service: "any",
                    maxDistance: 300,
                    budgetMin: "",
                    budgetMax: "",
                    providerId: "any",
                    paymentType: "any",
                    offersStatus: "any",
                    sortBy: "default",
                  });
                  setRecommendedOnly(false);
                }}
                className="text-xs text-slate-600 hover:text-slate-800"
              >
                Wyczyść wszystko
              </button>
            </div>
            <div className="space-y-4">
              <Select
                label="Sortowanie"
                value={filters.sortBy}
                onChange={(v) => setFilters((s) => ({ ...s, sortBy: v }))}
                options={[
                  { label: "Domyślne", value: "default" },
                  { label: "Czas: najnowsze", value: "created_desc" },
                  { label: "Czas: najstarsze", value: "created_asc" },
                  { label: "Pilność: od najpilniejszego", value: "urgency_desc" },
                  { label: "Pilność: od najmniej pilnego", value: "urgency_asc" },
                  { label: "Budżet: największy", value: "budget_desc" },
                  { label: "Budżet: najmniejszy", value: "budget_asc" },
                ]}
              />
              <Range
                label="Maks. dystans (km)"
                value={filters.maxDistance}
                onChange={(v) => setFilters((s) => ({ ...s, maxDistance: v }))}
                min={1}
                max={600}
              />
              <Select
                label="Płatność"
                value={filters.paymentType}
                onChange={(v) => setFilters((s) => ({ ...s, paymentType: v }))}
                options={[
                  { label: "Dowolna", value: "any" },
                  { label: "W systemie (Helpfli Protect)", value: "system" },
                  { label: "Poza systemem", value: "external" },
                ]}
              />
              {userLocation && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  <span>Lokalizacja: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                </div>
              )}
              <Budget
                label="Budżet (zł, min–max)"
                minValue={filters.budgetMin}
                maxValue={filters.budgetMax}
                onChange={(min, max) => setFilters((s) => ({ ...s, budgetMin: min, budgetMax: max }))}
              />

              <Select
                label="Status ofert"
                value={filters.offersStatus}
                onChange={(v) => setFilters((s) => ({ ...s, offersStatus: v }))}
                options={[
                  { label: "Dowolny", value: "any" },
                  { label: "Bez ofert", value: "no_offers" },
                  { label: "Max 3 oferty", value: "max_3" },
                ]}
              />
              
              {/* Checkbox "Pokaż wszystkie zlecenia" */}
              <div className="pt-2 border-t border-gray-200 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAllServicesFilter"
                    checked={showAllServices}
                    onChange={(e) => {
                      setShowAllServices(e.target.checked);
                      setFilters((s) => ({ ...s, service: "any" }));
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <label htmlFor="showAllServicesFilter" className="text-sm text-gray-700 cursor-pointer">
                    Pokaż wszystkie zlecenia
                  </label>
                </div>
                <p className="text-xs text-slate-500">Gdy wyłączone – widzisz tylko zlecenia pasujące do usług w Twoim profilu. Ustaw usługi w koncie, aby feed był lepiej dopasowany.</p>
              </div>
              
              {/* Filtr po providerze - tylko dla właściciela/manager firmy (mobile) */}
              {canManageCompany && companyProviders.length > 0 && (
                <Select
                  label="Członek zespołu"
                  value={filters.providerId}
                  onChange={(v) => setFilters((s) => ({ ...s, providerId: v }))}
                  options={[
                    { label: "Wszyscy członkowie", value: "any" },
                    ...companyProviders.map(p => ({
                      label: p.name || p.email || 'Nieznany',
                      value: p._id
                    }))
                  ]}
                />
              )}
            </div>
          </div>
        )}
        
        {/* Lista popytu - tylko gdy nie jest widok mapa (pełny ekran) */}
        {viewMode !== "map" && (
          <div className="space-y-3">
            {demandLoading ? (
              <div className="border border-slate-200 bg-white p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Ładowanie zleceń...</p>
              </div>
            ) : (
              <>
                {list.map((o) => (
                  <DemandCard
                    key={o._id || o.id}
                    data={o}
                    hasMyOffer={orderIdsWithMyOffer.has(String(o._id || o.id))}
                    onQuote={() => handleProposeQuote(o)}
                    onChat={() => handleOpenChat(o)}
                    onDetails={(tab) => handleOpenDetails(o, tab)}
                  />
                ))}
                {!list.length && (
                  <div className="border border-slate-200 bg-white p-6 text-slate-600">
                    Brak dopasowanych zleceń w okolicy.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Mapa popytu - tylko w trybie split; przyciski widoku w rogu na mapie */}
        {viewMode === "split" && (
          <div className={`lg:sticky lg:top-[92px] relative border border-slate-200 rounded-lg overflow-hidden ${mapHeightClass}`}>
            {/* Przełącznik widoku – w prawym górnym rogu na mapie */}
            <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1 bg-white/40 backdrop-blur-sm rounded-lg shadow border border-slate-200/60 p-1.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Lista"
              >
                <List className="w-4 h-4" aria-hidden />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Lista + mapa"
              >
                <LayoutGrid className="w-4 h-4" aria-hidden />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Mapa"
              >
                <Map className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <div className="w-full h-full bg-white">
            {center && center.length === 2 && center[0] && center[1] ? (
              <MapContainer center={[...center]} zoom={13} className="w-full h-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapInitialRecenter userLocation={userLocation} />
              <UserLocationLayer userLocation={userLocation} />
              <MapLocateControl
                userLocation={userLocation}
                onRequestLocation={getUserLocation}
              />
              {list.map((o, idx) => {
                // Sprawdź czy zlecenie ma prawidłowe współrzędne
                let lat = o.lat || o.locationLat;
                let lng = o.lng || o.locationLng;

                // Fallback: jeśli brak współrzędnych w danych – dociśnij marker w okolicy centrum/użytkownika
                if (!lat || !lng) {
                  const baseLat = (userLocation?.lat ?? center?.[0] ?? 52.2297);
                  const baseLng = (userLocation?.lng ?? center?.[1] ?? 21.0122);
                  const jitter = 0.003 + (idx % 5) * 0.001; // drobne przesunięcie, aby markery się nie nachodziły
                  lat = baseLat + Math.sin(idx) * jitter;
                  lng = baseLng + Math.cos(idx) * jitter;
                }

                return (
                  <Marker
                    key={o._id || o.id}
                    position={[lat, lng]}
                  icon={orderIcon(o)}
                >
                    <Popup className="custom-popup">
                      <MapOrderPopup order={o} hasMyOffer={orderIdsWithMyOffer.has(String(o._id || o.id))} onQuote={() => handleProposeQuote(o)} onChat={() => handleOpenChat(o)} onDetails={(tab) => handleOpenDetails(o, tab)} />
                    </Popup>
                  </Marker>
                );
              })}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-2">🗺️</div>
                  <p>Ładowanie mapy...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      )}

      {/* Tryb mapy - pełnoekranowy; mapa tuż pod sekcją "18 zleceń... / Wszystkie filtry" */}
      {viewMode === "map" && (
        <>
        <div 
          className="fixed inset-0 w-full"
          style={{
            top: '190px',
            zIndex: 1,
            height: 'calc(100vh - 190px)'
          }}
        >
          <div className="w-full h-full">
            <div className="border border-slate-200 bg-white overflow-hidden h-full">
              {center && center.length === 2 && center[0] && center[1] ? (
                <MapContainer center={[...center]} zoom={13} className="w-full h-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapInitialRecenter userLocation={userLocation} />
                  <UserLocationLayer userLocation={userLocation} />
                  <MapLocateControl
                    userLocation={userLocation}
                    onRequestLocation={getUserLocation}
                  />
                  {list.map((o, idx) => {
                    let lat = o.lat || o.locationLat;
                    let lng = o.lng || o.locationLng;

                    if (!lat || !lng) {
                      const baseLat = (userLocation?.lat ?? center?.[0] ?? 52.2297);
                      const baseLng = (userLocation?.lng ?? center?.[1] ?? 21.0122);
                      const jitter = 0.003 + (idx % 5) * 0.001;
                      lat = baseLat + Math.sin(idx) * jitter;
                      lng = baseLng + Math.cos(idx) * jitter;
                    }

                    return (
                      <Marker key={o._id || o.id || idx} position={[lat, lng]} icon={orderIcon(o)}>
                        <Popup className="custom-popup">
                          <MapOrderPopup order={o} hasMyOffer={orderIdsWithMyOffer.has(String(o._id || o.id))} onQuote={() => handleProposeQuote(o)} onChat={() => handleOpenChat(o)} onDetails={(tab) => handleOpenDetails(o, tab)} />
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Brak danych mapy
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Przyciski widoku: osobna warstwa, w prawym górnym rogu na mapie (tuż pod sekcją), z-index nad mapą i przyciskiem zleceń */}
        {!isMobileViewport && (
        <div 
          className="fixed top-[198px] right-4 z-[45] flex items-center gap-1 bg-white/40 backdrop-blur-sm rounded-lg shadow border border-slate-200/60 p-1.5"
          aria-label="Przełącz widok"
        >
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Lista"
          >
            <List className="w-4 h-4" aria-hidden />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Lista + mapa"
          >
            <LayoutGrid className="w-4 h-4" aria-hidden />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Mapa"
          >
            <Map className="w-4 h-4" aria-hidden />
          </button>
        </div>
        )}
        </>
      )}

      {isMobileViewport && (viewMode === "map" || viewMode === "list") && (
        <div
          ref={mobileViewMenuRef}
          className={`fixed z-[56] ${viewMode === "map" ? "left-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))]" : "right-3"}`}
          style={viewMode === "list" ? { top: "190px" } : undefined}
        >
          <button
            type="button"
            onClick={() => setIsMobileViewMenuOpen((v) => !v)}
            aria-label="Zmień widok"
            className={`w-11 h-11 rounded-full border border-slate-200 bg-white/95 backdrop-blur shadow-lg flex items-center justify-center transition-transform duration-150 ${
              isMobileViewMenuOpen ? "scale-105" : "scale-100"
            }`}
          >
            <Layers className="w-5 h-5 text-slate-700" />
          </button>
          {isMobileViewMenuOpen && (
            <div className="absolute right-0 mt-2 min-w-[132px] rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 transition-all duration-150 opacity-100 translate-y-0 scale-100 origin-top-right">
              <button
                type="button"
                onClick={() => {
                  setViewMode("list");
                  setIsMobileViewMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                  viewMode === "list" ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <List className="w-4 h-4" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("map");
                  setIsMobileViewMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                  viewMode === "map" ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Map className="w-4 h-4" />
                Mapa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Przycisk do rozwijania panelu zleceń w trybie mapy */}
      {viewMode === "map" && (
        <button
          onClick={() => setIsOrderListExpanded(!isOrderListExpanded)}
          className="fixed right-4 w-80 px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border border-slate-200 rounded-lg bg-white shadow-sm z-40"
          style={{ top: '250px' }}
        >
          <h3 className="font-semibold text-slate-800">Dostępne zlecenia ({list.length})</h3>
          <svg 
            className={`w-5 h-5 text-slate-600 transition-transform ${isOrderListExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Panel boczny z listą zleceń w trybie pełnoekranowym (zwijany) */}
      {viewMode === "map" && (
        <div className={`fixed right-4 bg-white rounded-2xl border border-slate-200 shadow-xl z-40 transition-all duration-300 overflow-hidden ${
          isOrderListExpanded ? 'bottom-4 w-80' : 'hidden'
        }`}
        style={isOrderListExpanded ? { top: '310px' } : {}}
        >
          {/* Lista zleceń - widoczna tylko gdy rozwinięta */}
          {isOrderListExpanded && (
            <div className="overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 240px)' }}>
              {demandLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 text-sm">Ładowanie zleceń...</p>
                </div>
              ) : list.length > 0 ? (
                list.map((o) => (
                  <DemandCardCompact
                    key={o._id || o.id}
                    data={o}
                    hasMyOffer={orderIdsWithMyOffer.has(String(o._id || o.id))}
                    onQuote={() => handleProposeQuote(o)}
                    onChat={() => handleOpenChat(o)}
                    onDetails={(tab) => handleOpenDetails(o, tab)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Brak dostępnych zleceń
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewMode !== "map" && (
      <div className="max-w-7xl mx-auto px-4 mt-8 pb-12">
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard label="Nowe zlecenia (24h)" value={stats.newOrders24h.toString()} loading={demandLoading} />
          <StatCard label="Wysłane oferty (7d)" value={stats.sentOffers7d.toString()} loading={offersLoading} />
          <StatCard
            label="Współczynnik akceptacji"
            value={`${stats.acceptanceRate}%`}
            loading={offersLoading}
            hint="To procent ofert zaakceptowanych przez klientów. Staraj się utrzymać ≥40% (dobre opisy, realistyczne ceny)."
          />
        </div>
      </div>
      )}


      {viewMode !== "map" && <Footer />}

      <ProviderAdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        canManageCompany={canManageCompany}
        companyProviders={companyProviders}
      />

    </div>
  );
}

/** --- Mini komponenty --- */
function StatusPill({ active, onClick, color = "slate", children }) {
  const base = "px-3 py-1.5 rounded-xl text-sm border transition";
  const activeCls =
    color === "emerald"
      ? "bg-emerald-600 text-white border-emerald-700"
      : "bg-slate-600 text-white border-slate-700";
  const idleCls = "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
  return (
    <button className={`${base} ${active ? activeCls : idleCls}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Select({ label, value, onChange, options, compact }) {
  return (
    <label className={compact ? "text-xs" : "text-sm"}>
      <div className={`text-slate-600 ${compact ? "mb-0.5" : "mb-1"}`}>{label}</div>
      <select
        className={`border border-slate-200 bg-white ${compact ? "px-2 py-1.5 rounded-lg text-xs" : "px-3 py-2 rounded-xl"}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Range({ label, value, onChange, min, max, compact }) {
  return (
    <label className={compact ? "text-xs" : "text-sm"}>
      <div className={`text-slate-600 ${compact ? "mb-0.5" : "mb-1"}`}>{label}: <span className="font-medium">{value} km</span></div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={compact ? "w-32" : "w-56"}
      />
    </label>
  );
}

function Budget({ label, minValue, maxValue, onChange }) {
  return (
    <div className="text-sm">
      <div className="text-slate-600 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="od"
          className="w-24 px-3 py-2 rounded-xl border border-slate-200"
          value={minValue}
          onChange={(e) => onChange(e.target.value, maxValue)}
        />
        <span className="text-slate-400">–</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="do"
          className="w-24 px-3 py-2 rounded-xl border border-slate-200"
          value={maxValue}
          onChange={(e) => onChange(minValue, e.target.value)}
        />
      </div>
    </div>
  );
}


function DemandCard({ data, hasMyOffer = false, onQuote, onChat, onDetails }) {
  const u = URGENCY_BADGE[data.urgency] || URGENCY_BADGE.flexible;
  
  // Obsługa różnych formatów danych (mock vs API)
  const title = data.title || data.description || `${data.service} - zlecenie`;
  const service = asDisplayText(data.service, "Usługa");
  const serviceDetails = asDisplayText(data.serviceDetails, ""); // doprecyzowanie usługi
  const distance = data.distanceKm;
  const budget = data.budget || `${data.budgetFrom || '?'}–${data.budgetTo || '?'}`;
  const clientNote = asDisplayText(data.clientNote ?? data.description, "");
  const clientName = asDisplayText(data.client?.name, 'Klient');
  const avatarUrl = data.client?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(clientName)}&backgroundColor=4F46E5`;
  
  const isPilne = data.urgency === 'now'; // Tylko "now" jest pilne
  const isBoosted = data.boostedUntil && new Date(data.boostedUntil) > new Date();
  const expiry = getExpiryInfo(data);
  
  return (
    <div 
      className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border flex flex-col sm:flex-row ${
        isBoosted 
          ? 'border-yellow-400 border-2 shadow-lg shadow-yellow-200' 
          : data.isRecommendedForProvider
            ? 'border-indigo-400 bg-gradient-to-br from-indigo-50/70 to-white ring-1 ring-indigo-200'
          : isPilne 
            ? 'border-amber-300' 
            : 'border-slate-200'
      }`}
      style={{
        backgroundColor: isBoosted ? '#fffbeb' : data.isRecommendedForProvider ? '#f8faff' : 'var(--card)',
      }}
    >
      {/* Lewa sekcja - avatar i wyróżnienia */}
      <div 
        className="w-full sm:w-1/3 flex flex-col items-center justify-center relative p-4 sm:p-6"
        style={{ backgroundColor: isPilne ? '#f59e0b' : 'var(--primary)' }}
      >
        <img
          src={avatarUrl}
          alt={clientName}
          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
        />
        {/* Badge podbicia - najwyższy priorytet */}
        {isBoosted && (
          <div className="absolute top-2 right-2">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-3 py-1 shadow-lg border-2 border-yellow-600 animate-pulse" title="PODBITE - Na górze listy">
              <span className="text-white text-xs font-bold flex items-center gap-1">
                <span>⭐</span>
                <span>PODBITE</span>
              </span>
            </div>
          </div>
        )}
        {/* Badge pilne w lewym dolnym rogu - tylko dla urgency === 'now' */}
        {isPilne && !isBoosted && (
          <div className="absolute bottom-4 right-4">
            <div className="bg-white rounded-full p-2 shadow-lg border-2 border-orange-500" title="Pilne - Zalecamy dodać 10% więcej za szybką reakcję">
              <span className="text-orange-600 text-base font-bold">⚡</span>
            </div>
          </div>
        )}
      </div>

      {/* Prawa sekcja - szczegóły */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col" style={{ backgroundColor: 'var(--card)' }}>
        {/* Informacje o kliencie - AVATAR I IMIĘ NA GÓRZE */}
        <div className="flex items-start gap-3 mb-3">
          <img
            src={avatarUrl}
            alt={clientName}
            className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-left block mb-2" style={{ color: 'var(--foreground)' }}>
              {clientName}
            </div>
            {data.isRecommendedForProvider && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                  ✨ Polecane dla Ciebie
                </span>
              </div>
            )}
            
            {/* Tytuł usługi */}
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              {service}
            </h3>
            {serviceDetails && (
              <div className="text-xs text-indigo-600 font-medium mb-1">
                {serviceDetails}
              </div>
            )}
            
            {/* Opis */}
            {clientNote && (
              <p className="text-xs mb-0 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                {clientNote}
              </p>
            )}
          </div>
        </div>

        {/* Linia oddzielająca */}
        <div className="border-t my-4" style={{ borderColor: 'var(--border)' }}></div>

        {/* Informacje o zleceniu - NA DOLE */}
        <div className="space-y-2 text-sm mb-4">
          {/* Czas dodania zlecenia */}
          {data.createdAt && (
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Dodane {formatTimeAgo(data.createdAt)}
              {/* Badge pilne - tylko dla urgency === 'now' */}
              {isPilne && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                  ⚡ Pilne
                </span>
              )}
            </div>
          )}

          {/* Ważność zlecenia */}
          {expiry && (
            <div className="text-xs">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${expiry.cls}`}>
                <span>⏳</span>
                <span>{expiry.text}</span>
              </span>
            </div>
          )}
          
          {/* Budżet i odległość */}
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {(distance !== undefined && distance !== null && distance >= 0) && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>{distance.toFixed(1)} km</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>Budżet: {typeof budget === 'number' ? `${budget} zł` : `${budget} zł`}</span>
            </div>
            {/* Etykieta pilności/terminu - tylko tekst, bez badge dla nie-pilnych */}
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${u.dot}`} />
              <span>{u.label}</span>
            </div>
            {/* Liczba ofert */}
            {data.offersCount !== undefined && (
              <div className="flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>{data.offersCount} {data.offersCount === 1 ? 'oferta' : data.offersCount < 5 ? 'oferty' : 'ofert'}</span>
              </div>
            )}
            {/* Informacja o załącznikach */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>{data.attachments.length} {data.attachments.length === 1 ? 'załącznik' : data.attachments.length < 5 ? 'załączniki' : 'załączników'}</span>
              </div>
            )}
            {/* Informacja o źródle zlecenia (AI vs manual) */}
            {data.source === 'ai' && (
              <div className="flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>Utworzone z AI</span>
              </div>
            )}
          </div>
          
            {/* Badge'y zgodnie z flow – pilność tylko jako „Pilne”, bez drugiego badge „NOW” */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Duża konkurencja */}
            {typeof data.offersCount === 'number' && data.offersCount > 5 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                Duża konkurencja ({data.offersCount} ofert)
              </span>
            )}
            {/* Badge załączników - informacja o zdjęciach/filmach */}
            {data.attachments && data.attachments.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>{data.attachments.length} {data.attachments.length === 1 ? 'zdjęcie' : 'zdjęć'}</span>
              </span>
            )}
            {/* 🛡 Helpfli Protect - płatność przez system (tylko gdy klient wybrał system lub both) */}
            {(data.paymentPreference === 'system' || data.paymentPreference === 'both') && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>Helpfli Protect</span>
              </span>
            )}
            {/* 💳 Płatność poza systemem - tylko gdy klient wybrał external lub both */}
            {(data.paymentPreference === 'external' || data.paymentPreference === 'both') && data.paymentPreference !== 'system' && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>Płatność poza systemem</span>
              </span>
            )}
            {data.isRecommendedForProvider && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                ✨ Polecane dla Ciebie
              </span>
            )}
          </div>
          {data.isRecommendedForProvider && asDisplayText(data.recommendedReason, "") && (
            <p className="mt-2 text-xs text-indigo-700">
              {asDisplayText(data.recommendedReason, "")}
            </p>
          )}
        </div>

        {/* Przyciski akcji */}
        <div className="mt-auto flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onChat}
            className="w-full sm:w-auto px-4 py-2.5 text-sm rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
            }}
          >
            Czat
          </button>
          <button
            onClick={() => onDetails('details')}
            className="w-full sm:w-auto px-4 py-2.5 text-sm rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
            }}
          >
            Szczegóły
          </button>
          <button
            onClick={hasMyOffer ? () => onDetails('my_offer') : onQuote}
            className={`w-full sm:w-auto px-6 py-2.5 text-sm rounded-lg font-medium transition-colors ${
              hasMyOffer
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600'
                : 'btn-helpfli-primary'
            }`}
          >
            {hasMyOffer ? 'Twoja oferta' : 'Złóż ofertę'}
          </button>
          {!hasMyOffer && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('openProviderAi', { detail: { prefill: 'Jaką cenę zaproponować dla tego zlecenia?' } }))}
              className="w-full sm:w-auto px-4 py-2.5 text-sm rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
            >
              ✨ AI podpowie cenę
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MapOrderPopup({ order, hasMyOffer = false, onQuote, onChat, onDetails }) {
  const u = URGENCY_BADGE[order.urgency] || URGENCY_BADGE.flexible;
  
  const service = asDisplayText(order.service, "Usługa");
  const clientNote = asDisplayText(order.clientNote ?? order.description, "");
  const clientName = asDisplayText(order.client?.name, 'Klient');
  const avatarUrl = order.client?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(clientName)}&backgroundColor=4F46E5`;
  const distance = order.distanceKm;
  const budget = order.budget || `${order.budgetFrom || '?'}–${order.budgetTo || '?'}`;
  const isFastTrack = order.urgency === 'now' || order.isPriority || order.isFastTrack;
  const isBoosted = order.boostedUntil && new Date(order.boostedUntil) > new Date();
  const expiry = getExpiryInfo(order);
  
  return (
    <div className="min-w-[260px] max-w-[300px]">
      <div className={`rounded-2xl overflow-hidden shadow-lg border ${
        order.isRecommendedForProvider
          ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-white ring-1 ring-indigo-200'
          : isFastTrack
            ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50'
            : 'border-slate-200 bg-white'
      }`}>
        {/* Header z avatarem i nazwą */}
        <div className={`p-3 flex items-center gap-2 relative ${
          isBoosted 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
            : isFastTrack 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700'
        }`}>
          <img
            src={avatarUrl}
            alt={clientName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-white truncate">{clientName}</div>
            <div className="text-xs text-white/90 truncate">{service}</div>
            {order.isRecommendedForProvider && (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 text-indigo-700 px-2 py-0.5 text-[10px] font-semibold">
                  ✨ Polecane
                </span>
              </div>
            )}
          </div>
          {isBoosted && (
            <div className="bg-white rounded-full px-2 py-1 shadow-md animate-pulse">
              <span className="text-yellow-600 text-xs font-bold">⭐ PODBITE</span>
            </div>
          )}
          {isFastTrack && !isBoosted && (
            <div className="bg-white rounded-full p-1.5 shadow-md">
              <span className="text-orange-600 text-sm font-bold">⚡</span>
            </div>
          )}
        </div>
        
        {/* Treść */}
        <div className="p-3 space-y-2">
          {/* Opis */}
          {clientNote && (
            <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
              {clientNote}
            </p>
          )}
          
          {/* Informacje w jednej linii */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
            {distance && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>{distance.toFixed(1)} km</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>{typeof budget === 'number' ? `${budget} zł` : `${budget} zł`}</span>
            </span>
            {order.urgency && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${u.ring}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
                <span className="text-xs">{u.label}</span>
              </span>
            )}
            {/* Informacja o załącznikach */}
            {order.attachments && order.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>{order.attachments.length} {order.attachments.length === 1 ? 'zdjęcie' : 'zdjęć'}</span>
              </span>
            )}
            {/* Informacja o źródle zlecenia (AI vs manual) */}
            {order.source === 'ai' && (
              <span className="flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>AI</span>
              </span>
            )}
          </div>

          {expiry && (
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${expiry.cls}`}>
                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span className="text-xs">{expiry.text}</span>
              </span>
            </div>
          )}
          
          {/* Przyciski */}
          <div className="pt-2 space-y-1.5">
            <button
              onClick={hasMyOffer ? () => onDetails('my_offer') : onQuote}
              className={`w-full px-3 py-2 text-xs rounded-lg font-semibold shadow-sm transition-colors ${
                hasMyOffer
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {hasMyOffer ? 'Twoja oferta' : 'Złóż ofertę'}
            </button>
            {!hasMyOffer && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('openProviderAi', { detail: { prefill: 'Jaką cenę zaproponować dla tego zlecenia?' } }))}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
              >
                ✨ AI podpowie cenę
              </button>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={onChat}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Czat
              </button>
              <button
                onClick={() => onDetails('details')}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Szczegóły
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemandCardCompact({ data, hasMyOffer = false, onQuote, onChat, onDetails }) {
  const u = URGENCY_BADGE[data.urgency] || URGENCY_BADGE.flexible;
  
  const service = asDisplayText(data.service, "Usługa");
  const serviceDetails = asDisplayText(data.serviceDetails, "");
  const distance = data.distanceKm;
  const budget = data.budget || `${data.budgetFrom || '?'}–${data.budgetTo || '?'}`;
  const clientNote = asDisplayText(data.clientNote ?? data.description, "");
  const clientName = asDisplayText(data.client?.name, 'Klient');
  const avatarUrl = data.client?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(clientName)}&backgroundColor=4F46E5`;
  
  const isFastTrack = data.urgency === 'now' || data.isPriority || data.isFastTrack;
  const expiry = getExpiryInfo(data);
  
  return (
    <div 
      className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border flex ${
        data.isRecommendedForProvider
          ? 'border-indigo-400 bg-gradient-to-br from-indigo-50/70 to-white ring-1 ring-indigo-200'
          : isFastTrack
            ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50'
            : 'border-slate-200 bg-white'
      }`}
    >
      {/* Kompaktowa lewa sekcja */}
      <div 
        className={`w-16 flex flex-col items-center justify-center relative ${isFastTrack ? 'bg-orange-500' : 'bg-indigo-600'}`}
      >
        <img
          src={avatarUrl}
          alt={clientName}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
        {isFastTrack && (
          <div className="absolute bottom-1 right-1">
            <div className="bg-white rounded-full p-1 shadow-sm">
              <span className="text-orange-600 text-xs font-bold">⚡</span>
            </div>
          </div>
        )}
      </div>

      {/* Kompaktowa prawa sekcja */}
      <div className="flex-1 p-3 flex flex-col min-w-0">
        <div className="flex items-start gap-2 mb-2">
          <img
            src={avatarUrl}
            alt={clientName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-slate-900 truncate">{clientName}</div>
            {data.isRecommendedForProvider && (
              <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                ✨ Polecane
              </span>
            )}
            <h3 className="text-sm font-medium text-slate-800 truncate">{service}</h3>
          </div>
        </div>

        {/* Opis */}
        {clientNote && (
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">
            {clientNote}
          </p>
        )}
        {data.isRecommendedForProvider && asDisplayText(data.recommendedReason, "") && (
          <p className="text-[11px] text-indigo-700 mb-2 line-clamp-2">
            {asDisplayText(data.recommendedReason, "")}
          </p>
        )}

        {/* Informacje */}
        <div className="flex items-center gap-2 text-xs mb-2 text-slate-600">
          {distance && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden /> {distance.toFixed(1)} km</span>
          )}
          <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden /> Budżet: {typeof budget === 'number' ? `${budget} zł` : `${budget} zł`}</span>
        </div>

        {expiry && (
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${expiry.cls}`}>
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span>{expiry.text}</span>
            </span>
          </div>
        )}

        {/* Etykieta pilności */}
        <div className="mb-2">
          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${u.ring}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
            <span className="text-slate-700">{u.label}</span>
          </span>
        </div>

        {/* Przyciski */}
        <div className="mt-auto flex flex-col gap-1.5">
          <button 
            onClick={hasMyOffer ? () => onDetails('my_offer') : onQuote} 
            className={`w-full px-2 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              hasMyOffer
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {hasMyOffer ? 'Twoja oferta' : 'Złóż ofertę'}
          </button>
          {!hasMyOffer && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('openProviderAi', { detail: { prefill: 'Jaką cenę zaproponować dla tego zlecenia?' } }))}
              className="w-full px-2 py-1 text-xs rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
            >
              ✨ AI podpowie cenę
            </button>
          )}
          <div className="flex gap-1.5">
            <button 
              onClick={onChat} 
              className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Czat
            </button>
            <button 
              onClick={() => onDetails('details')} 
              className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Szczegóły
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading = false, hint }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-600">{label}</div>
      {loading ? (
        <div className="text-2xl font-semibold text-slate-400 mt-1">...</div>
      ) : (
        <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
      )}
      {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}
