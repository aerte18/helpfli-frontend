import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { LocateFixed, Search } from "lucide-react";

/**
 * Niebieska kropka + delikatna poświata (jak „moja lokalizacja” w mapach).
 *
 * Akceptuje source: 'gps' | 'profile' | 'fallback' (lub undefined).
 * Dla 'profile' rysujemy lżejszy ring – sygnalizuje, że pozycja pochodzi z profilu, nie z GPS.
 */
export function UserLocationLayer({ userLocation }) {
  if (userLocation?.lat == null || userLocation?.lng == null) return null;
  const { lat, lng, source } = userLocation;
  const isApproximate = source === "profile" || source === "fallback";
  const tooltipText = isApproximate
    ? "Twoja przybliżona lokalizacja (z profilu)"
    : "Twoja lokalizacja";

  return (
    <>
      <CircleMarker
        center={[lat, lng]}
        radius={22}
        pathOptions={{
          color: isApproximate ? "#94a3b8" : "#3b82f6",
          fillColor: isApproximate ? "#94a3b8" : "#3b82f6",
          fillOpacity: 0.14,
          weight: 0,
        }}
      />
      <CircleMarker
        center={[lat, lng]}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          fillColor: isApproximate ? "#475569" : "#2563eb",
          fillOpacity: 1,
          weight: 3,
        }}
        pane="markerPane"
      >
        <title>{tooltipText}</title>
      </CircleMarker>
    </>
  );
}

/**
 * Przy pierwszym uzyskaniu współrzędnych ustawia widok mapy (start był np. domyślny).
 * Działa raz – żeby nie „walczyć” z użytkownikiem, który zaraz potem przesunie mapę.
 */
export function MapInitialRecenter({ userLocation }) {
  const map = useMap();
  const did = useRef(false);
  useEffect(() => {
    if (did.current || userLocation?.lat == null || userLocation?.lng == null) return;
    map.setView([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 12), {
      animate: true,
    });
    did.current = true;
  }, [userLocation, map]);
  return null;
}

/**
 * Przycisk w rogu mapy: centruje na użytkowniku; jeśli brak fixa — woła onRequestLocation (np. getCurrentPosition).
 */
export function MapLocateControl({ userLocation, onRequestLocation }) {
  const map = useMap();
  const [host, setHost] = useState(null);
  const pendingFly = useRef(false);

  useEffect(() => {
    const wrap = document.createElement("div");
    wrap.className = "qs-map-locate-control";
    wrap.style.cssText =
      "position:absolute;bottom:16px;right:16px;z-index:1000;pointer-events:auto";
    const container = map.getContainer();
    container.appendChild(wrap);
    setHost(wrap);
    return () => {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
  }, [map]);

  useEffect(() => {
    if (!pendingFly.current || userLocation?.lat == null || userLocation?.lng == null) return;
    map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 13), {
      duration: 0.75,
    });
    pendingFly.current = false;
  }, [userLocation, map]);

  const handleClick = () => {
    if (userLocation?.lat != null && userLocation?.lng != null) {
      map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 13), {
        duration: 0.75,
      });
      return;
    }
    pendingFly.current = true;
    onRequestLocation?.();
  };

  if (!host) return null;

  return createPortal(
    <button
      type="button"
      onClick={handleClick}
      title="Moja lokalizacja"
      aria-label="Pokaż moją lokalizację na mapie"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200/90 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
    >
      <LocateFixed className="w-5 h-5" strokeWidth={2.25} aria-hidden />
    </button>,
    host
  );
}

/**
 * Śledzi pan/zoom mapy i woła onViewportChange z aktualnym bboxem.
 * Wewnątrz <MapContainer>. Pierwsze wywołanie odpala się po `whenReady`.
 *
 * onViewportChange({ bbox: "swLat,swLng,neLat,neLng", center: [lat,lng], zoom, isUserInteraction })
 */
export function MapViewportTracker({ onViewportChange, debounceMs = 350 }) {
  const timerRef = useRef(null);
  const lastUserActionRef = useRef(false);

  const emit = (map, isUserInteraction) => {
    if (!onViewportChange) return;
    const b = map.getBounds();
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    const c = map.getCenter();
    const bboxStr = `${sw.lat.toFixed(6)},${sw.lng.toFixed(6)},${ne.lat.toFixed(6)},${ne.lng.toFixed(6)}`;
    onViewportChange({
      bbox: bboxStr,
      bounds: { swLat: sw.lat, swLng: sw.lng, neLat: ne.lat, neLng: ne.lng },
      center: [c.lat, c.lng],
      zoom: map.getZoom(),
      isUserInteraction: !!isUserInteraction,
    });
  };

  const map = useMapEvents({
    dragstart() {
      lastUserActionRef.current = true;
    },
    zoomstart(e) {
      // Zoom z kółka/przycisku liczymy jako akcję usera; programowe setView – nie.
      if (e?.originalEvent || e?.target?._zoomToggled) {
        lastUserActionRef.current = true;
      }
    },
    moveend() {
      const wasUser = lastUserActionRef.current;
      lastUserActionRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => emit(map, wasUser), debounceMs);
    },
  });

  // pierwszy strzał po zamontowaniu
  useEffect(() => {
    const t = setTimeout(() => emit(map, false), 30);
    return () => {
      clearTimeout(t);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

/**
 * Pływający przycisk u góry mapy: „Szukaj w tym obszarze".
 * Sterowanie z parenta – pokazujemy, gdy `visible` === true.
 */
export function SearchThisAreaButton({ visible, loading, onClick, label }) {
  const map = useMap();
  const [host, setHost] = useState(null);

  useEffect(() => {
    const wrap = document.createElement("div");
    wrap.className = "qs-map-search-area-control";
    wrap.style.cssText =
      "position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:1000;pointer-events:auto";
    const container = map.getContainer();
    container.appendChild(wrap);
    setHost(wrap);
    return () => {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
  }, [map]);

  if (!host || !visible) return null;

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-indigo-700/20 hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-70 disabled:cursor-wait"
      aria-label={label || "Szukaj w tym obszarze"}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
      ) : (
        <Search className="h-4 w-4" aria-hidden />
      )}
      <span>{label || "Szukaj w tym obszarze"}</span>
    </button>,
    host
  );
}
