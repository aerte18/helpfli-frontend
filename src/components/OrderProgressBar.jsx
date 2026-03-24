import { CheckCircle2, Circle, Clock, CreditCard, Package, CheckSquare, XCircle, AlertCircle } from "lucide-react";
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

// Etapy dla dostawcy
const PROVIDER_STAGES = [
  { key: 'awaiting', label: 'Oczekuje', icon: Clock, color: 'blue' },
  { key: 'rejected', label: 'Klient wybrał innego', icon: XCircle, color: 'red' },
  { key: 'accepted', label: 'Oferta zaakceptowana', icon: CheckCircle2, color: 'orange' },
  { key: 'funded', label: 'Opłacone', icon: CreditCard, color: 'green' },
  { key: 'in_progress', label: 'W realizacji', icon: Clock, color: 'purple' },
  { key: 'completed', label: 'Zakończone', icon: CheckSquare, color: 'gray' },
];

export default function OrderProgressBar({ order, offersCount = 0, myOffer = null }) {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  
  // Sprawdź czy płatność jest zewnętrzna (poza Helpfli)
  const isExternalPayment = order.paymentMethod === 'external' || order.paymentPreference === 'external';
  
  // Wybierz odpowiednie etapy w zależności od roli i metody płatności
  let STAGES = isProvider ? PROVIDER_STAGES : CLIENT_STAGES;
  
  // Jeśli płatność jest zewnętrzna, usuń etap "funded" z listy etapów
  if (isExternalPayment) {
    STAGES = STAGES.filter(stage => stage.key !== 'funded');
  }

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
          return isMyOfferAccepted ? 'completed' : 'rejected';
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
    
    // Dla klienta - standardowa logika
    if (order.status === 'completed' || order.status === 'rated' || order.status === 'released') return 'completed';
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

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative">
        {/* Linia tła */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 z-0" />
        
        {/* Linia wypełniona */}
        <div 
          className="absolute top-4 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
          style={{ width: currentIndex >= 0 ? `${(currentIndex / (STAGES.length - 1)) * 100}%` : '0%' }}
        />

        {STAGES.map((stage, index) => {
          const status = getStageStatus(index);
          const Icon = stage.icon;
          
          let bgColor = 'bg-slate-100';
          let textColor = 'text-slate-500';
          let borderColor = 'border-slate-200';
          let ringColor = '';
          let ringSize = '';
          let shadowClass = '';
          
          // Sprawdź czy moja oferta została zaakceptowana (dla providera)
          const isMyOfferAccepted = isProvider && myOffer && (() => {
            const acceptedOfferId = order.acceptedOfferId?._id || order.acceptedOfferId;
            const myOfferId = myOffer._id || myOffer.id;
            return acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);
          })();
          
          // Dla etapu "Klient wybrał innego" (rejected) - pokaż tylko jeśli faktycznie klient wybrał inną ofertę
          if (isProvider && stage.key === 'rejected') {
            if (isMyOfferAccepted) {
              // Jeśli moja oferta została zaakceptowana - etap "Klient wybrał innego" powinien być szary (pending)
              bgColor = 'bg-slate-100';
              textColor = 'text-slate-400';
              borderColor = 'border-slate-200';
            } else if (status === 'current' || status === 'completed') {
              // Jeśli klient faktycznie wybrał inną ofertę - czerwony
              bgColor = 'bg-red-600';
              textColor = 'text-red-700';
              borderColor = 'border-red-700';
              ringColor = status === 'current' ? 'ring-red-200' : '';
              ringSize = status === 'current' ? 'ring-4' : '';
              shadowClass = status === 'current' ? 'shadow-sm shadow-red-500/40' : '';
            }
            // Jeśli status to pending i klient nie wybrał mojej oferty - pozostaw szary
          } else if (status === 'completed') {
            // Zakończone etapy - zielone, ale bez efektu aktywnego
            bgColor = 'bg-emerald-100';
            textColor = 'text-emerald-700';
            borderColor = 'border-emerald-200';
            ringColor = '';
            ringSize = '';
            shadowClass = '';
          } else if (status === 'current') {
            // Aktualny etap
            if (isProvider && stage.key === 'accepted' && isMyOfferAccepted) {
              // Dla dostawcy - zielony kolor dla "Oferta zaakceptowana" (moja oferta)
              bgColor = 'bg-blue-600';
              textColor = 'text-blue-700';
              borderColor = 'border-blue-600';
              ringColor = 'ring-blue-200';
              ringSize = 'ring-4';
              shadowClass = 'shadow-sm shadow-blue-500/40';
            } else if (isProvider && stage.key === 'funded' && isMyOfferAccepted) {
              // Dla dostawcy - jeśli status jest funded i moja oferta została zaakceptowana - zielony (completed)
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
                // Jeśli jeszcze nie opłacone - niebieski (czeka na płatność)
                bgColor = 'bg-blue-600';
                textColor = 'text-blue-700';
                borderColor = 'border-blue-600';
                ringColor = 'ring-blue-200';
                ringSize = 'ring-4';
                shadowClass = 'shadow-sm shadow-blue-500/40';
              }
            } else {
              // Aktualny etap - niebieski z efektem świecenia
              bgColor = 'bg-blue-600';
              textColor = 'text-blue-700';
              borderColor = 'border-blue-600';
              ringColor = 'ring-blue-200';
              ringSize = 'ring-4';
              shadowClass = 'shadow-sm shadow-blue-500/40';
            }
          } else if (status === 'pending' && isProvider && stage.key === 'accepted' && isMyOfferAccepted) {
            // Jeśli "Oferta zaakceptowana" jest już za nami (completed), ale jeszcze nie jesteśmy w funded
            // To nie powinno się zdarzyć, ale na wszelki wypadek
            bgColor = 'bg-emerald-100';
            textColor = 'text-emerald-700';
            borderColor = 'border-emerald-200';
          } else if (status === 'pending' && isProvider && stage.key === 'funded' && isMyOfferAccepted) {
            // Jeśli "Opłacone" jest jeszcze przed nami (pending) - sprawdź czy czeka na płatność
            const orderStatus = order.status;
            const isFunded = orderStatus === 'funded' || order.paymentStatus === 'succeeded' || order.paidInSystem;
            if (isFunded) {
              // Jeśli jest opłacone, ale etap jest pending (nie powinno się zdarzyć) - zielony
              bgColor = 'bg-emerald-100';
              textColor = 'text-emerald-700';
              borderColor = 'border-emerald-200';
            } else if (orderStatus === 'accepted') {
              // Jeśli status jest "accepted" (czeka na płatność) - niebieski jako następny krok
              bgColor = 'bg-slate-100';
              textColor = 'text-slate-500';
              borderColor = 'border-slate-200';
            } else {
              // W przeciwnym razie - szary
              bgColor = 'bg-slate-100';
              textColor = 'text-slate-400';
              borderColor = 'border-slate-200';
            }
          }

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full ${bgColor} border ${borderColor} flex items-center justify-center transition-all duration-300 ${
                  status === 'current' ? `${ringSize} ${ringColor} ${shadowClass}` : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${
                  status === 'current' ? 'text-white' : status === 'completed' ? 'text-emerald-600' : 'text-slate-400'
                }`} />
              </div>
              <div className={`mt-2 text-[11px] font-medium text-center ${textColor} max-w-[80px]`}>
                {stage.label}
              </div>
              {stage.key === 'offers' && offersCount > 0 && (
                <div className="mt-1 text-xs font-semibold text-indigo-600">
                  {offersCount} {offersCount === 1 ? 'oferta' : 'oferty'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

