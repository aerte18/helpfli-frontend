import { useState } from "react";
import { Bell } from "lucide-react";
import SoftAskCard from "./SoftAskCard";
import { nativeRequestNotifications, resolveCurrent } from "../../utils/permissionManager";

const REASON_DESCRIPTIONS = {
  "new-offer": "Otrzymasz powiadomienie, gdy ktoś odpowie na Twoje zlecenie — nawet gdy nie masz otwartej karty.",
  "order-update": "Powiadomimy Cię o zmianach statusu zlecenia (akceptacja, anulowanie, ukończenie).",
  "chat-message": "Dostaniesz sygnał o nowej wiadomości od wykonawcy/klienta w czacie zlecenia.",
  "provider-leads": "Otrzymasz powiadomienie o nowych zleceniach w Twojej kategorii i okolicy.",
};

export default function SoftAskNotifications({ request }) {
  const [loading, setLoading] = useState(false);
  const desc =
    REASON_DESCRIPTIONS[request?.reason] ||
    "Otrzymuj powiadomienia o ważnych zdarzeniach (nowe oferty, wiadomości, statusy zleceń).";

  const handleAccept = async () => {
    setLoading(true);
    const result = await nativeRequestNotifications();
    setLoading(false);
    resolveCurrent("accept", result);
  };

  const handleSnooze = () => {
    resolveCurrent("snooze");
  };

  return (
    <SoftAskCard
      icon={Bell}
      title="Włącz powiadomienia"
      description={`${desc} Możesz je wyłączyć w każdej chwili w ustawieniach konta.`}
      primaryLabel="Włącz powiadomienia"
      onPrimary={handleAccept}
      secondaryLabel="Może później"
      onSecondary={handleSnooze}
      onDismiss={handleSnooze}
      loading={loading}
    />
  );
}
