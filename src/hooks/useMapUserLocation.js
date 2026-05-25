import { useCallback, useEffect, useRef, useState } from "react";

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
 *   - auto: czy spróbować pobrać GPS przy mount (default true)
 */
export default function useMapUserLocation({ profileCoords = null, auto = true } = {}) {
  const [userLocation, setUserLocation] = useState(null);
  const [permission, setPermission] = useState("idle");
  const usedProfileRef = useRef(false);

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

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission((prev) => (prev === "profile" ? prev : "unavailable"));
      applyProfileFallback();
      return;
    }
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
  }, [applyProfileFallback]);

  useEffect(() => {
    if (!auto) return;
    requestLocation();
  }, [auto, requestLocation]);

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
