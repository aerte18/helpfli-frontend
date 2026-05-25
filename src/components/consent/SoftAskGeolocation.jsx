import { useState } from "react";
import { MapPin } from "lucide-react";
import SoftAskCard from "./SoftAskCard";
import { nativeRequestGeolocation, resolveCurrent } from "../../utils/permissionManager";

const REASON_DESCRIPTIONS = {
  "find-nearby": "Pokażemy wykonawców w Twojej okolicy, posortowanych po odległości i czasie dojazdu (ETA).",
  "create-order": "Wstępnie wypełnimy adres zlecenia — możesz go potem zmienić.",
  "map-center": "Wycentrujemy mapę na Twojej pozycji, żebyś od razu widział co jest najbliżej.",
  "ai-context": "Asystent AI dopasuje wskazówki i widełki cen do Twojego regionu.",
};

export default function SoftAskGeolocation({ request }) {
  const [loading, setLoading] = useState(false);
  const desc =
    REASON_DESCRIPTIONS[request?.reason] ||
    "Aby pokazać Ci najlepsze wyniki, potrzebujemy zgody na dostęp do Twojej lokalizacji.";

  const handleAccept = async () => {
    setLoading(true);
    const result = await nativeRequestGeolocation();
    setLoading(false);
    resolveCurrent("accept", result);
  };

  const handleSnooze = () => {
    resolveCurrent("snooze");
  };

  return (
    <SoftAskCard
      icon={MapPin}
      title="Udostępnij lokalizację"
      description={`${desc} Twoje współrzędne nie są zapisywane na serwerze bez Twojej akcji.`}
      primaryLabel="Włącz lokalizację"
      onPrimary={handleAccept}
      secondaryLabel="Nie teraz"
      onSecondary={handleSnooze}
      onDismiss={handleSnooze}
      loading={loading}
    />
  );
}
