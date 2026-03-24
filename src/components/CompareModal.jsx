import StarRating from "./StarRating";
import AvailabilityBadge from "./AvailabilityBadge";

export default function CompareModal({ open, onClose, items = [] }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 top-[10%] mx-auto max-w-5xl qs-card shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[var(--qs-color-text)]">Porównanie wykonawców</h3>
          <button onClick={onClose} className="text-[var(--qs-color-muted)] hover:text-[var(--qs-color-text)] text-2xl transition-colors rounded-full p-1 hover:bg-[var(--qs-color-bg-soft)]">✕</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--qs-color-muted)] border-b border-[var(--qs-color-border)]">
                <th className="py-4 pr-6 font-semibold">Parametr</th>
                {items.map(i => (
                  <th key={i.id} className="py-4 pr-6 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {i.initials || i.name?.slice(0,2)?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-[var(--qs-color-text)]">{i.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&>tr>*]:py-4 [&>tr>*]:pr-6">
              <tr className="border-b border-[var(--qs-color-border)]">
                <td className="font-semibold text-[var(--qs-color-text)]">Ocena</td>
                {items.map(i => (
                  <td key={i.id}>
                    <div className="flex items-center gap-2">
                      <StarRating value={i.rating || 0} size={14} />
                      <span className="text-[var(--qs-color-muted)]">({i.rating?.toFixed(1) || "—"})</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[var(--qs-color-border)]">
                <td className="font-semibold text-[var(--qs-color-text)]">Poziom</td>
                {items.map(i => <td key={i.id} className="text-[var(--qs-color-text)]">{i.level}</td>)}
              </tr>
              <tr className="border-b border-[var(--qs-color-border)]">
                <td className="font-semibold text-[var(--qs-color-text)]">Widełki ceny</td>
                {items.map(i => (
                  <td key={i.id} className="text-[var(--qs-color-text)]">
                    {i.priceFrom && i.priceTo ? `${i.priceFrom}–${i.priceTo} zł` : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[var(--qs-color-border)]">
                <td className="font-semibold text-[var(--qs-color-text)]">Dostępność</td>
                {items.map(i => (
                  <td key={i.id}>
                    <AvailabilityBadge 
                      status={i.provider_status?.status} 
                      nextAvailableAt={i.provider_status?.next_available_at}
                    />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[var(--qs-color-border)]">
                <td className="font-semibold text-[var(--qs-color-text)]">Odległość</td>
                {items.map(i => <td key={i.id} className="text-[var(--qs-color-text)]">{i.distanceKm?.toFixed(2)} km</td>)}
              </tr>
              <tr className="border-b border-[var(--qs-color-border)]">
                <td className="font-semibold text-[var(--qs-color-text)]">Usługa</td>
                {items.map(i => <td key={i.id} className="text-[var(--qs-color-text)]">{i.service || "—"}</td>)}
              </tr>
              <tr className="border-b border-[var(--qs-color-border)]">
                <td className="font-semibold text-[var(--qs-color-text)]">Status</td>
                {items.map(i => (
                  <td key={i.id}>
                    <div className="space-y-1.5">
                      {i.verified && <div className="qs-badge qs-badge-success text-xs">✓ Zweryfikowany</div>}
                      {i.b2b && <div className="qs-badge qs-badge-info text-xs">✓ Firma</div>}
                      {i.online && <div className="qs-badge qs-badge-success text-xs">● Online</div>}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="font-semibold text-[var(--qs-color-text)]">Opis</td>
                {items.map(i => (
                  <td key={i.id} className="text-[var(--qs-color-muted)]">
                    {i.bio ? (i.bio.length > 50 ? `${i.bio.slice(0, 50)}...` : i.bio) : "Brak opisu"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="btn-helpfli-secondary text-sm px-6 py-2.5"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
