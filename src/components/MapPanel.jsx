
/* global L */
import L from "leaflet"; // <— WAŻNE: jawny import
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  MapInitialRecenter,
  MapLocateControl,
  UserLocationLayer,
} from "./MapUserLocation";
// Wybierz JEDNO z dwóch: ikona wg usługi LUB wg poziomu
import { iconForService, iconForLevel } from "./mapIcons";
import AvailabilityBadge from "./AvailabilityBadge";

function FitBoundsOnDataChange({ providers }) {
  const map = useMap();

  useMemo(() => {
    const pts = (providers || [])
      .filter(p => Array.isArray(p.coords) && p.coords.length === 2 && isFinite(p.coords[0]) && isFinite(p.coords[1]))
      .map(p => [p.coords[0], p.coords[1]]);

    if (!pts.length) return;

    if (pts.length === 1) {
      map.setView(pts[0], Math.max(map.getZoom(), 13));
    } else {
      const bounds = pts.reduce(
        (b, [lat, lng]) => b.extend([lat, lng]),
        L.latLngBounds(pts[0], pts[0])
      );
      map.fitBounds(bounds.pad(0.2));
    }
  }, [providers, map]);

  return null;
}

function providerCoords(p) {
  if (Array.isArray(p.coords) && p.coords.length === 2) {
    const [lat, lng] = p.coords;
    if (isFinite(lat) && isFinite(lng)) return [lat, lng];
  }
  const lat = p.lat ?? p.location?.lat ?? p.locationCoords?.lat;
  const lng = p.lng ?? p.location?.lng ?? p.locationCoords?.lng;
  if (isFinite(lat) && isFinite(lng)) return [lat, lng];
  return null;
}

export default function MapPanel({ providers = [], onQuickView, onCompare, onSelect }) {
  const [onlyNow, setOnlyNow] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const defaultCenter = [52.2297, 21.0122];

  const refreshUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  }, []);

  useEffect(() => {
    refreshUserLocation();
  }, [refreshUserLocation]);
  
  const validProviders = (providers || [])
    .map((p) => {
      const coords = providerCoords(p);
      return coords ? { ...p, coords } : null;
    })
    .filter(Boolean);
  
  // Dodatkowe filtrowanie przez "Dostępni teraz"
  const mapProviders = validProviders.filter(p => 
    !onlyNow || p.provider_status?.isOnline === true
  );
  
  const initialCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : mapProviders[0]?.coords || defaultCenter;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Mapa dostępnych wykonawców</h4>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={onlyNow} 
              onChange={e => setOnlyNow(e.target.checked)}
              className="rounded border-gray-300"
            />
            Dostępni teraz
          </label>
        </div>
        {import.meta.env.DEV && (
          <p className="text-xs text-slate-500">
            {mapProviders.length} wykonawców na mapie
            {validProviders.length !== (providers || []).length
              ? ` (${(providers || []).length - validProviders.length} bez współrzędnych)`
              : ""}
          </p>
        )}
        {validProviders.length === 0 && (
          <p className="text-xs text-amber-700 mb-2">
            Brak wykonawców z lokalizacją na mapie — sprawdź listę powyżej lub poszerz wyszukiwanie.
          </p>
        )}
      </div>

      <div className="h-64 sm:h-72 md:h-80 lg:h-[420px] w-full">
        <MapContainer center={initialCenter} zoom={12} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsOnDataChange providers={mapProviders} />

          <UserLocationLayer userLocation={userLocation} />
          <MapInitialRecenter userLocation={userLocation} />
          <MapLocateControl
            userLocation={userLocation}
            onRequestLocation={refreshUserLocation}
          />

          <MarkerClusterGroup chunkedLoading>
            {mapProviders.map((p) => (
              <Marker
                key={p.id}
                position={[p.coords[0], p.coords[1]]}
                // Wersja A: kolor wg RODZAJU USŁUGI
                icon={iconForService(p.service || "Inne")}
                // Wersja B: kolor wg POZIOMU
                // icon={iconForLevel(p.level)}
                eventHandlers={{
                  click: () => (onSelect || onQuickView)?.(p)
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="text-xs">
                    <div className="font-medium">{p.name}</div>
                    <div>Ocena: {p.rating?.toFixed(1) ?? "—"} / 5</div>
                    <div>Dostępność: {p.provider_status?.isOnline ? "Online" : "Offline"}</div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-600">{p.level} • {p.distanceKm?.toFixed?.(2)} km</div>
                    <div className="text-xs text-gray-600">
                      {p.priceFrom}–{p.priceTo} zł • 
                      <AvailabilityBadge 
                        status={p.provider_status?.status} 
                        nextAvailableAt={p.provider_status?.next_available_at}
                      />
                    </div>
                    <div className="flex gap-1 mt-2">
                      {onQuickView && (
                        <button
                          className="flex-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                          onClick={() => onQuickView(p)}
                        >
                          Podgląd
                        </button>
                      )}
                      {onCompare && (
                        <button
                          className="flex-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                          onClick={() => onCompare(p)}
                        >
                          Porównaj
                        </button>
                      )}
                      <button
                        className="flex-1 rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                        onClick={() => onSelect?.(p)}
                      >
                        Wybierz
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}