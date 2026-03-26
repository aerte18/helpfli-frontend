import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Filter, X } from "lucide-react";
import Header from "../components/Header";
import { UI } from "../i18n/pl_ui";
import AIBar from "../components/AIBar";
import SmartFilters from "../components/SmartFilters";
import ProviderCard from "../components/ProviderCard";
import MapPanel from "../components/MapPanel";
import CompareBar from "../components/CompareBar";
import HowItWorks from "../components/HowItWorks";
import useCompare from "../hooks/useCompare";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import Footer from "../components/Footer";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('query') || '';
  const service = searchParams.get('service') || '';
  
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    level: "all",
    rating: 0,
    sort: "quality",
    budgetMin: 0,
    budgetMax: 1000,
    eta: "any",
    b2b: false,
    availableNow: false,
  });
  const { items: compareItems, toggle, clear } = useCompare();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  useBodyScrollLock(mobileFiltersOpen);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.level !== "all") n += 1;
    if (filters.rating > 0) n += 1;
    if (filters.eta !== "any") n += 1;
    if (filters.budgetMin > 0 || filters.budgetMax < 1000) n += 1;
    if (filters.b2b) n += 1;
    if (filters.availableNow) n += 1;
    if (filters.sort !== "quality") n += 1;
    return n;
  }, [filters]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Użyj query i service do filtrowania po stronie serwera
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (service) params.append('service', service);
        const url = params.toString()
          ? apiUrl(`/api/providers?${params.toString()}`)
          : apiUrl("/api/providers");
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();

        // Ustal tablicę wyników niezależnie od kształtu odpowiedzi
        const rawProviders = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.providers)
            ? json.providers
            : Array.isArray(json)
              ? json
              : [];

        // Transformuj dane z backendu na format oczekiwany przez komponenty – defensywnie
        const transformedProviders = rawProviders.map((provider) => {
          if (!provider) return null;
          const name = typeof provider.name === "string" && provider.name.trim().length
            ? provider.name
            : "Wykonawca";

          const priceBase = typeof provider.price === "number" ? provider.price : 100;
          const priceTo = priceBase + 50;

          const lat = provider.locationCoords?.lat ?? 52.2297;
          const lng = provider.locationCoords?.lng ?? 21.0122;

          return {
            id: provider._id || provider.id || name,
            initials: name
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase(),
            name,
            service: provider.service || "Usługa",
            level: provider.level || "standard",
            rating: typeof provider.rating === "number" ? provider.rating : 4.5,
            priceFrom: priceBase,
            priceTo,
            eta: provider.eta || "30–45 min",
            distanceKm: typeof provider.distanceKm === "number" ? provider.distanceKm : 3.2,
            quality: typeof provider.quality === "number" ? provider.quality : 85,
            verified: provider.verified === true,
            b2b: provider.b2b === true,
            badges: Array.isArray(provider.badges) ? provider.badges : ["Gwarancja Helpfli"],
            coords: [lat, lng],
            online: provider.online === true,
            avatar: provider.avatar || null,
          };
        }).filter(Boolean);

        setProviders(transformedProviders);
      } catch (error) {
        console.error('Błąd pobierania providerów:', error);
        setError('Nie udało się pobrać danych providerów');
        
        // Fallback do demo danych z filtrowaniem po query
        const demo = [
          { id:"1", initials:"JK", name:"Jan Kowalski", service:"Hydraulik", level:"pro", rating:4.9, priceFrom:150, priceTo:260, eta:"30–45 min", distanceKm:3.2, quality:92, verified:true, b2b:true, badges:["Gwarancja Helpfli"], coords:[52.2297,21.0122], online:true },
          { id:"2", initials:"AN", name:"Anna Nowak", service:"Elektryk", level:"standard", rating:4.7, priceFrom:100, priceTo:180, eta:"dzisiaj wieczór", distanceKm:5.8, quality:86, verified:true, b2b:false, badges:["Szybkie wyceny"], coords:[52.24,21.01], online:false },
          { id:"3", initials:"PW", name:"Piotr Wiśniewski", service:"Złota rączka", level:"basic", rating:4.4, priceFrom:80, priceTo:120, eta:"jutro rano", distanceKm:7.3, quality:78, verified:false, b2b:true, badges:[], coords:[52.235,21.04], online:true },
        ];
        
        // Filtruj demo dane po query
        const filteredDemo = query ? demo.filter(p => 
          p.service.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase())
        ) : demo;
        
        setProviders(filteredDemo);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [query, service]);

  const filtered = providers
    .filter(p => (filters.level === "all" ? true : p.level === filters.level))
    .filter(p => p.rating >= filters.rating)
    .filter(p => (filters.b2b ? p.b2b : true))
    .filter(p => (filters.availableNow ? p.online : true))
    .filter(p => (filters.budgetMin === 0 ? true : p.priceFrom >= filters.budgetMin))
    .filter(p => (filters.budgetMax === 1000 ? true : p.priceTo <= filters.budgetMax))
    .filter(p => (filters.eta === "any" ? true : p.eta === filters.eta))
    .sort((a, b) => {
      if (filters.sort === "price") return a.priceFrom - b.priceFrom;
      if (filters.sort === "eta") return a.distanceKm - b.distanceKm;
      return b.quality - a.quality; // default: quality
    });

  const handleProviderClick = (provider) => {
    navigate(`/providers/${provider.id}`);
  };

  const handleCreateOrder = (provider) => {
    navigate(`/orders/new?providerId=${provider.id}&service=${provider.service}&desc=${encodeURIComponent(provider.description || '')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg mb-2">Błąd</div>
            <div className="text-gray-600">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* AI Bar z kontekstem wyszukiwania */}
      <AIBar 
        context={`Użytkownik szuka: "${query}". Pokaż najlepszych wykonawców i pomóż w wyborze.`}
        suggestions={[
          "Znajdź wykonawców w okolicy",
          "Porównaj ceny i oceny",
          "Sprawdź dostępność terminów"
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Nagłówek wyszukiwania */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{UI.navSearch}</h1>
          <p className="mt-2 text-gray-600">
            {UI.listTitleNearbyHelp}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Filtry — tylko desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <SmartFilters value={filters} onChange={setFilters} variant="sidebar" />
          </aside>

          {/* Lista wyników */}
          <div className="lg:col-span-3">
            <div className="lg:hidden sticky z-30 top-[var(--search-page-sticky-bar-offset)] -mx-4 px-4 py-2.5 mb-4 bg-gray-50/95 backdrop-blur border-b border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm min-h-[48px] flex-1"
              >
                <Filter className="w-5 h-5 shrink-0 text-indigo-600" aria-hidden />
                Filtry
                {activeFilterCount > 0 && (
                  <span className="ml-auto rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="text-sm text-gray-600 shrink-0">{filtered.length} wyn.</span>
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg bg-yellow-50 p-6 text-center">
                <div className="text-lg font-medium text-yellow-800">
                  Nie znaleziono wykonawców
                </div>
                <div className="mt-2 text-yellow-700">
                  Spróbuj zmienić kryteria wyszukiwania lub utwórz zlecenie
                </div>
                <button
                  onClick={() => navigate('/create-order')}
                  className="mt-4 rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
                >
                  Utwórz zlecenie
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    data={provider}
                    onCompare={(p) => toggle(p)}
                    isCompared={compareItems.some((p) => p.id === provider.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mapa */}
        {filtered.length > 0 && (
          <div className="mt-8">
            <MapPanel providers={filtered} />
          </div>
        )}

        {/* Porównanie */}
        {compareItems.length > 0 && (
          <CompareBar
            items={compareItems}
            onClear={clear}
          />
        )}

        {/* Jak to działa */}
        <HowItWorks />
      </div>

      {/* Szuflada filtrów — mobile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Zamknij filtry"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <h2 className="text-lg font-semibold text-gray-900">Filtry wyszukiwania</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Zamknij"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <SmartFilters value={filters} onChange={setFilters} variant="drawer" />
            </div>
            <div className="border-t border-gray-200 bg-gray-50 shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-md min-h-[48px]"
              >
                Pokaż wyniki ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}


