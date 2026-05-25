import { useEffect, useState } from "react";
import { hasAnsweredConsent } from "../../utils/consent";
import { setConsentGate, subscribe } from "../../utils/permissionManager";
import ConsentBanner from "./ConsentBanner";
import SoftAskGeolocation from "./SoftAskGeolocation";
import SoftAskNotifications from "./SoftAskNotifications";

/**
 * Globalny "dyrygent" wszystkich popupów zgodowych w aplikacji.
 *
 * Reguły:
 *  1. Banner cookies (RODO) ma absolutny priorytet — żadne soft-asks nie pojawią
 *     się dopóki user nie zdecyduje o cookies (gate w permissionManager).
 *  2. Po zapisaniu zgód cookies — kolejka soft-asks (geo, push, ...) jest
 *     procesowana JEDEN NA RAZ, w kolejności priorytetu.
 *  3. Między popupami 400ms odstępu (UX, nie skacze).
 *  4. Snooze ("Nie teraz") wycisza dany typ na 24h.
 *
 * Wzorzec używany przez Stripe, Airbnb, Notion, Slack.
 */
export default function PermissionQueueManager() {
  const [current, setCurrent] = useState(null);

  // Bramkujemy soft-asks: dopóki nie ma zgody na cookies, manager nie pokazuje innych.
  useEffect(() => {
    setConsentGate(() => hasAnsweredConsent());

    const onConsentChanged = () => {
      // Re-set gate, żeby pociągnąć kolejkę po decyzji o cookies.
      setConsentGate(() => hasAnsweredConsent());
    };
    window.addEventListener("qs-consent-changed", onConsentChanged);
    return () => {
      window.removeEventListener("qs-consent-changed", onConsentChanged);
      setConsentGate(null);
    };
  }, []);

  // Subskrybuj kolejkę uprawnień.
  useEffect(() => {
    return subscribe((state) => {
      setCurrent(state.current);
    });
  }, []);

  return (
    <>
      {/* ConsentBanner zawsze zamontowany:
          - renderuje siebie tylko gdy user nie odpowiedział na cookies,
          - nasłuchuje 'qs-open-privacy-settings' (z Footera). */}
      <ConsentBanner />

      {/* Soft-ask z kolejki (gate zapewnia że nie pokażą się przed cookies). */}
      {current?.type === "geolocation" && <SoftAskGeolocation request={current} />}
      {current?.type === "notifications" && <SoftAskNotifications request={current} />}
    </>
  );
}
