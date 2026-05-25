import { useCallback, useEffect, useRef, useState } from "react";
import { queryNativePermission, requestPermission } from "../utils/permissionManager";

/**
 * Stan lokalizacji użytkownika dla map:
 *   - 'idle' początkowy
 *   - 'loading' trwa pobieranie z geolokalizacji
 *   - 'granted' mamy świeży fix z geolokalizacji
 *   - 'profile' używamy fallbacku z profilu / locationCoords (gdy GPS odmówił/brak)
 *   - 'denied' użytkownik odmówił, brak fallbacku
 *   - 'unavailable' przeglądarka bez geolokalizacji / inny błąd
 *
 * userLocation jest obiektem { lat, lng, source: 'gps' | 'profile' | 'fallback' }.
 *
 * Opcje:
 *   - profileCoords: { lat, lng } – fallback z profilu/KYC (gdy brak zgody na GPS)
 *   - auto: czy spróbować pobrać GPS przy mount (default true) — UWAGA: nie wywołuje
 *           natywnego promptu na surowo. Jeśli przeglądarka jeszcze nie zna stanu
 *           uprawnienia ('prompt'/'default'), pokaże nasz SoftAskGeolocation
 *           (poprzez permissionManager). Native prompt odpala się dopiero gdy
 *           user kliknie "Włącz lokalizację" w naszym modalu.
 *   - reason: kontekst dla soft-ask (np. 'find-nearby', 'map-center').
 *   - softAskPriority: priorytet w kolejce (domyślnie 60 dla map).
 */
export default function useMapUserLocation({
  profileCoords = null,
  auto = true,
  reason = "map-center",
  softAskPriority = 60,
} = {}) {
  const [userLocation, setUserLocation] = useState(null);
  const [permission, setPermission] = useState("idle");
  const usedProfileRef = useRef(false);
  const requestInFlightRef = useRef(false);

  const applyProfileFallback = useCallback(() => {
    if (
      profileCoords &&
      Number.isFinite(profileCoords.lat) &&
      Number.isFinite(profileCoords.lng) &&
      !usedProfileRef.current
    ) {
      usedProfileRef.current = true;
      setUserLocation({
        lat: profileCoords.lat,
        lng: profileCoords.lng,
        source: "profile",
      });
      setPermission("profile");
      return true;
    }
    return false;
  }, [profileCoords]);

  /**
   * Główna ścieżka pobierania GPS:
   *  - native już 'granted'  → strzelamy bez modalu (zero tarcia)
   *  - native 'denied'       → fallback profile + setPermission('denied')
   *  - native 'prompt'       → kolejkujemy SoftAskGeolocation; po decyzji
   *                            permissionManager odpala native i zwraca wynik.
   */
  const requestLocation = useCallback(
    async (overrideOptions = {}) => {
      if (requestInFlightRef.current) return;
      requestInFlightRef.current = true;
      try {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setPermission((prev) => (prev === "profile" ? prev : "unavailable"));
          applyProfileFallback();
          return;
        }

        const native = await queryNativePermission("geolocation");
        if (native === "granted") {
          setPermission("loading");
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setUserLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                source: "gps",
              });
              setPermission("granted");
              usedProfileRef.current = false;
            },
            (err) => {
              if (err && err.code === 1) {
                setPermission("denied");
              } else {
                setPermission("unavailable");
              }
              applyProfileFallback();
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
          );
          return;
        }

        if (native === "denied") {
          setPermission("denied");
          applyProfileFallback();
          return;
        }

        // 'prompt' / 'default' / 'unknown' → przez soft-ask.
        setPermission("loading");
        const result = await requestPermission("geolocation", {
          reason: overrideOptions.reason || reason,
          priority:
            typeof overrideOptions.softAskPriority === "number"
              ? overrideOptions.softAskPriority
              : softAskPriority,
        });

        if (result.granted && result.position) {
          setUserLocation({
            lat: result.position.coords.latitude,
            lng: result.position.coords.longitude,
            source: "gps",
          });
          setPermission("granted");
          usedProfileRef.current = false;
          return;
        }

        if (result.reason === "snoozed") {
          // User chwilowo odłożył — nie zmieniaj stanu, tylko fallback.
          setPermission((prev) => (prev === "loading" ? "idle" : prev));
        } else {
          setPermission("denied");
        }
        applyProfileFallback();
      } finally {
        requestInFlightRef.current = false;
      }
    },
    [applyProfileFallback, reason, softAskPriority]
  );

  useEffect(() => {
    if (!auto) return;
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  // Jeśli userLocation nadal jest null, ale dostaliśmy profileCoords po czasie – użyj fallbacku.
  useEffect(() => {
    if (userLocation) return;
    if (permission === "denied" || permission === "unavailable" || permission === "idle") {
      applyProfileFallback();
    }
  }, [userLocation, permission, applyProfileFallback]);

  return {
    userLocation,
    permission,
    requestLocation,
    setUserLocation,
  };
}
