import StarRating from "./StarRating";
import AvailabilityBadge from "./AvailabilityBadge";

export default function ProviderQuickView({ open, onClose, provider, onChoose, onCreateOrder }) {
  if (!open || !provider) return null;
  
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{provider.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-semibold">
            {provider.initials || provider.name?.slice(0,2)?.toUpperCase()}
          </div>
          <div className="text-sm text-gray-600">
            <div>Poziom: {provider.level}</div>
            <div>Odległość: {provider.distanceKm?.toFixed?.(1)} km</div>
          </div>
        </div>

        <div className="text-sm text-gray-700 space-y-3">
          <div>
            <b>Opis:</b> {provider.bio || "Brak opisu."}
          </div>
          <div>
            <b>Średnia cena:</b> {provider.priceFrom && provider.priceTo ? `${provider.priceFrom}–${provider.priceTo} zł` : "—"}
          </div>
          <div>
            <b>Dostępność:</b> 
            <AvailabilityBadge 
              status={provider.provider_status?.status} 
              nextAvailableAt={provider.provider_status?.next_available_at}
            />
          </div>
          <div className="flex items-center gap-2">
            <b>Ocena:</b> 
            <StarRating value={provider.rating || 0} size={14} />
          </div>
          <div>
            <b>Usługa:</b> {provider.service || "—"}
          </div>
          {provider.verified && (
            <div className="text-green-600">
              <b>✓ Zweryfikowany</b>
            </div>
          )}
          {provider.b2b && (
            <div className="text-blue-600">
              <b>✓ Firma</b>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button 
            onClick={() => onChoose?.(provider)}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition-colors"
          >
            Podgląd profilu
          </button>
          <button 
            onClick={() => onCreateOrder?.(provider)}     // 👈 nowy przycisk
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Utwórz zlecenie z tym wykonawcą
          </button>
        </div>
      </div>
    </div>
  );
}
