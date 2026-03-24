import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import AvailabilityBadge from "./AvailabilityBadge";

export default function ProviderCardMobile({ 
  provider, 
  onCompare, 
  isCompared, 
  onSelect, 
  onPing, 
  onQuickView,
  onCreateOrder
}) {
  return (
    <div className="qs-card p-4 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/provider/${provider._id || provider.id}`}
              state={{ provider }}
              className="font-semibold text-slate-900 hover:underline truncate"
            >
              {provider.name}
            </Link>
            {onQuickView && (
              <button 
                onClick={onQuickView}
                className="text-indigo-600 text-sm hover:text-indigo-800 flex-shrink-0"
              >
                Podgląd
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mb-2 flex flex-wrap items-center gap-1">
            <span>{provider.service}</span>
            {provider.level && <span>• Poziom: {provider.level}</span>}
            {provider.providerTier === 'pro' && (
              <span className="qs-badge qs-badge-purple text-[11px]">
                TOP
              </span>
            )}
            {provider.providerTier === 'standard' && (
              <span className="qs-badge qs-badge-primary text-[11px]">
                ✨ PRO Standard
              </span>
            )}
            {provider.hasHelpfliGuarantee && (
              <span className="qs-badge qs-badge-warning text-[11px]">
                🛡️ Gwarancja+
              </span>
            )}
          </div>
          
          <div className="mb-2">
            <StarRating value={provider.rating || 0} size={14} />
          </div>
          
          <div className="mb-3">
            <AvailabilityBadge 
              status={provider.provider_status?.status} 
              nextAvailableAt={provider.provider_status?.next_available_at}
              hours={provider.availableInHours}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <div>{provider.priceFrom}–{provider.priceTo} zł</div>
            <div>
              <AvailabilityBadge 
                status={provider.provider_status?.status} 
                nextAvailableAt={provider.provider_status?.next_available_at}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button 
            className={`qs-btn text-sm !px-3 !py-2 ${
              isCompared 
                ? "qs-btn-primary" 
                : "qs-btn-outline"
            }`}
            onClick={onCompare}
          >
            {isCompared ? "✓ W porównaniu" : "Porównaj"}
          </button>
          
          <button 
            className="qs-btn qs-btn-outline text-sm !px-3 !py-2"
            onClick={onQuickView}
          >
            Podgląd
          </button>
          
          {onCreateOrder && (
            <button 
              className="qs-btn qs-btn-outline text-sm !px-3 !py-2"
              onClick={() => onCreateOrder(provider)}
            >
              Utwórz zlecenie
            </button>
          )}
          
          <button 
            className="qs-btn qs-btn-primary text-sm !px-3 !py-2"
            onClick={onSelect}
          >
            Wybierz
          </button>
        </div>
      </div>
    </div>
  );
}
