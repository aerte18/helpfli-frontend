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
  maxDistance: 50,
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
  showDistanceFilter = true,
  mapViewMobile = false,
  showAllServices = true,
  onShowAllServicesChange,
  recommendedOnly = false,
  onRecommendedOnlyChange,
  recommendedLoading = false,
  freeRepliesLeft = null,
  hasAiInsights = false,
  aiInsightsLabel = "",
  onOpenAiInsights,
}) {
  const [localFilters, setLocalFilters] = useState(filters || DEFAULT_FILTERS);
  const [localShowAllServices, setLocalShowAllServices] = useState(showAllServices);
  const [localRecommendedOnly, setLocalRecommendedOnly] = useState(recommendedOnly);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      setLocalFilters(filters || DEFAULT_FILTERS);
      setLocalShowAllServices(showAllServices);
      setLocalRecommendedOnly(recommendedOnly);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, filters, showAllServices, recommendedOnly, isInitialized]);

  const handleChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onShowAllServicesChange?.(localShowAllServices);
    onRecommendedOnlyChange?.(localRecommendedOnly);
    onApply?.();
    onClose();
  };

  const handleClear = () => {
    setLocalFilters(DEFAULT_FILTERS);
    setLocalShowAllServices(true);
    setLocalRecommendedOnly(false);
    onFiltersChange(DEFAULT_FILTERS);
    onShowAllServicesChange?.(true);
    onRecommendedOnlyChange?.(false);
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
        className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[min(100%,24rem)] flex-col overflow-hidden bg-white shadow-2xl min-h-0 sm:max-w-md"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--qs-color-border)] bg-[var(--qs-color-bg-soft)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:gap-3 sm:p-5">
          <h2
            id="provider-advanced-filters-title"
            className="min-w-0 flex-1 text-base font-semibold leading-snug text-[var(--qs-color-text)] sm:text-lg"
          >
            Filtry zaawansowane
          </h2>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 whitespace-nowrap text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Wyczyść
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-[var(--qs-color-muted)] transition-colors hover:bg-white hover:text-[var(--qs-color-text)]"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y [webkit-overflow-scrolling:touch] p-4 sm:p-5 ${
          mapViewMobile ? "pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] sm:pb-24" : "pb-24"
        } space-y-5`}>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--qs-color-text)]">Zakres zleceń</h3>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--qs-color-border)] bg-white px-3 py-2.5">
                <div>
                  <span className="text-sm text-[var(--qs-color-text)]">Tylko moje usługi</span>
                  <p className="mt-0.5 text-xs text-[var(--qs-color-muted)]">
                    Wyłączone = pełny rynek zleceń
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!localShowAllServices}
                  onChange={(e) => setLocalShowAllServices(!e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--qs-color-border)] bg-white px-3 py-2.5 ${
                  recommendedLoading ? "opacity-60" : ""
                }`}
              >
                <span className="text-sm text-[var(--qs-color-text)]">Tylko polecane przez AI</span>
                <input
                  type="checkbox"
                  checked={localRecommendedOnly}
                  disabled={recommendedLoading}
                  onChange={(e) => setLocalRecommendedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
            {freeRepliesLeft != null && (
              <p className="mt-2 text-xs text-emerald-800">
                Pozostało darmowych wycen: <span className="font-semibold">{freeRepliesLeft}</span>
              </p>
            )}
            {hasAiInsights && onOpenAiInsights && (
              <button
                type="button"
                onClick={() => {
                  onOpenAiInsights();
                  onClose();
                }}
                className="mt-2 flex w-full items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-left text-sm text-violet-900"
              >
                <span>{aiInsightsLabel || "Otwórz asystenta AI"}</span>
                <span className="text-xs font-semibold text-violet-700">→</span>
              </button>
            )}
          </div>

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

          {showDistanceFilter && (
          <div>
            <label className="block text-sm font-semibold text-[var(--qs-color-text)] mb-1">
              Promień wyszukiwania (km): {localFilters.maxDistance ?? 50}
            </label>
            <p className="text-xs text-[var(--qs-color-muted)] mb-2">
              Zlecenia w promieniu od Twojej lokalizacji (widok listy).
            </p>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={localFilters.maxDistance ?? 50}
              onChange={(e) => handleChange("maxDistance", Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--qs-color-muted)] mt-1">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
          )}

          {mapViewMobile && (
          <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
            Na mapie przesuń widok i użyj „Szukaj w tym obszarze” — promień nie dotyczy widoku mapy.
          </p>
          )}

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

        <div
          className={`flex shrink-0 border-t border-[var(--qs-color-border)] bg-[var(--qs-color-bg-soft)] p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:p-5 ${
            mapViewMobile
              ? "pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
              : "pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
          }`}
        >
          <button
            type="button"
            onClick={handleApply}
            className="w-full qs-btn qs-btn-primary text-sm !px-5 !py-2.5"
          >
            Zastosuj
          </button>
        </div>
      </div>
    </div>
  );
}
