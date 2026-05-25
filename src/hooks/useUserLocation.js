import { useCallback, useState } from "react";
import { queryNativePermission, requestPermission } from "../utils/permissionManager";

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

function geolocateOnce(opts = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000, ...opts }
    );
  });
}

/**
 * Pobiera pozycję użytkownika (GPS) i opcjonalnie etykietę adresu (Nominatim).
 *
 * Implementacja przechodzi przez permissionManager:
 *  - jeśli native już 'granted' → bez modalu
 *  - jeśli 'prompt' → pokazuje SoftAskGeolocation, native odpala się po zgodzie
 *  - jeśli 'denied' / snooze → zwraca null bez popupu
 */
export default function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (options = {}) => {
    if (!navigator.geolocation) {
      setError("Przeglądarka nie obsługuje geolokalizacji.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const native = await queryNativePermission("geolocation");

      let pos = null;
      if (native === "granted") {
        try {
          pos = await geolocateOnce();
        } catch (err) {
          setError(
            err.code === 1
              ? "Brak zgody na lokalizację — włącz ją w ustawieniach przeglądarki."
              : "Nie udało się ustalić Twojej pozycji."
          );
          return null;
        }
      } else if (native === "denied") {
        setError("Brak zgody na lokalizację — włącz ją w ustawieniach przeglądarki.");
        return null;
      } else {
        const result = await requestPermission("geolocation", {
          reason: options.reason || "ai-context",
          priority: typeof options.priority === "number" ? options.priority : 55,
        });
        if (!result.granted) {
          if (result.reason !== "snoozed") {
            setError("Brak zgody na lokalizację.");
          }
          return null;
        }
        pos = result.position;
      }

      if (!pos) return null;

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
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, refresh, setLocation };
}

export function wantsDeviceLocation(text = "") {
  return /aktualn(a|ej|ą)\s+lokalizac|moj[aą]\s+lokalizac|użyj\s+(gps|geolokaliz)|z\s+gps|pozycj[aę]\s+gps/i.test(text);
}
