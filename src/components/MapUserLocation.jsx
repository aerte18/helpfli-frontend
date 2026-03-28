import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleMarker, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";

/**
 * Niebieska kropka + delikatna poświata (jak „moja lokalizacja” w mapach).
 */
export function UserLocationLayer({ userLocation }) {
  if (userLocation?.lat == null || userLocation?.lng == null) return null;
  const { lat, lng } = userLocation;
  return (
    <>
      <CircleMarker
        center={[lat, lng]}
        radius={22}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.14,
          weight: 0,
        }}
      />
      <CircleMarker
        center={[lat, lng]}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#2563eb",
          fillOpacity: 1,
          weight: 3,
        }}
      />
    </>
  );
}

/**
 * Przy pierwszym uzyskaniu współrzędnych ustawia widok mapy (start był np. domyślny).
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
