import { CheckCircle2, Circle, Clock, CreditCard, Package, CheckSquare, XCircle, AlertCircle, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Etapy dla klienta
const CLIENT_STAGES = [
  { key: 'open', label: 'Otwarte', icon: Circle, color: 'blue' },
  { key: 'offers', label: 'Oferty złożone', icon: Package, color: 'yellow' },
  { key: 'accepted', label: 'Oferta zaakceptowana', icon: CheckCircle2, color: 'orange' },
  { key: 'funded', label: 'Opłacone', icon: CreditCard, color: 'green' },
  { key: 'in_progress', label: 'W realizacji', icon: Clock, color: 'purple' },
  { key: 'completed', label: 'Zakończone', icon: CheckSquare, color: 'gray' },
];

const CLIENT_STAGES_OFFERS_ONLY = [
  { key: 'open', label: 'Zbieranie ofert', icon: Circle, color: 'blue' },
  { key: 'offers', label: 'Oferty złożone', icon: Package, color: 'yellow' },
  { key: 'accepted', label: 'Wykonawca wybrany', icon: CheckCircle2, color: 'orange' },
  { key: 'contact', label: 'Kontakt odblokowany', icon: CheckCircle2, color: 'green' },
  { key: 'completed', label: 'Zamknięte', icon: CheckSquare, color: 'gray' },
];

// Etapy dla dostawcy
const PROVIDER_STAGES = [
  { key: 'awaiting', label: 'Oczekuje', icon: Clock, color: 'blue' },
  { key: 'rejected', label: 'Klient wybrał innego', icon: XCircle, color: 'red' },
  { key: 'accepted', label: 'Oferta zaakceptowana', icon: CheckCircle2, color: 'orange' },
  { key: 'funded', label: 'Opłacone', icon: CreditCard, color: 'green' },
  { key: 'in_progress', label: 'W realizacji', icon: Clock, color: 'purple' },
  { key: 'completed', label: 'Zakończone', icon: CheckSquare, color: 'gray' },
];

const RATING_STAGE = { key: 'rated', label: 'Ocena', icon: Star, color: 'emerald' };

function appendRatingStage(stages, order) {
  if (!order?.status) return stages;
  if (!['completed', 'released', 'rated'].includes(order.status)) return stages;
  if (stages.some((s) => s.key === 'rated')) return stages;
  return [...stages, RATING_STAGE];
}

export default function OrderProgressBar({
  order,
  offersCount = 0,
  myOffer = null,
  /** Z OrderDetails: czy użytkownik ma już wpis w order.ratings dla tej roli */
  hasMyRating = false,
  /** Nadpisanie roli widoku (np. owner firmy = panel wykonawcy) */
  isProviderView: isProviderViewProp,
}) {
  const { user } = useAuth();
  const isProvider =
    isProviderViewProp !== undefined ? Boolean(isProviderViewProp) : user?.role === 'provider';
  
  const isOffersOnly = order?.orderMode === 'offers_only';

  // Sprawdź czy płatność jest zewnętrzna (poza Helpfli)
  const isExternalPayment = order.paymentMethod === 'external' || order.paymentPreference === 'external';
  
  // Wybierz odpowiednie etapy w zależności od roli i metody płatności
  let STAGES = isProvider ? [...PROVIDER_STAGES] : (isOffersOnly ? [...CLIENT_STAGES_OFFERS_ONLY] : [...CLIENT_STAGES]);
  
  // Jeśli płatność jest zewnętrzna, usuń etap "funded" z listy etapów
  if (isExternalPayment) {
    STAGES = STAGES.filter(stage => stage.key !== 'funded');
  }

  STAGES = appendRatingStage(STAGES, order);

  const getCurrentStage = () => {
    if (isProvider) {
      // Dla dostawcy - sprawdź status jego oferty
      const orderStatus = order.status;
      const acceptedOfferId = order.acceptedOfferId?._id || order.acceptedOfferId;
      
      if (myOffer) {
        const myOfferId = myOffer._id || myOffer.id;
        const isMyOfferAccepted = acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);
        
        // (Debug log usunięty) – nie spamuj konsoli w UI
        
        // WAŻNE: Najpierw sprawdź status zlecenia (funded/in_progress/completed), potem czy oferta została zaakceptowana
        
        // Jeśli zlecenie zakończone - sprawdź czy moja oferta była zaakceptowana
        if (orderStatus === 'completed' || orderStatus === 'rated' || orderStatus === 'released') {
          if (!isMyOfferAccepted) return 'rejected';
          if (hasMyRating || orderStatus === 'rated') return 'rated';
          if (orderStatus === 'released') return 'rated';
          return 'completed';
        }
        
        // Jeśli w realizacji - sprawdź czy moja oferta była zaakceptowana
        if (orderStatus === 'in_progress') {
          return isMyOfferAccepted ? 'in_progress' : 'rejected';
        }
        
        // Jeśli opłacone - sprawdź czy moja oferta była zaakceptowana
        // PRIORYTET: sprawdź najpierw status funded, potem paymentStatus
        // UWAGA: Jeśli płatność jest zewnętrzna, pomiń etap funded
        if (!isExternalPayment && (orderStatus === 'funded' || order.paymentStatus === 'succeeded' || order.paidInSystem)) {
          // Jeśli status jest funded/paid, ale moja oferta nie została zaakceptowana - to znaczy że klient wybrał innego
          if (!isMyOfferAccepted) return 'rejected';
          // Jeśli moja oferta została zaakceptowana i jest opłacone - pokaż funded
          return 'funded';
        }
        
        // Jeśli oferta zaakceptowana (moja) - ale jeszcze nie opłacone (lub płatność zewnętrzna)
        if (orderStatus === 'accepted' || isMyOfferAccepted) {
          return isMyOfferAccepted ? 'accepted' : 'rejected';
        }
        
        // Jeśli zlecenie ma zaakceptowaną ofertę, ale to nie moja - klient wybrał innego
        if (acceptedOfferId && !isMyOfferAccepted) {
          return 'rejected';
        }
      } else {
        // Provider bez oferty - sprawdź status zlecenia
        if (orderStatus === 'completed' || orderStatus === 'rated' || orderStatus === 'released') {
          return 'rejected'; // Zlecenie zakończone, ale nie moja oferta
        }
        if (orderStatus === 'in_progress' || orderStatus === 'funded') {
          return 'rejected'; // Zlecenie w trakcie, ale nie moja oferta
        }
        // Sprawdź czy zlecenie ma już zaakceptowaną ofertę (innego providera)
        if (acceptedOfferId) {
          return 'rejected';
        }
      }
      
      // W przeciwnym razie - oczekuje (provider złożył ofertę lub jeszcze nie złożył)
      return 'awaiting';
    }
    
    // Klient — tryb „tylko oferty”
    if (isOffersOnly) {
      if (order.status === 'completed' || order.status === 'rated' || order.status === 'released') {
        if (hasMyRating || order.status === 'rated') return 'rated';
        return 'completed';
      }
      if (order.contactUnlockedAt || order.status === 'accepted' || order.acceptedOfferId) {
        return 'contact';
      }
      if (order.status === 'collecting_offers' || offersCount > 0) return 'offers';
      return 'open';
    }

    // Dla klienta - standardowa logika (+ opcjonalny etap „Ocena”)
    if (order.status === 'completed' || order.status === 'rated' || order.status === 'released') {
      if (hasMyRating || order.status === 'rated') return 'rated';
      if (order.status === 'released') return 'rated';
      return 'completed';
    }
    if (order.status === 'in_progress') return 'in_progress';
    if (order.status === 'funded' || order.paymentStatus === 'succeeded' || order.paidInSystem) return 'funded';
    if (order.status === 'accepted' || order.selectedOffer || order.acceptedOfferId) return 'accepted';
    if (order.status === 'collecting_offers' || offersCount > 0) return 'offers';
    if (order.status === 'open' || order.status === 'draft') return 'open';
    // Fallback - sprawdź payment status
    if (order.paymentStatus === 'succeeded') return 'funded';
    return 'open';
  };

  const currentStage = getCurrentStage();
  const currentIndex = STAGES.findIndex(s => s.key === currentStage);

  // Debug: loguj aktualny etap (można usunąć później)
  // console.log('OrderProgressBar Debug:', { currentStage, currentIndex, isProvider, orderStatus: order?.status, myOffer: !!myOffer });

  const getStageStatus = (index) => {
    if (currentIndex < 0) {
      // Jeśli nie znaleziono etapu, sprawdź czy to może być pierwszy etap
      return index === 0 ? 'current' : 'pending';
    }
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const isMyOfferAccepted =
    isProvider &&
    myOffer &&
    (() => {
      const acceptedOfferId = order.acceptedOfferId?._id || order.acceptedOfferId;
      const myOfferId = myOffer._id || myOffer.id;
      return acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);
    })();

  const gridCols = { gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` };

  const stageCells = STAGES.map((stage, index) => {
    let status = getStageStatus(index);
    if (
      stage.key === 'rated' &&
      (hasMyRating || order?.status === 'rated') &&
      status === 'current'
    ) {
      status = 'completed';
    }
    const Icon = stage.icon;

    let bgColor = 'bg-slate-100';
    let textColor = 'text-slate-500';
    let borderColor = 'border-slate-200';
    let ringColor = '';
    let ringSize = '';
    let shadowClass = '';

    // Dla etapu "Klient wybrał innego" (rejected) - pokaż tylko jeśli faktycznie klient wybrał inną ofertę
    if (isProvider && stage.key === 'rejected') {
      if (isMyOfferAccepted) {
        bgColor = 'bg-slate-100';
        textColor = 'text-slate-400';
        borderColor = 'border-slate-200';
      } else if (status === 'current' || status === 'completed') {
        bgColor = 'bg-red-600';
        textColor = 'text-red-700';
        borderColor = 'border-red-700';
        ringColor = status === 'current' ? 'ring-red-200' : '';
        ringSize = status === 'current' ? 'ring-4' : '';
        shadowClass = status === 'current' ? 'shadow-sm shadow-red-500/40' : '';
      }
    } else if (status === 'completed') {
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-700';
      borderColor = 'border-emerald-200';
      ringColor = '';
      ringSize = '';
      shadowClass = '';
    } else if (status === 'current') {
      if (isProvider && stage.key === 'accepted' && isMyOfferAccepted) {
        bgColor = 'bg-blue-600';
        textColor = 'text-blue-700';
        borderColor = 'border-blue-600';
        ringColor = 'ring-blue-200';
        ringSize = 'ring-4';
        shadowClass = 'shadow-sm shadow-blue-500/40';
      } else if (isProvider && stage.key === 'funded' && isMyOfferAccepted) {
        const orderStatus = order.status;
        const isFunded = orderStatus === 'funded' || order.paymentStatus === 'succeeded' || order.paidInSystem;
        if (isFunded) {
          bgColor = 'bg-emerald-100';
          textColor = 'text-emerald-700';
          borderColor = 'border-emerald-200';
          ringColor = '';
          ringSize = '';
          shadowClass = '';
        } else {
          bgColor = 'bg-blue-600';
          textColor = 'text-blue-700';
          borderColor = 'border-blue-600';
          ringColor = 'ring-blue-200';
          ringSize = 'ring-4';
          shadowClass = 'shadow-sm shadow-blue-500/40';
        }
      } else {
        bgColor = 'bg-blue-600';
        textColor = 'text-blue-700';
        borderColor = 'border-blue-600';
        ringColor = 'ring-blue-200';
        ringSize = 'ring-4';
        shadowClass = 'shadow-sm shadow-blue-500/40';
      }
    } else if (status === 'pending' && isProvider && stage.key === 'accepted' && isMyOfferAccepted) {
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-700';
      borderColor = 'border-emerald-200';
    } else if (status === 'pending' && isProvider && stage.key === 'funded' && isMyOfferAccepted) {
      const orderStatus = order.status;
      const isFunded = orderStatus === 'funded' || order.paymentStatus === 'succeeded' || order.paidInSystem;
      if (isFunded) {
        bgColor = 'bg-emerald-100';
        textColor = 'text-emerald-700';
        borderColor = 'border-emerald-200';
      } else if (orderStatus === 'accepted') {
        bgColor = 'bg-slate-100';
        textColor = 'text-slate-500';
        borderColor = 'border-slate-200';
      } else {
        bgColor = 'bg-slate-100';
        textColor = 'text-slate-400';
        borderColor = 'border-slate-200';
      }
    }

    return {
      stage,
      index,
      status,
      Icon,
      bgColor,
      textColor,
      borderColor,
      ringColor,
      ringSize,
      shadowClass,
    };
  });

  return (
    <div className="w-full py-3">
      {/* Osobny wiersz na kółka + linię — unikamy items-center na kolumnach o różnej wysokości (etykiety + licznik ofert) */}
      <div className="relative mb-1 grid min-h-[2.25rem] items-center" style={gridCols}>
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-slate-200" />
        <div
          className="pointer-events-none absolute left-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-blue-500 transition-all duration-500"
          style={{ width: currentIndex >= 0 ? `${(currentIndex / Math.max(1, STAGES.length - 1)) * 100}%` : '0%' }}
        />
        {stageCells.map(({ stage, status, Icon, bgColor, borderColor, ringColor, ringSize, shadowClass }) => (
          <div key={`${stage.key}-icon`} className="relative z-10 flex justify-center py-0.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${bgColor} ${borderColor} transition-all duration-300 ${
                status === 'current' ? `${ringSize} ${ringColor} ${shadowClass}` : ''
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  status === 'current' ? 'text-white' : status === 'completed' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-y-0.5" style={gridCols}>
        {stageCells.map(({ stage, textColor }) => (
          <div key={`${stage.key}-label`} className="flex flex-col items-center px-0.5 text-center">
            <div className={`max-w-[80px] text-[11px] font-medium leading-tight ${textColor}`}>{stage.label}</div>
            {stage.key === 'offers' && offersCount > 0 && (
              <div className="mt-0.5 text-xs font-semibold text-indigo-600">
                {offersCount} {offersCount === 1 ? 'oferta' : 'oferty'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

