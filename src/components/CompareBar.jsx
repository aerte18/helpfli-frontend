import AvailabilityBadge from "./AvailabilityBadge";

export default function CompareBar({ items = [], onClear, onCompare, onRemove }) {
  if (!items.length) return null;
  return (
    <div className="sticky bottom-0 z-50 mb-20">
      <div className="mx-auto max-w-7xl px-4 pb-4 pr-24">
        <div className="qs-card-soft backdrop-blur-xl border border-white/60 shadow-2xl p-4 max-w-full">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-[var(--qs-color-text)]">Porównujesz ({items.length}):</span>
            <div className="flex items-center gap-3 overflow-x-auto flex-1 min-w-0">
              {items.map((i) => (
                <div key={i.id} className="qs-card-soft flex items-center gap-2 px-3 py-2 border border-white/40">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {i.name?.slice(0,2)?.toUpperCase()}
                  </div>
                  <div className="text-sm min-w-0">
                    <div className="font-semibold text-[var(--qs-color-text)] truncate max-w-[160px]">{i.name}</div>
                    <div className="text-xs text-[var(--qs-color-muted)]">{i.service || "usługa"}</div>
                  </div>
                  {onRemove && (
                    <button
                      onClick={() => onRemove(i)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-red-50"
                      title="Usuń z porównania"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              {onCompare && (
                <button className="btn-helpfli-primary text-sm px-5 py-2.5" onClick={onCompare}>
                  Porównaj
                </button>
              )}
              <button className="btn-helpfli-secondary text-sm px-5 py-2.5" onClick={onClear}>Wyczyść</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
