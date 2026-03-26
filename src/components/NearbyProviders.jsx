import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from 'react';
import MapView from './MapView';
import { Link } from 'react-router-dom';
import { UI } from "../i18n/pl_ui";
import ServicePicker from './ServicePicker';

export default function NearbyProviders() {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [level, setLevel] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance'); // MVP: domyślne sortowanie
  const [serviceId, setServiceId] = useState('');
  const [availableNow, setAvailableNow] = useState(false); // MVP: nowy filtr
  const [lat, setLat] = useState(null); // MVP: geo search
  const [lng, setLng] = useState(null);
  const [radius, setRadius] = useState(50); // MVP: radius search
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MVP: Pobierz geolokację użytkownika
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        (err) => {
          console.warn('Geolokacja nieudana:', err);
          // Fallback do Warszawy
          setLat(52.2297);
          setLng(21.0122);
        }
      );
    } else {
      // Fallback do Warszawy
      setLat(52.2297);
      setLng(21.0122);
    }
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // MVP: Użyj /api/search z filtrami MVP
      const qs = new URLSearchParams();
      if (serviceId) qs.set("service", serviceId);
      if (lat && lng) {
        qs.set("lat", lat.toString());
        qs.set("lng", lng.toString());
        qs.set("radius", radius.toString());
      } else {
        qs.set("location", "Warszawa"); // fallback
      }
      if (level && level !== 'all') qs.set("level", level);
      if (minRating > 0) qs.set("minRating", minRating.toString());
      if (availableNow) qs.set("availableNow", "true");
      if (sortBy && sortBy !== 'relevance') qs.set("sort", sortBy);
      
      console.log("Fetching providers from API /api/search...", qs.toString());
      const API = import.meta.env.VITE_API_URL || '';
      const response = await fetch(apiUrl(`/api/search?${qs.toString()}`), {
        headers: { "Content-Type": "application/json" }
      });
      console.log("Response status:", response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Fetched providers:", data);
      
      // MVP: Transform data z nowymi polami (etaRange, distance)
      const transformedProviders = (Array.isArray(data?.providers || data?.results) ? (data.providers || data.results) : data || []).map(provider => ({
        _id: provider._id,
        name: provider.name,
        location: provider.location || { lat: provider.lat || 52.2297, lng: provider.lng || 21.0122 },
        level: provider.level || 'standard',
        price: provider.price || 100,
        eta: provider.eta || provider.time || 60, // MVP: ETA w minutach
        time: provider.time || Math.round((provider.eta || 60) / 60), // Legacy: czas w godzinach
        etaRange: provider.etaRange, // MVP: zakres ETA
        distance: provider.distance, // MVP: odległość w km
        averageRating: provider.averageRating || 0,
        ratingCount: provider.ratingCount || 0,
        avatar: provider.avatar,
        matchedServiceName: provider.matchedServiceName,
        provider_status: provider.provider_status || { isOnline: false, availableNow: false }
      }));
      
      console.log("Transformed providers:", transformedProviders);
      setProviders(transformedProviders);
      setFilteredProviders(transformedProviders);
    } catch (error) {
      console.error('Błąd pobierania wykonawców:', error);
      setError(error.message);
      setProviders([]);
      setFilteredProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // MVP: Filter and sort providers (filtrowanie po stronie frontu jako fallback)
  useEffect(() => {
    let results = [...providers];

    // Filtrowanie po stronie frontu (gdy backend nie filtruje)
    if (level && level !== 'all') results = results.filter((p) => p.level === level);
    if (minRating > 0) results = results.filter((p) => p.averageRating >= minRating);
    if (availableNow) results = results.filter((p) => p.provider_status?.availableNow || p.provider_status?.isOnline);

    // Sortowanie po stronie frontu (gdy backend nie sortuje)
    if (sortBy === 'price') {
      results.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'eta') {
      results.sort((a, b) => (a.eta || a.time || 999) - (b.eta || b.time || 999));
    } else if (sortBy === 'rating') {
      results.sort((a, b) => b.averageRating - a.averageRating);
    }

    setFilteredProviders(results);
  }, [providers, level, minRating, sortBy, availableNow]);

  // MVP: Odśwież gdy zmienią się filtry MVP
  useEffect(() => {
    fetchProviders();
  }, [serviceId, level, minRating, availableNow, sortBy, lat, lng, radius]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>Ładowanie wykonawców...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Błąd:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{UI.listTitleNearbyHelp}</h1>

      {/* 🔍 Filtry */}
      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium mb-3 text-blue-800">🔍 Filtry wyszukiwania</h2>
        <div className="flex flex-wrap gap-4">
          <ServicePicker value={serviceId} onChange={setServiceId} />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="">Wszystkie poziomy</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="pro">TOP</option>
          </select>

          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value={0}>Dowolna ocena</option>
            <option value={1}>1+ ★</option>
            <option value={2}>2+ ★</option>
            <option value={3}>3+ ★</option>
            <option value={4}>4+ ★</option>
            <option value={5}>5 ★</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="relevance">Relewancja</option>
            <option value="price">Cena rosnąco</option>
            <option value="eta">ETA rosnąco</option>
            <option value="rating">Ocena malejąco</option>
          </select>

          {/* MVP: Filtr "Dostępny teraz" */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={availableNow}
              onChange={(e) => setAvailableNow(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Dostępny teraz</span>
          </label>
        </div>
        <p className="text-sm text-blue-600 mt-2">Filtry są aktywne - {filteredProviders.length} wyników</p>
      </div>

      {/* Lista + Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-2">{filteredProviders.length} specjalistów znaleziono</h2>
          <ul className="space-y-4">
  {filteredProviders.map((p) => (
    <Link
      to={`/provider/${p._id}`}
      key={p._id}
      className="block p-4 bg-white rounded shadow hover:bg-gray-50 transition"
    >
      <li className="flex justify-between items-center cursor-pointer">
        <div className="flex items-center space-x-4">
          <img
            src={p.avatar || 'https://via.placeholder.com/48'}
            alt={p.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-gray-600">
              {p.matchedServiceName || 'Usługa'} • Poziom: <span className="uppercase font-medium">{p.level}</span>
            </p>
            <p className="text-sm text-yellow-500">★ {p.averageRating || 0} ({p.ratingCount || 0})</p>
            {/* MVP: ETA i odległość */}
            {p.eta && (
              <p className="text-xs text-blue-600 mt-1">
                ⏱️ ETA: {p.eta} min{p.etaRange ? ` (${p.etaRange.min}-${p.etaRange.max})` : ''}
              </p>
            )}
            {p.distance && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {p.distance.toFixed(1)} km
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-violet-700 font-bold text-lg">{p.price} zł</p>
          <p className="text-xs text-gray-500">
            {p.eta ? `~ ${p.eta} min` : p.time ? `~ ${p.time} h` : '-'}
          </p>
          {/* MVP: Badge "Dostępny teraz" */}
          {p.provider_status?.availableNow && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              ✓ Teraz
            </span>
          )}
        </div>
      </li>
    </Link>
  ))}
</ul>
        </div>
        <div>
          <h2 className="text-lg font-medium mb-2">{UI.listTitleNearbyHelp}</h2>
          <MapView providers={filteredProviders} />
        </div>
      </div>
    </div>
  );
}