import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { UI } from "../i18n/pl_ui";
import AIBar from "../components/AIBar";
import SmartFilters from "../components/SmartFilters";
import ProviderCard from "../components/ProviderCard";
import MapPanel from "../components/MapPanel";
import CompareBar from "../components/CompareBar";
import HowItWorks from "../components/HowItWorks";
import useCompare from "../hooks/useCompare";
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

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Użyj query i service do filtrowania po stronie serwera
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (service) params.append('service', service);
        const API = import.meta.env.VITE_API_URL || '';
        const url = params.toString() ? `${API}/api/providers?${params.toString()}` : `${API}/api/providers`;
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
          {/* Filtry */}
          <div className="lg:col-span-1">
            <SmartFilters value={filters} onChange={setFilters} />
          </div>

          {/* Lista wyników */}
          <div className="lg:col-span-3">
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
      <Footer />
    </div>
  );
}


