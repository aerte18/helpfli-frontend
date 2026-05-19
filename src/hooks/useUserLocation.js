import { useCallback, useState } from "react";

async function reverseGeocodeLatLng(lat, lng) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
    { headers: { "Accept-Language": "pl" } }
  );
  const data = await response.json();
  if (!data || data.error) return null;
  if (typeof data.display_name === "string" && data.display_name.trim()) {
    return data.display_name.trim();
  }
  const a = data.address || {};
  const city = a.city || a.town || a.village || a.suburb || a.municipality;
  const district = a.suburb || a.city_district || a.quarter;
  if (city && district && district !== city) return `${city} ${district}`;
  return city || null;
}

/**
 * Pobiera pozycję użytkownika (GPS) i opcjonalnie etykietę adresu (Nominatim).
 */
export default function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Przeglądarka nie obsługuje geolokalizacji.");
      return Promise.resolve(null);
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let text = null;
          try {
            text = await reverseGeocodeLatLng(lat, lng);
          } catch {
            text = null;
          }
          const next = {
            lat,
            lng,
            text: text || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          };
          setLocation(next);
          setLoading(false);
          resolve(next);
        },
        (err) => {
          const msg =
            err.code === 1
              ? "Brak zgody na lokalizację — włącz ją w ustawieniach przeglądarki."
              : "Nie udało się ustalić Twojej pozycji.";
          setError(msg);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
      );
    });
  }, []);

  return { location, loading, error, refresh, setLocation };
}

export function wantsDeviceLocation(text = "") {
  return /aktualn(a|ej|ą)\s+lokalizac|moj[aą]\s+lokalizac|użyj\s+(gps|geolokaliz)|z\s+gps|pozycj[aę]\s+gps/i.test(text);
}
