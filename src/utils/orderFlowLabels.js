export function getClientOrderPresentation(order) {
  const status = order?.status;
  const orderId = order?._id || order?.id || "";
  const isExternalPayment =
    order?.paymentMethod === "external" || order?.paymentPreference === "external";
  const platformFee = Number(order?.pricing?.platformFee || 0);
  const externalCommissionPaid = order?.externalCommissionStatus === "succeeded";
  const isOffersOnly = order?.orderMode === "offers_only";
  const contactUnlocked = ["succeeded", "waived"].includes(order?.contactUnlockStatus);
  const systemPaid =
    order?.paymentStatus === "succeeded" || order?.paidInSystem || order?.status === "funded";
  const needsExternalCommission = isExternalPayment && platformFee > 0 && !externalCommissionPaid;
  const needsContactUnlock = isOffersOnly && !contactUnlocked;
  const needsSystemPayment = !isExternalPayment && status === "accepted" && !systemPaid;

  if (["open", "draft", "quote", "matched"].includes(status)) {
    return {
      label: "Otwarte",
      badgeClass: "bg-blue-100 text-blue-800",
      stageDescription: "Otwarte - zlecenie oczekuje na oferty od wykonawców",
      nextStepLabel: "Wybierz ofertę",
      nextStepHint: "Przejdź do ofert i zaakceptuj najlepszą propozycję.",
      nextStepCta: "Przejdź do ofert",
      nextStepHref: `/orders/${orderId}?tab=offers`,
      tone: "blue",
    };
  }
  if (status === "collecting_offers") {
    const count = order?.offers?.length || 0;
    return {
      label: "Oferty złożone",
      badgeClass: "bg-indigo-100 text-indigo-800",
      stageDescription: `Oferty złożone - otrzymano ${count} ${count === 1 ? "oferta" : count < 5 ? "oferty" : "ofert"}, wybierz najlepszą`,
      nextStepLabel: "Wybierz ofertę",
      nextStepHint: "Masz oferty - zaakceptuj i przejdź do płatności.",
      nextStepCta: "Przejdź do ofert",
      nextStepHref: `/orders/${orderId}?tab=offers`,
      tone: "blue",
    };
  }
  if (status === "accepted") {
    if (needsSystemPayment) {
      return {
        label: "Oczekuje na płatność",
        badgeClass: "bg-orange-100 text-orange-800",
        stageDescription: "Oferta zaakceptowana - oczekuje na płatność",
        nextStepLabel: "Opłać teraz",
        nextStepHint: "Bez płatności wykonawca nie rozpocznie pracy.",
        nextStepCta: "Przejdź do płatności",
        nextStepHref: `/checkout/${orderId}`,
        tone: "amber",
      };
    }
    if (needsContactUnlock) {
      return {
        label: "Odblokuj kontakt",
        badgeClass: "bg-amber-100 text-amber-800",
        stageDescription: "Oferta zaakceptowana - odblokuj kontakt do wybranego wykonawcy",
        nextStepLabel: "Odblokuj kontakt",
        nextStepHint: "Po odblokowaniu kontaktu wykonawca będzie mógł rozpocząć realizację poza Helpfli.",
        nextStepCta: "Dokończ odblokowanie",
        nextStepHref: `/orders/${orderId}?tab=details`,
        tone: "amber",
      };
    }
    if (needsExternalCommission) {
      return {
        label: "Oczekuje na działanie klienta",
        badgeClass: "bg-amber-100 text-amber-800",
        stageDescription: "Oferta zaakceptowana - wymagane działanie klienta przed rozpoczęciem realizacji",
        nextStepLabel: "Dokończ formalności",
        nextStepHint: "Po wykonaniu działania przez klienta realizacja zostanie odblokowana.",
        nextStepCta: "Przejdź do płatności",
        nextStepHref: `/orders/${orderId}?tab=details`,
        tone: "amber",
      };
    }
    return {
      label: "Oczekuje na realizację",
      badgeClass: "bg-emerald-100 text-emerald-800",
      stageDescription: "Oferta zaakceptowana - wykonawca może rozpocząć pracę",
      nextStepLabel: "Oczekuje na realizację",
      nextStepHint: "Płatność gotowa, wykonawca może rozpocząć zlecenie.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${orderId}?tab=details`,
      tone: "emerald",
    };
  }
  if (status === "awaiting_payment") {
    return {
      label: "Oczekuje na płatność",
      badgeClass: "bg-orange-100 text-orange-800",
      stageDescription: "Oferta zaakceptowana - oczekuje na płatność",
      nextStepLabel: "Opłać teraz",
      nextStepHint: "Dokończ płatność, aby wykonawca mógł rozpocząć pracę.",
      nextStepCta: "Przejdź do płatności",
      nextStepHref: `/checkout/${orderId}`,
      tone: "amber",
    };
  }
  if (status === "funded" || status === "paid") {
    return {
      label: "Oczekuje na realizację",
      badgeClass: "bg-green-100 text-green-800",
      stageDescription: "Opłacone - środki zabezpieczone w systemie",
      nextStepLabel: "Oczekuje na realizację",
      nextStepHint: "Wykonawca może teraz rozpocząć pracę.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${orderId}?tab=details`,
      tone: "emerald",
    };
  }
  if (status === "in_progress") {
    return {
      label: "W realizacji",
      badgeClass: "bg-purple-100 text-purple-800",
      stageDescription: "W realizacji - wykonawca pracuje nad zleceniem",
      nextStepLabel: "Monitoruj realizację",
      nextStepHint: "Utrzymuj kontakt z wykonawcą na czacie.",
      nextStepCta: "Czat",
      nextStepHref: `/orders/${orderId}?tab=chat`,
      tone: "purple",
    };
  }
  if (status === "completed") {
    return {
      label: "Do potwierdzenia",
      badgeClass: "bg-emerald-100 text-emerald-800",
      stageDescription: "Wykonawca zakończył — potwierdź odbiór i oceń",
      nextStepLabel: "Potwierdź odbiór",
      nextStepHint: isExternalPayment
        ? "Na dole strony (Szczegóły) użyj zielonego przycisku „Potwierdź odbiór realizacji”, potem możesz dodać opinię."
        : "Na dole strony (Szczegóły) potwierdź odbiór — wtedy domykamy rozliczenie w systemie. Następnie oceń wykonawcę.",
      nextStepCta: "Przejdź do szczegółów",
      nextStepHref: `/orders/${orderId}?tab=details`,
      tone: "green",
    };
  }
  if (status === "releasing") {
    return {
      label: "Rozliczenie w toku",
      badgeClass: "bg-sky-100 text-sky-800",
      stageDescription: "Potwierdzenie zostało przyjęte - trwa bezpieczne domykanie rozliczenia",
      nextStepLabel: "Poczekaj na rozliczenie",
      nextStepHint: "Nie ponawiaj płatności. Status odświeży się po zakończeniu operacji.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${orderId}?tab=details`,
      tone: "blue",
    };
  }
  if (status === "released" || status === "rated" || status === "done") {
    return {
      label: "Zakończone",
      badgeClass: "bg-green-100 text-green-800",
      stageDescription: "Zakończone - wszystko gotowe",
      nextStepLabel: "Archiwum",
      nextStepHint: "Zlecenie zostało zamknięte.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${orderId}?tab=details`,
      tone: "green",
    };
  }
  if (status === "cancelled") {
    return {
      label: "Anulowane",
      badgeClass: "bg-red-100 text-red-800",
      stageDescription: "Zlecenie zostało anulowane",
      nextStepLabel: "Zlecenie zamknięte",
      nextStepHint: "To zlecenie jest zamknięte.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${orderId}?tab=details`,
      tone: "red",
    };
  }
  if (status === "disputed") {
    return {
      label: "Spór w toku",
      badgeClass: "bg-amber-100 text-amber-900",
      stageDescription: "Zgłoszono spór - sprawa oczekuje na rozwiązanie",
      nextStepLabel: "Przejdź do sprawy",
      nextStepHint: "Odpowiadaj w sprawie i śledź propozycje rozwiązania.",
      nextStepCta: "Otwórz sprawę",
      nextStepHref: `/orders/${orderId}/sprawa`,
      tone: "amber",
    };
  }
  return {
    label: status || "Nieznany",
    badgeClass: "bg-gray-100 text-gray-800",
    stageDescription: "Zlecenie w trakcie realizacji",
    nextStepLabel: "Szczegóły",
    nextStepHint: "Sprawdź szczegóły, aby kontynuować.",
    nextStepCta: "Szczegóły",
    nextStepHref: `/orders/${orderId}?tab=details`,
    tone: "gray",
  };
}

export function getClientStatusLabel(order) {
  return getClientOrderPresentation(order).label;
}

export const CLIENT_ORDER_FILTERS = [
  "all",
  "open",
  "collecting_offers",
  "accepted",
  "in_progress",
  "completed",
  "disputed",
  "cancelled",
];

export const PROVIDER_ORDER_FILTERS = [
  "all",
  "offered",
  "accepted",
  "in_progress",
  "completed",
  "disputed",
  "cancelled",
  "inactive",
];

export function clientOrderMatchesFilter(order, filter) {
  if (filter === "all") return true;
  const status = order?.status;
  if (filter === "open") return status === "open" || status === "draft" || status === "quote" || status === "matched";
  if (filter === "collecting_offers") return status === "collecting_offers";
  if (filter === "accepted") return ["accepted", "awaiting_payment"].includes(status);
  if (filter === "in_progress") return ["in_progress", "funded", "paid"].includes(status);
  if (filter === "completed") return ["completed", "releasing", "released", "rated", "done"].includes(status);
  if (filter === "disputed") return status === "disputed";
  if (filter === "cancelled") return status === "cancelled";
  return false;
}

export function getProviderStageKey({ order, offer, viewerProviderId = null }) {
  const status = order?.status;
  const acceptedOfferId = order?.acceptedOfferId?._id || order?.acceptedOfferId;
  const myOfferId = offer?._id || offer?.id;
  const acceptedProviderId =
    order?.provider?._id || order?.provider || order?.acceptedOffer?.providerId;
  const myProviderId =
    offer?.providerId?._id || offer?.providerId || viewerProviderId;
  const isAcceptedByOfferId =
    acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);
  const isAcceptedByProviderId =
    acceptedProviderId && myProviderId && String(acceptedProviderId) === String(myProviderId);
  const isAcceptedByViewerAssignment =
    acceptedProviderId &&
    viewerProviderId &&
    String(acceptedProviderId) === String(viewerProviderId);
  const isAccepted = isAcceptedByOfferId || isAcceptedByProviderId || isAcceptedByViewerAssignment;

  if (status === "cancelled") return "cancelled";
  if (status === "disputed") return "disputed";
  if (status === "releasing") return "releasing";

  if (isAccepted) {
    if (status === "in_progress") return "in_progress";
    if (status === "completed" || status === "rated" || status === "released" || status === "done") {
      return "completed";
    }
    return "accepted";
  }

  if (["accepted", "funded", "in_progress", "completed", "rated", "released", "done"].includes(status)) {
    return "lost";
  }

  if (["expired", "withdrawn", "rejected"].includes(offer?.status)) {
    return "inactive";
  }

  return "offered";
}

export function getProviderOrderPresentation({ order, offer, viewerProviderId = null }) {
  const stage = getProviderStageKey({ order, offer, viewerProviderId });
  const status = order?.status;
  const isExternalPayment =
    order?.paymentMethod === "external" || order?.paymentPreference === "external";
  const platformFee = Number(order?.pricing?.platformFee || 0);
  const externalCommissionPaid = order?.externalCommissionStatus === "succeeded";
  const isOffersOnly = order?.orderMode === "offers_only";
  const contactUnlocked = ["succeeded", "waived"].includes(order?.contactUnlockStatus);
  const systemPaid =
    order?.paymentStatus === "succeeded" || order?.paidInSystem || order?.status === "funded";
  const waitingPayment =
    stage === "accepted" &&
    ((!isExternalPayment && !systemPaid) ||
      (isExternalPayment && platformFee > 0 && !externalCommissionPaid) ||
      (isOffersOnly && !contactUnlocked));

  if (stage === "cancelled") {
    return {
      stage,
      label: "Anulowane",
      badgeClass: "bg-gray-100 text-gray-800",
      nextStepLabel: "Zlecenie zamknięte",
      nextStepHint: "Klient anulował zlecenie przed rozpoczęciem realizacji.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "details",
      tone: "gray",
    };
  }

  if (stage === "disputed") {
    return {
      stage,
      label: "Spór w toku",
      badgeClass: "bg-amber-100 text-amber-900",
      nextStepLabel: "Odpowiedz w sprawie",
      nextStepHint: "Sprawdź wiadomości i propozycje rozwiązania sporu.",
      nextStepCta: "Otwórz sprawę",
      nextStepHref: `/orders/${order?._id}/sprawa`,
      bannerAction: "details",
      tone: "amber",
    };
  }

  if (stage === "releasing") {
    return {
      stage,
      label: "Rozliczenie w toku",
      badgeClass: "bg-sky-100 text-sky-800",
      nextStepLabel: "Poczekaj na rozliczenie",
      nextStepHint: "Klient potwierdził odbiór, a Helpfli kończy rozliczenie.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "details",
      tone: "blue",
    };
  }

  if (stage === "inactive") {
    const inactiveLabel = offer?.status === "expired"
      ? "Oferta wygasła"
      : offer?.status === "withdrawn"
        ? "Oferta wycofana"
        : "Oferta odrzucona";
    return {
      stage,
      label: inactiveLabel,
      badgeClass: "bg-gray-100 text-gray-800",
      nextStepLabel: "Oferta nieaktywna",
      nextStepHint: "Ta oferta nie bierze już udziału w wyborze wykonawcy.",
      nextStepCta: "Szczegóły",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "details",
      tone: "gray",
    };
  }

  if (stage === "offered") {
    return {
      stage,
      label: "Oferta złożona",
      badgeClass: "bg-indigo-100 text-indigo-800",
      nextStepLabel: "Czekaj na decyzję klienta",
      nextStepHint: "Monitoruj czat i bądź gotowy doprecyzować ofertę.",
      nextStepCta: "Otwórz czat",
      nextStepHref: `/orders/${order?._id}?tab=chat`,
      bannerAction: "chat",
      tone: "blue",
    };
  }

  if (stage === "lost") {
    return {
      stage,
      label: "Klient wybrał innego",
      badgeClass: "bg-red-100 text-red-800",
      nextStepLabel: "Oferta nie została wybrana",
      nextStepHint: "Klient zaakceptował inną ofertę dla tego zlecenia.",
      nextStepCta: "Zamknij szczegóły",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "details",
      tone: "red",
    };
  }

  if (stage === "accepted" && waitingPayment) {
    return {
      stage,
      label: "Oferta wybrana",
      badgeClass: "bg-amber-100 text-amber-800",
      nextStepLabel: "Czekamy na płatność klienta",
      nextStepHint:
        "Klient musi dokończyć płatność w Helpfli (lub formalności przy płatności poza systemem). Dopiero wtedy u Ciebie pojawi się przycisk startu realizacji.",
      nextStepCta: "Zobacz status",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "details",
      tone: "amber",
    };
  }

  if (stage === "accepted") {
    return {
      stage,
      label: isExternalPayment ? "Gotowe do realizacji" : "Zlecenie opłacone",
      badgeClass: "bg-emerald-100 text-emerald-800",
      nextStepLabel: "Twoja kolej — rozpocznij realizację",
      nextStepHint: isExternalPayment
        ? "Klient wybrał rozliczenie poza Helpfli i wymagane formalności są zakończone. Potwierdź start realizacji."
        : "Środki są zabezpieczone. Kliknij poniżej, przejdź do sekcji na dole strony i potwierdź start — status zmieni się na „W realizacji”, a klient dostanie powiadomienie.",
      nextStepCta: "Rozpocznij realizację",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "start",
      tone: "emerald",
    };
  }

  if (stage === "in_progress") {
    return {
      stage,
      label: "W realizacji",
      badgeClass: "bg-purple-100 text-purple-800",
      nextStepLabel: "Dokończ usługę",
      nextStepHint: "Po zakończeniu oznacz zlecenie jako zakończone.",
      nextStepCta: "Przejdź do zakończenia",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "details",
      tone: "purple",
    };
  }

  if (status === "completed") {
    return {
      stage,
      label: "Czeka na potwierdzenie klienta",
      badgeClass: "bg-amber-100 text-amber-800",
      nextStepLabel: "Klient potwierdza odbiór",
      nextStepHint: "Zakończenie zostało zgłoszone. Klient może potwierdzić odbiór albo zgłosić spór.",
      nextStepCta: "Zobacz status",
      nextStepHref: `/orders/${order?._id}?tab=details`,
      bannerAction: "details",
      tone: "amber",
    };
  }

  return {
    stage,
    label: "Zakończone",
    badgeClass: "bg-emerald-100 text-emerald-800",
    nextStepLabel: "Archiwum",
    nextStepHint: "Zlecenie zostało domknięte.",
    nextStepCta: "Podsumowanie",
    nextStepHref: `/orders/${order?._id}?tab=details`,
    bannerAction: "details",
    tone: "green",
  };
}

export function providerOrderMatchesFilter(item, filter, viewerProviderId = null) {
  if (filter === "all") return true;
  const stage = getProviderStageKey({
    order: item?.order,
    offer: item?.offer,
    viewerProviderId,
  });
  if (filter === "completed") return stage === "completed" || stage === "releasing";
  return stage === filter;
}
