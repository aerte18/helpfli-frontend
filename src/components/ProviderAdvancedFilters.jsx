import { useState, useEffect } from 'react';

const SORT_OPTIONS = [
  { label: "Czas: najnowsze", value: "created_desc" },
  { label: "Czas: najstarsze", value: "created_asc" },
  { label: "Pilność: od najpilniejszego", value: "urgency_desc" },
  { label: "Pilność: od najmniej pilnego", value: "urgency_asc" },
  { label: "Budżet: największy", value: "budget_desc" },
  { label: "Budżet: najmniejszy", value: "budget_asc" },
];

const DEFAULT_FILTERS = {
  service: "any",
  maxDistance: 25,
  budgetMin: "",
  budgetMax: "",
  providerId: "any",
  paymentType: "any",
  offersStatus: "any",
  sortBy: "created_desc",
};

export default function ProviderAdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  canManageCompany,
  companyProviders = [],
}) {
  const [localFilters, setLocalFilters] = useState(filters || DEFAULT_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      setLocalFilters(filters || DEFAULT_FILTERS);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, filters, isInitialized]);

  const handleChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply?.();
    onClose();
  };

  const handleClear = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
    onClear?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-advanced-filters-title"
        className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[min(100%,24rem)] flex-col bg-white shadow-2xl min-h-0 sm:max-w-md"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--qs-color-border)] bg-[var(--qs-color-bg-soft)] p-5">
          <h2 className="text-lg font-semibold text-[var(--qs-color-text)]">
            Filtry zaawansowane
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--qs-color-muted)] hover:text-[var(--qs-color-text)] transition-colors rounded-full p-1 hover:bg-white"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [webkit-overflow-scrolling:touch] p-5 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] sm:pb-24 space-y-5">
          {/* Sortowanie */}
          <div>
            <label className="block text-sm font-semibold text-[var(--qs-color-text)] mb-2">
              Sortowanie
            </label>
            <select
              value={localFilters.sortBy ?? "created_desc"}
              onChange={(e) => handleChange("sortBy", e.target.value)}
              className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Maks. dystans */}
          <div>
            <label className="block text-sm font-semibold text-[var(--qs-color-text)] mb-2">
              Maks. dystans (km): {localFilters.maxDistance ?? 25}
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={localFilters.maxDistance ?? 25}
              onChange={(e) => handleChange("maxDistance", Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--qs-color-muted)] mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>

          {/* Płatność */}
          <div>
            <label className="block text-sm font-semibold text-[var(--qs-color-text)] mb-2">
              Płatność
            </label>
            <select
              value={localFilters.paymentType ?? "any"}
              onChange={(e) => handleChange("paymentType", e.target.value)}
              className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="any">Dowolna</option>
              <option value="system">W systemie (Helpfli Protect)</option>
              <option value="external">Poza systemem</option>
            </select>
          </div>

          {/* Budżet */}
          <div>
            <label className="block text-sm font-semibold text-[var(--qs-color-text)] mb-2">
              Budżet (zł)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--qs-color-muted)] mb-1 font-medium">
                  Min
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.budgetMin ?? ""}
                  onChange={(e) => handleChange("budgetMin", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--qs-color-muted)] mb-1 font-medium">
                  Max
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={localFilters.budgetMax ?? ""}
                  onChange={(e) => handleChange("budgetMax", e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Status ofert */}
          <div>
            <label className="block text-sm font-semibold text-[var(--qs-color-text)] mb-2">
              Status ofert
            </label>
            <select
              value={localFilters.offersStatus ?? "any"}
              onChange={(e) => handleChange("offersStatus", e.target.value)}
              className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="any">Dowolny</option>
              <option value="no_offers">Bez ofert</option>
              <option value="max_3">Max 3 oferty</option>
            </select>
          </div>

          {/* Członek zespołu */}
          {canManageCompany && companyProviders.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-[var(--qs-color-text)] mb-2">
                Członek zespołu
              </label>
              <select
                value={localFilters.providerId ?? "any"}
                onChange={(e) => handleChange("providerId", e.target.value)}
                className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="any">Wszyscy członkowie</option>
                {companyProviders.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || p.email || "Nieznany"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 flex shrink-0 gap-3 border-t border-[var(--qs-color-border)] bg-[var(--qs-color-bg-soft)] p-5 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 qs-btn qs-btn-outline text-sm !px-5 !py-2.5"
          >
            Wyczyść
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 qs-btn qs-btn-primary text-sm !px-5 !py-2.5"
          >
            Zastosuj
          </button>
        </div>
      </div>
    </div>
  );
}
