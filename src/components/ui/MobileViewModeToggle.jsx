/** Lista | Mapa — wspólny przełącznik mobile (klient + wykonawca). */
export default function MobileViewModeToggle({
  viewMode,
  onChange,
  ariaLabel = "Widok",
}) {
  return (
    <div
      className="inline-flex shrink-0 rounded-full border border-slate-200 bg-slate-100 p-0.5"
      role="tablist"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === "list"}
        onClick={() => onChange("list")}
        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition qs-tap-target ${
          viewMode === "list" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
        }`}
      >
        Lista
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === "map"}
        onClick={() => onChange("map")}
        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition qs-tap-target ${
          viewMode === "map" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
        }`}
      >
        Mapa
      </button>
    </div>
  );
}
