import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Filter, SortAsc, SortDesc, Grid, List, Star, Clock, CheckCircle, Building2, Zap, Heart, MessageCircle, Eye, X } from 'lucide-react';
import ProviderCard from '../components/ProviderCard';
import CompareBar from '../components/CompareBar';
import CompareModal from '../components/CompareModal';
import useCompare from '../hooks/useCompare';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

// DEMO fallback – pokaż przykładowych usługodawców, gdy backend nie zwróci wyników (jak w Home.jsx)
const DEMO_PROVIDERS = [
  {
    id: "demo-1",
    name: "Jan Kowalski",
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
    headline: "Hydraulik 10+ lat doświadczenia. Szybkie naprawy.",
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
    headline: "Elektryk. Montaże i naprawy.",
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
    headline: "Drobne naprawy domowe.",
    online: true,
    b2b: true,
  },
];

/** Pola filtrów — współdzielone przez panel desktop i szufladę mobilną */
function ProvidersFiltersFields({ filters, updateFilter }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Usługa</label>
        <input
          type="text"
          value={filters.service}
          onChange={(e) => updateFilter('service', e.target.value)}
          placeholder="np. hydraulik, elektryk"
          className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Miasto</label>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => updateFilter('city', e.target.value)}
          placeholder="np. Warszawa, Kraków"
          className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Promień: {filters.radius} km</label>
        <input
          type="range"
          min="5"
          max="100"
          value={filters.radius}
          onChange={(e) => updateFilter('radius', parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Szybkie filtry</label>
        <label className="flex items-center gap-3 min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.availableNow}
            onChange={(e) => updateFilter('availableNow', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
          />
          <span className="text-sm text-gray-700">Dostępny teraz</span>
        </label>
        <label className="flex items-center gap-3 min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => updateFilter('verified', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
          />
          <span className="text-sm text-gray-700">Verified/KYC</span>
        </label>
        <label className="flex items-center gap-3 min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.b2b}
            onChange={(e) => updateFilter('b2b', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
          />
          <span className="text-sm text-gray-700">Firma</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Poziom</label>
        <select
          value={filters.tier}
          onChange={(e) => updateFilter('tier', e.target.value)}
          className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        >
          <option value="all">Wszystkie</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="pro">TOP</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Min. ocena: {filters.minRating}★</label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={filters.minRating}
          onChange={(e) => updateFilter('minRating', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stawka wykonawcy: {filters.minPrice || 0} – {filters.maxPrice || 'bez limitu'} zł
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Pokazuje tylko wykonawców, których cena za usługę mieści się w podanym przedziale.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.minPrice || ''}
            onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : 0)}
            placeholder="Min"
            className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            value={filters.maxPrice || ''}
            onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Max (opcjonalne)"
            className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max. czas realizacji: {filters.maxTime || 'bez limitu'} dni
        </label>
        <input
          type="range"
          min="1"
          max="30"
          value={filters.maxTime || 30}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            updateFilter('maxTime', value < 30 ? value : undefined);
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 dzień</span>
          <span>{filters.maxTime || 30} dni</span>
          <button type="button" onClick={() => updateFilter('maxTime', undefined)} className="text-blue-600 hover:text-blue-700">
            Bez limitu
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-3 min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.instantChat}
            onChange={(e) => updateFilter('instantChat', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
          />
          <span className="text-sm text-gray-700">Tylko z chatem natychmiastowym</span>
        </label>
        <label className="flex items-center gap-3 min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.vatInvoice}
            onChange={(e) => updateFilter('vatInvoice', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
          />
          <span className="text-sm text-gray-700">Tylko z fakturą VAT</span>
        </label>
      </div>
    </div>
  );
}

const ProvidersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const compare = useCompare();
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  useBodyScrollLock(mobileFiltersOpen);

  // URL parameters
  const city = searchParams.get('city') || '';
  const service = searchParams.get('service') || '';
  const tier = searchParams.get('tier') || 'all';
  const sort = searchParams.get('sort') || 'relevance';
  
  // State
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(localStorage.getItem('providersViewMode') || 'grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Helper function to parse URL params - używamy tych samych nazw co Home.jsx
  const parseFiltersFromURL = () => {
    return {
      // Używamy 'q' zamiast 'service' dla zgodności z Home
      search: searchParams.get('q') || searchParams.get('service') || '',
      service: searchParams.get('service') || searchParams.get('q') || '',
      // Używamy 'location' zamiast 'city' dla zgodności z backendem
      city: searchParams.get('city') || searchParams.get('location') || '',
      location: searchParams.get('location') || searchParams.get('city') || '',
      radius: parseInt(searchParams.get('radius')) || 50,
      availableNow: searchParams.get('availableNow') === 'true',
      verified: searchParams.get('verified') === 'true' || searchParams.get('verifiedOnly') === 'true',
      verifiedOnly: searchParams.get('verifiedOnly') === 'true' || searchParams.get('verified') === 'true',
      b2b: searchParams.get('b2b') === 'true',
      // Używamy 'level' zamiast 'tier' dla zgodności z Home
      tier: searchParams.get('tier') || searchParams.get('level') || 'all',
      level: searchParams.get('level') || searchParams.get('tier') || 'any',
      minRating: parseFloat(searchParams.get('minRating')) || 0,
      // Używamy 'budgetMin' i 'budgetMax' jak w Home
      maxPrice: parseInt(searchParams.get('maxPrice') || searchParams.get('budgetMax')) || undefined,
      minPrice: parseInt(searchParams.get('minPrice') || searchParams.get('budgetMin')) || 0,
      budgetMin: parseInt(searchParams.get('budgetMin') || searchParams.get('minPrice')) || 0,
      budgetMax: parseInt(searchParams.get('budgetMax') || searchParams.get('maxPrice')) || undefined,
      maxTime: parseInt(searchParams.get('maxTime')) || undefined,
      instantChat: searchParams.get('instantChat') === 'true',
      vatInvoice: searchParams.get('vatInvoice') === 'true'
    };
  };
  
  // Filters - initialize from URL params only once on mount
  const [filters, setFilters] = useState(() => parseFiltersFromURL());
  const [locationDetected, setLocationDetected] = useState(false); // Flaga, czy już wykryliśmy lokalizację
  
  // Synchronizuj filtry z URL gdy URL się zmienia (np. gdy wracamy z Home)
  // Ale tylko jeśli URL rzeczywiście się zmienił (nie podczas inicjalizacji)
  const prevSearchParamsRef = React.useRef(searchParams.toString());
  useEffect(() => {
    const currentParams = searchParams.toString();
    if (prevSearchParamsRef.current !== currentParams) {
      const urlFilters = parseFiltersFromURL();
      setFilters(urlFilters);
      prevSearchParamsRef.current = currentParams;
      // Jeśli w URL jest city, oznacza że użytkownik już ustawił lokalizację
      if (urlFilters.city) {
        setLocationDetected(true);
      }
    }
  }, [searchParams]);

  // Funkcja do reverse geocoding - zamiana koordynatów na nazwę miasta
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pl`,
        {
          headers: {
            'User-Agent': 'Helpfli/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        // Pobierz nazwę miasta z różnych możliwych pól
        const city = data.address.city || 
                     data.address.town || 
                     data.address.village || 
                     data.address.municipality ||
                     data.address.county ||
                     '';
        return city;
      }
      return null;
    } catch (error) {
      console.error('❌ Błąd reverse geocoding:', error);
      return null;
    }
  };

  // Funkcja do pobierania geolokalizacji i ustawienia miasta
  const detectUserLocation = useCallback(async () => {
    // Nie wykrywaj lokalizacji, jeśli:
    // 1. Już wykryliśmy wcześniej
    // 2. Użytkownik już ustawił miasto w URL/filtrach
    if (locationDetected || filters.city) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const cityName = await reverseGeocode(lat, lng);
        if (cityName) {
          // Ustaw miasto w filtrach tylko jeśli nie było wcześniej ustawione
          setFilters(prev => {
            if (!prev.city) {
              return { ...prev, city: cityName, location: cityName };
            }
            return prev;
          });
          setLocationDetected(true);
        }
      },
      () => {
        // Nie pokazujemy błędu użytkownikowi - po prostu nie ustawiamy lokalizacji
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minut
      }
    );
  }, [locationDetected, filters.city]);

  // Automatyczne wykrywanie lokalizacji przy załadowaniu strony (tylko jeśli nie ma miasta w URL)
  useEffect(() => {
    // Jeśli nie ma miasta w URL/filtrach, spróbuj wykryć lokalizację
    const urlFilters = parseFiltersFromURL();
    if (!urlFilters.city && !locationDetected) {
      detectUserLocation();
    } else if (urlFilters.city) {
      // Jeśli w URL jest już miasto, oznacz że lokalizacja jest ustawiona
      setLocationDetected(true);
    }
  }, []); // Uruchom tylko raz przy mount
  
  // Active filters for chips
  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.service) active.push(`Usługa: ${filters.service}`);
    if (filters.city) active.push(`Miasto: ${filters.city}`);
    if (filters.radius !== 50) active.push(`Promień: ${filters.radius}km`);
    if (filters.availableNow) active.push('Dostępny teraz');
    if (filters.verified) active.push('Verified');
    if (filters.b2b) active.push('Firma');
    if (filters.tier !== 'all') active.push(`Poziom: ${filters.tier}`);
    if (filters.minRating > 0) active.push(`Min. ocena: ${filters.minRating}★`);
    if (filters.minPrice > 0) active.push(`Min. cena: ${filters.minPrice} zł`);
    if (filters.maxPrice < 1000) active.push(`Max. cena: ${filters.maxPrice} zł`);
    if (filters.maxTime && filters.maxTime < 999) active.push(`Max. czas: ${filters.maxTime} dni`);
    if (filters.instantChat) active.push('Chat natychmiastowy');
    if (filters.vatInvoice) active.push('Firma (VAT)');
    return active;
  }, [filters]);
  
  // Load providers
  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, page]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // Skip empty strings, 'all' values, false booleans, undefined, and null
        if (value === '' || value === 'all' || value === false || value === undefined || value === null) return;
        
        // Convert booleans to 'true' string for API
        if (typeof value === 'boolean' && value) {
          params.append(key, 'true');
        } else if (typeof value !== 'boolean') {
          params.append(key, value.toString());
        }
      });
      params.append('sort', sort);
      params.append('page', page);
      params.append('limit', 20);
      
      // Użyj DOKŁADNIE tego samego formatu co Home.jsx dla pełnej zgodności
      const searchParams = new URLSearchParams();
      
      // Używamy tych samych nazw parametrów co Home.jsx
      if (filters.search || filters.service) {
        searchParams.set('q', String(filters.search || filters.service));
      }
      // NIE wysyłaj parametru location, jeśli nie jest to wymagane (jak w Home.jsx)
      // Backend może nie mieć providerów z określonym location w bazie, co powoduje brak wyników
      // Komentujemy to, aby pokazać wszystkich providerów (jak w Home)
      // if (filters.location || filters.city) {
      //   const location = filters.location || filters.city;
      //   if (location && location.trim()) {
      //     searchParams.set('location', String(location.trim()));
      //   }
      // }
      if (filters.level && filters.level !== 'any') {
        searchParams.set('level', String(filters.level));
      } else if (filters.tier && filters.tier !== 'all') {
        searchParams.set('level', String(filters.tier));
      }
      if (filters.minRating && filters.minRating > 0) {
        searchParams.set('minRating', String(filters.minRating));
      }
      if (filters.budgetMin || filters.minPrice) {
        const budgetMin = filters.budgetMin || filters.minPrice;
        if (budgetMin > 0) searchParams.set('budgetMin', String(budgetMin));
      }
      if (filters.budgetMax || filters.maxPrice) {
        const budgetMax = filters.budgetMax || filters.maxPrice;
        if (budgetMax && budgetMax > 0) searchParams.set('budgetMax', String(budgetMax));
      }
      if (filters.verified || filters.verifiedOnly) {
        searchParams.set('verifiedOnly', 'true');
      }
      if (filters.b2b) {
        searchParams.set('b2b', 'true');
      }
      if (filters.availableNow) {
        searchParams.set('availableNow', 'true');
      }
      // maxTime nie jest używany w Home, ale możemy go dodać
      if (filters.maxTime && filters.maxTime > 0) {
        searchParams.set('maxTime', String(filters.maxTime));
      }
      
      const API = import.meta.env.VITE_API_URL || "";
      const token = localStorage.getItem("token");
      const url = `${API}/api/search?${searchParams.toString()}`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: `HTTP ${response.status}: ${errorText || 'Unknown error'}` };
        }
        throw new Error(errorData?.message || `HTTP ${response.status}: Błąd pobierania wykonawców`);
      }
      
      const data = await response.json();

      // Backend zwraca dane bezpośrednio w tablicy, nie w data.providers (jak w Home)
      const items = Array.isArray(data) ? data : (data?.providers || data?.results || []);

      // Znormalizuj dane do formatu oczekiwanego przez ProviderCard (identycznie jak w Home.jsx)
      const normalized = items.map(p => ({
        id: p._id || p.id,
        _id: p._id || p.id,
        name: p.name || p.displayName || "Wykonawca",
        rating: p.rating ?? p.averageRating ?? 0,
        distanceKm: p.distanceKm ?? p.distance ?? null,
        priceFrom: p.priceFrom ?? p.price?.from ?? p.price ?? null,
        priceTo: p.priceTo ?? p.price?.to ?? null,
        level: p.level || p.tier || p.providerTier || null,
        providerTier: p.providerTier || p.level || 'basic',
        verified: !!p.verified || !!p.verification?.verified,
        verification: p.verification || null, // Dodaj pełny obiekt verification
        badges: p.badges || [], // Dodaj badges
        hasHelpfliGuarantee: !!p.hasHelpfliGuarantee,
        isTopProvider: !!p.isTopProvider,
        lat: p.location?.lat ?? p.lat,
        lng: p.location?.lng ?? p.lng,
        avatarUrl: p.avatarUrl || p.avatar || null,
        service: p.matchedServiceName || p.matchedServiceNames?.[0] || p.serviceName || p.service || null,
        allServices: p.allServices || [],
        provider_status: p.provider_status || null,
        promo: p.promo || {},
        bio: p.bio || p.description || "",
        online: p.online ?? p.provider_status?.isOnline ?? false,
        b2b: p.b2b ?? false,
        // Dodaj pola które mogą być w Home ale nie są tutaj
        headline: p.headline || null,
        avatar: p.avatar || p.avatarUrl || null,
      }));

      // Jeśli brak wyników i nie ma żadnych filtrów, pokaż DEMO (jak w Home.jsx)
      if (!normalized.length && page === 1 && (!filters || Object.keys(filters).every(k => !filters[k] || filters[k] === 'all' || filters[k] === 50 || filters[k] === 0))) {
        setProviders(DEMO_PROVIDERS);
        setHasMore(false);
      } else if (normalized.length === 0 && page === 1) {
        // Pusta tablica wyników
        setProviders([]);
        setHasMore(false);
      } else if (page === 1) {
        setProviders(normalized);
        setHasMore(normalized.length === 20);
      } else {
        setProviders(prev => [...prev, ...normalized]);
        setHasMore(normalized.length >= 20);
      }

      // Endpoint /api/search nie zwraca hasMore, więc sprawdzamy czy otrzymaliśmy pełną stronę
      setHasMore(normalized.length >= 20);
    } catch (error) {
      if (page === 1) {
        setProviders(DEMO_PROVIDERS);
      } else {
        setProviders([]);
      }
    } finally {
      setLoading(false);
    }
    };

  // Update URL when filters change - używamy tych samych nazw parametrów co Home.jsx
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const params = new URLSearchParams();
    
    // Mapuj filtry na format URL zgodny z Home.jsx
    if (filters.search || filters.service) {
      params.set('q', String(filters.search || filters.service));
      params.set('service', String(filters.search || filters.service)); // zachowujemy też 'service' dla kompatybilności
    }
    if (filters.location || filters.city) {
      const location = filters.location || filters.city;
      if (location && location.trim()) {
        params.set('city', location);
        params.set('location', location); // zachowujemy też 'location' dla backendu
      }
    }
    if (filters.level && filters.level !== 'any') {
      params.set('level', String(filters.level));
    } else if (filters.tier && filters.tier !== 'all') {
      params.set('level', String(filters.tier));
      params.set('tier', String(filters.tier)); // zachowujemy też 'tier' dla kompatybilności
    }
    if (filters.minRating && filters.minRating > 0) {
      params.set('minRating', String(filters.minRating));
    }
    if (filters.budgetMin || filters.minPrice) {
      const budgetMin = filters.budgetMin || filters.minPrice;
      if (budgetMin > 0) {
        params.set('budgetMin', String(budgetMin));
        params.set('minPrice', String(budgetMin)); // zachowujemy też 'minPrice' dla kompatybilności
      }
    }
    if (filters.budgetMax || filters.maxPrice) {
      const budgetMax = filters.budgetMax || filters.maxPrice;
      if (budgetMax && budgetMax > 0) {
        params.set('budgetMax', String(budgetMax));
        params.set('maxPrice', String(budgetMax)); // zachowujemy też 'maxPrice' dla kompatybilności
      }
    }
    if (filters.verified || filters.verifiedOnly) {
      params.set('verifiedOnly', 'true');
      params.set('verified', 'true'); // zachowujemy też 'verified' dla kompatybilności
    }
    if (filters.b2b) {
      params.set('b2b', 'true');
    }
    if (filters.availableNow) {
      params.set('availableNow', 'true');
    }
    if (filters.maxTime && filters.maxTime > 0) {
      params.set('maxTime', String(filters.maxTime));
    }
    if (filters.radius && filters.radius !== 50) {
      params.set('radius', String(filters.radius));
    }
    if (sort && sort !== 'relevance') {
      params.set('sort', sort);
    }
    
    setSearchParams(params, { replace: true });
  }, [filters, sort, setSearchParams]);
  
  // Handle filter changes
  const updateFilter = (key, value) => {
    // Jeśli użytkownik ręcznie zmienia miasto, oznacz że lokalizacja jest ustawiona
    if (key === 'city' && value && value.trim()) {
      setLocationDetected(true);
      // Zaktualizuj także location dla zgodności
      setFilters(prev => ({ ...prev, city: value, location: value }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setPage(1);
  };
  
  // Handle sort change
  const handleSortChange = (newSort) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('sort', newSort);
      return newParams;
    });
    setPage(1);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('providersViewMode', mode);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      service: '',
      city: '',
      radius: 50,
      availableNow: false,
      verified: false,
      b2b: false,
      tier: 'all',
      minRating: 0,
      maxPrice: undefined,
      minPrice: 0,
      maxTime: undefined,
      instantChat: false,
      vatInvoice: false
    });
    setPage(1);
  };
  
  // Remove specific filter
  const removeFilter = (filterText) => {
    if (filterText.includes('Usługa:')) updateFilter('service', '');
    else if (filterText.includes('Miasto:')) updateFilter('city', '');
    else if (filterText.includes('Promień:')) updateFilter('radius', 50);
    else if (filterText.includes('Dostępny teraz')) updateFilter('availableNow', false);
    else if (filterText.includes('Verified')) updateFilter('verified', false);
    else if (filterText === 'Firma (VAT)') updateFilter('vatInvoice', false);
    else if (filterText === 'Firma') updateFilter('b2b', false);
    else if (filterText.includes('Poziom:')) updateFilter('tier', 'all');
    else if (filterText.includes('Min. ocena:')) updateFilter('minRating', 0);
    else if (filterText.includes('Min. cena:')) updateFilter('minPrice', 0);
    else if (filterText.includes('Max. cena:')) updateFilter('maxPrice', 1000);
    else if (filterText.includes('Max. czas:')) updateFilter('maxTime', undefined);
    else if (filterText.includes('Chat natychmiastowy')) updateFilter('instantChat', false);
    else if (filterText.includes('Firma (VAT)')) updateFilter('vatInvoice', false);
  };
  
  // Load more providers
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  // Get breadcrumb text
  const getBreadcrumbText = () => {
    if (filters.service && filters.city) {
      return `${filters.service} w ${filters.city}`;
    } else if (filters.service) {
      return `${filters.service} - Wszystkie miasta`;
    } else if (filters.city) {
      return `Wszystkie usługi w ${filters.city}`;
    }
    return 'Katalog wykonawców';
  };
  
  // Get results count text
  const getResultsText = () => {
    const count = providers.length;
    if (count === 0) return 'Brak wyników';
    if (count === 1) return '1 wykonawca';
    if (count < 5) return `${count} wykonawców`;
    return `${count} wykonawców`;
  };
  
  // SEO meta data
  const pageTitle = service 
    ? `Wykonawcy ${service} w ${city || 'Polsce'} | Helpfli`
    : `Wszyscy wykonawcy w ${city || 'Polsce'} | Helpfli`;
  
  const pageDescription = service
    ? `Znajdź najlepszych wykonawców usług ${service} w ${city || 'Twojej okolicy'}. Sprawdzone opinie, konkurencyjne ceny, szybka realizacja.`
    : `Znajdź sprawdzonych wykonawców w ${city || 'Twojej okolicy'}. Hydraulicy, elektrycy, złota rączka i więcej. Bezpieczne płatności, gwarancja jakości.`;

    return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`wykonawcy, usługi, ${service}, ${city}, hydraulik, elektryk, złota rączka, remonty`} />
        <link rel="canonical" href={`${window.location.origin}/providers${window.location.search}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${window.location.origin}/providers${window.location.search}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Title and results count */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getBreadcrumbText()}</h1>
              <p className="text-gray-600 mt-1">
                {getResultsText()} {filters.city && `w ${filters.city}`}
              </p>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:hidden sticky z-20 top-[var(--app-nav-sticky-offset)] -mx-4 px-4 py-3 mb-3 bg-gray-50/95 backdrop-blur border-b border-gray-200">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-semibold shadow-sm active:scale-[0.99]"
          >
            <Filter className="w-5 h-5 shrink-0" />
            Filtry i wyszukiwanie
          </button>
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Zamknij filtry"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
                <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Zamknij"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 pb-8">
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Wyczyść wszystko
                  </button>
                </div>
                <ProvidersFiltersFields filters={filters} updateFilter={updateFilter} />
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md active:scale-[0.99]"
                >
                  Pokaż wyniki
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Wyczyść wszystko
                </button>
              </div>
              <ProvidersFiltersFields filters={filters} updateFilter={updateFilter} />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Sort and active filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                  <span className="text-sm text-gray-600 shrink-0">Sortuj według:</span>
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full sm:w-auto min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="relevance">Domyślne (relevance)</option>
                    <option value="rating">Ocena</option>
                    <option value="price_asc">Cena ↑</option>
                    <option value="price_desc">Cena ↓</option>
                    <option value="distance">Odległość</option>
                    <option value="response_time">Czas reakcji</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-600">
                  {getResultsText()}
                </div>
              </div>
              
              {/* Active filters chips */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {filter}
                      <button
                        onClick={() => removeFilter(filter)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
        </div>

            {/* Results */}
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    data={provider}
                    onSelect={() => navigate(`/provider/${provider.id}`)}
                    onQuote={() => navigate(`/provider/${provider.id}?action=quote`)}
                    onCompare={() => compare.toggle(provider)}
                    isCompared={!!compare.items.find(c => c.id === provider.id)}
                  />
                ))}
                
                {loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}
                
                {hasMore && !loading && (
                  <div className="text-center py-4">
                    <button
                      onClick={loadMore}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Pokaż więcej
                    </button>
                  </div>
                )}
                
                {!loading && providers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <Filter size={48} className="mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Brak wyników</h3>
                      <p className="text-sm">Spróbuj zmienić filtry lub poszerzyć promień wyszukiwania</p>
                    </div>
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Wyczyść filtry
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => (
                <ProviderCard
                    key={provider.id}
                    data={provider}
                    compact={true}
                    onSelect={() => navigate(`/provider/${provider.id}`)}
                    onQuote={() => navigate(`/provider/${provider.id}?action=quote`)}
                    onCompare={() => compare.toggle(provider)}
                    isCompared={!!compare.items.find(c => c.id === provider.id)}
                  />
                ))}
                {loading && (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}
                {!loading && providers.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <Filter size={48} className="mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Brak wyników</h3>
                      <p className="text-sm">Spróbuj zmienić filtry lub poszerzyć promień wyszukiwania</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <CompareBar
        items={compare.items}
        onClear={compare.clear}
        onCompare={() => setCompareModalOpen(true)}
        onRemove={(i)=> compare.toggle(i)}
      />
      <CompareModal open={compareModalOpen} onClose={() => setCompareModalOpen(false)} items={compare.items} />
      <Footer />
    </div>
  );
};

export default ProvidersPage;