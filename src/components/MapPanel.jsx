
/* global L */
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  MapInitialRecenter,
  MapLocateControl,
  MapViewportTracker,
  SearchThisAreaButton,
  UserLocationLayer,
} from "./MapUserLocation";
import { iconForService } from "./mapIcons";
import AvailabilityBadge from "./AvailabilityBadge";
import useMapUserLocation from "../hooks/useMapUserLocation";

/**
 * Robi jednorazowy fit-to-bounds przy pierwszym pojawieniu się providerów,
 * a potem zostawia widok użytkownikowi (żeby nie nadpisywać pan/zoom przy każdej
 * zmianie wyników z „Szukaj w tym obszarze”).
 *
 * `signal` — gdy się zmieni, fit-bounds zostanie ponownie wymuszony (np. po
 * zmianie zapytania, kategorii itd.).
 */
function FitBoundsOnce({ providers, signal }) {
  const map = useMap();
  const didInitial = useRef(false);
  const lastSignal = useRef(signal);

  useEffect(() => {
    if (signal !== lastSignal.current) {
      didInitial.current = false;
      lastSignal.current = signal;
    }
    if (didInitial.current) return;

    const pts = (providers || [])
      .filter(
        (p) =>
          Array.isArray(p.coords) &&
          p.coords.length === 2 &&
          isFinite(p.coords[0]) &&
          isFinite(p.coords[1])
      )
      .map((p) => [p.coords[0], p.coords[1]]);

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
    didInitial.current = true;
  }, [providers, signal, map]);

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

/**
 * MapPanel — mapa wykonawców z obsługą „Przeszukaj ten obszar".
 *
 * Props:
 *  - providers: aktualnie pokazywani wykonawcy (z lat/lng)
 *  - onSelect / onQuickView / onCompare: akcje po kliknięciu w pin/popup
 *  - profileCoords: { lat, lng } – fallback gdy GPS odmówi
 *  - onViewportSearch(vp): wywołane przy „Przeszukaj ten obszar” lub auto-fetch
 *      vp = { bbox: "swLat,swLng,neLat,neLng", bounds, center: [lat,lng], zoom, isUserInteraction }
 *  - loading: spinner na przycisku „Szukaj tutaj”
 *  - resetFitSignal: wymusza ponowny fit-to-bounds (np. zmiana zapytania)
 */
export default function MapPanel({
  providers = [],
  onQuickView,
  onCompare,
  onSelect,
  profileCoords = null,
  onViewportSearch,
  loading = false,
  resetFitSignal = 0,
}) {
  const [autoSearch, setAutoSearch] = useState(false);
  const [pendingViewport, setPendingViewport] = useState(null);
  const [lastFetchedViewport, setLastFetchedViewport] = useState(null);
  const autoDebounceRef = useRef(null);
  const defaultCenter = [52.2297, 21.0122];

  const { userLocation, permission, requestLocation } = useMapUserLocation({
    profileCoords,
  });

  const validProviders = (providers || [])
    .map((p) => {
      const coords = providerCoords(p);
      return coords ? { ...p, coords } : null;
    })
    .filter(Boolean);

  const mapProviders = validProviders;

  const initialCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : mapProviders[0]?.coords || defaultCenter;

  const handleViewportChange = useCallback(
    (vp) => {
      setPendingViewport(vp);
      // Pierwszy viewport — od razu uznajemy go za „zafetchowany” (lista przyszła z innego źródła).
      setLastFetchedViewport((prev) => prev || vp);

      if (!vp.isUserInteraction) return;
      if (!autoSearch || !onViewportSearch) return;
      if (autoDebounceRef.current) clearTimeout(autoDebounceRef.current);
      autoDebounceRef.current = setTimeout(() => {
        onViewportSearch(vp);
        setLastFetchedViewport(vp);
      }, 650);
    },
    [autoSearch, onViewportSearch]
  );

  useEffect(
    () => () => {
      if (autoDebounceRef.current) clearTimeout(autoDebounceRef.current);
    },
    []
  );

  const showSearchHereBtn = useMemo(() => {
    if (!pendingViewport || !lastFetchedViewport) return false;
    if (pendingViewport === lastFetchedViewport) return false;
    if (pendingViewport.zoom !== lastFetchedViewport.zoom) return true;
    const dLat = Math.abs(pendingViewport.center[0] - lastFetchedViewport.center[0]);
    const dLng = Math.abs(pendingViewport.center[1] - lastFetchedViewport.center[1]);
    const spanLat = Math.abs(pendingViewport.bounds.neLat - pendingViewport.bounds.swLat);
    const spanLng = Math.abs(pendingViewport.bounds.neLng - pendingViewport.bounds.swLng);
    return dLat > spanLat * 0.2 || dLng > spanLng * 0.2;
  }, [pendingViewport, lastFetchedViewport]);

  const handleSearchThisArea = useCallback(() => {
    if (!pendingViewport || !onViewportSearch) return;
    onViewportSearch(pendingViewport);
    setLastFetchedViewport(pendingViewport);
  }, [pendingViewport, onViewportSearch]);

  const permissionHint = (() => {
    if (permission === "denied") {
      return "Lokalizacja zablokowana — włącz ją w pasku adresu, żeby zobaczyć siebie na mapie.";
    }
    if (permission === "unavailable") {
      return "Nie udało się ustalić lokalizacji — pokazujemy widok ogólny.";
    }
    return null;
  })();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 className="font-semibold">Mapa dostępnych wykonawców</h4>
          <div className="flex items-center gap-3 text-sm">
            <label
              className="inline-flex select-none items-center gap-1.5 text-[12px] font-medium text-slate-700"
              title="Szukaj automatycznie po przesunięciu mapy"
            >
              <input
                type="checkbox"
                checked={autoSearch}
                onChange={(e) => setAutoSearch(e.target.checked)}
                className="h-3.5 w-3.5 accent-indigo-600"
              />
              Auto-szukaj po przesunięciu
            </label>
          </div>
        </div>

        {permissionHint && (
          <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>{permissionHint}</span>
            <button
              type="button"
              onClick={requestLocation}
              className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

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
            Brak wykonawców z lokalizacją na mapie — przesuń mapę i wciśnij „Przeszukaj ten obszar”.
          </p>
        )}
      </div>

      <div className="relative h-64 sm:h-72 md:h-80 lg:h-[420px] w-full">
        <MapContainer
          center={initialCenter}
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsOnce providers={mapProviders} signal={resetFitSignal} />

          <UserLocationLayer userLocation={userLocation} />
          <MapInitialRecenter userLocation={userLocation} />
          <MapLocateControl
            userLocation={userLocation}
            onRequestLocation={requestLocation}
          />

          <MapViewportTracker onViewportChange={handleViewportChange} />
          <SearchThisAreaButton
            visible={showSearchHereBtn && !autoSearch}
            loading={loading}
            onClick={handleSearchThisArea}
            label="Przeszukaj ten obszar"
          />

          <MarkerClusterGroup chunkedLoading>
            {mapProviders.map((p) => (
              <Marker
                key={p.id}
                position={[p.coords[0], p.coords[1]]}
                icon={iconForService(p.service || "Inne")}
                eventHandlers={{
                  click: () => (onSelect || onQuickView)?.(p),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="text-xs">
                    <div className="font-medium">{p.name}</div>
                    <div>Ocena: {p.rating?.toFixed?.(1) ?? "—"} / 5</div>
                    <div>
                      Dostępność: {p.provider_status?.isOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-600">
                      {p.level} • {p.distanceKm?.toFixed?.(2)} km
                    </div>
                    <div className="text-xs text-gray-600">
                      {p.priceFrom}–{p.priceTo} zł •{" "}
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
