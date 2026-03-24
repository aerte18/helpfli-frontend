import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Definicje niestandardowych ikon - używamy prostych kolorowych div-ów
const createCustomIcon = (color) => {
  console.log('Creating custom icon with color:', color);
  console.log('L.divIcon available:', typeof L.divIcon);
  
  if (typeof L.divIcon !== 'function') {
    console.error('L.divIcon is not available!');
    return null;
  }
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
    ">●</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const onlineIcon = createCustomIcon('#22c55e'); // zielony
const busyIcon = createCustomIcon('#eab308');   // żółty
const offlineIcon = createCustomIcon('#ef4444'); // czerwony

// Fix ikon Leaflet w Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView({ providers }) {
  useEffect(() => {
    console.log('MapView received providers:', providers);
    
    // Sprawdź dane providerów
    providers.forEach((provider, index) => {
      const coords = getProviderCoords(provider);
      if (!coords) {
        console.warn(`Provider ${index} (${provider.name}) ma nieprawidłowe dane lokalizacji:`, provider);
      }
    });
  }, [providers]);

  // Helper function to get coordinates from different data structures
  const getProviderCoords = (provider) => {
    // Struktura z Home.jsx: coords: [lat, lng]
    if (provider.coords && Array.isArray(provider.coords) && provider.coords.length === 2) {
      return { lat: provider.coords[0], lng: provider.coords[1] };
    }
    // Struktura z NearbyProviders: location: {lat, lng}
    if (provider.location && provider.location.lat && provider.location.lng) {
      return { lat: provider.location.lat, lng: provider.location.lng };
    }
    // Struktura z lat/lng bezpośrednio
    if (provider.lat && provider.lng) {
      return { lat: provider.lat, lng: provider.lng };
    }
    return null;
  };

  // Oblicz center mapy na podstawie wszystkich providerów
  const validProviders = providers.filter(p => getProviderCoords(p));
  
  let center = [52.2297, 21.0122]; // Domyślne centrum - Warszawa
  
  if (validProviders.length > 0) {
    const totalLat = validProviders.reduce((sum, p) => {
      const coords = getProviderCoords(p);
      return sum + coords.lat;
    }, 0);
    const totalLng = validProviders.reduce((sum, p) => {
      const coords = getProviderCoords(p);
      return sum + coords.lng;
    }, 0);
    center = [totalLat / validProviders.length, totalLng / validProviders.length];
  }

  console.log('Map center:', center);
  console.log('Valid providers for markers:', validProviders.length);

  return (
    <div className="w-full h-64 sm:h-72 md:h-80 lg:h-[500px] rounded overflow-hidden shadow">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validProviders.map((provider) => {
          const coords = getProviderCoords(provider);
          
          // Wybierz ikonę na podstawie statusu
          let icon;
          let status = "unknown";
          if (provider.online === true) {
            icon = onlineIcon;
            status = "online";
          } else if (provider.online === false) {
            icon = offlineIcon;
            status = "offline";
          } else {
            icon = busyIcon;
            status = "busy";
          }
          
          console.log(`Provider ${provider.name}: status=${status}, coords=[${coords.lat}, ${coords.lng}], icon=${icon ? 'custom' : 'default'}, iconType=${icon?.constructor?.name || 'unknown'}`);
          
          return (
            <Marker
              key={provider._id || provider.id}
              position={[coords.lat, coords.lng]}
              icon={icon}
            >
              <Popup>
                <div className="text-center">
                  <strong className="text-lg">{provider.name}</strong>
                  <br />
                  <span className="text-sm text-gray-600">Poziom: {provider.level}</span>
                  <br />
                  <span className="text-sm text-green-600">
                    ₣{provider.price || provider.priceFrom || 0}
                  </span>
                  <br />
                  <span className="text-sm text-blue-600">
                    ~{provider.time || provider.eta || 0}h
                  </span>
                  <br />
                  <span className="text-sm text-yellow-500">
                    ★ {provider.averageRating || provider.rating || 0} ({provider.ratingCount || 0})
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}