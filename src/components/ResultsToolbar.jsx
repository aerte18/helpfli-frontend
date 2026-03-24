import { useState, useEffect } from 'react';
import { ShieldCheck, Users, Star, Zap, List, Map, LayoutGrid } from 'lucide-react';

export default function ResultsToolbar({ 
  searchQuery, 
  resultsCount, 
  location, 
  sortBy, 
  onSortChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  b2bOnly,
  onB2bOnlyChange,
  proOnly,
  onProOnlyChange,
  availableNow,
  onAvailableNowChange,
  viewMode,
  onViewModeChange,
  categorySelector,
  showLeftInfo = true,
  rightExtra = null,
  hasActiveFilters = false,
  onClearFilters = null,
  hideViewSwitcher = false, // gdy true, przyciski widoku (📋🗺️📊) są renderowane poza toolbarem (nad listą / na mapie)
}) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Obsługa scrollowania - przezroczystość przy scrollowaniu w dół
  useEffect(() => {
    if (viewMode === 'map') {
      setIsScrolled(true); // W trybie mapy zawsze przezroczysty
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  const sortOptions = [
    { value: 'default', label: 'Domyślne' },
    { value: 'rating_desc', label: 'Ocena · od najwyższej' },
    { value: 'rating_asc', label: 'Ocena · od najniższej' },
    { value: 'distance_near', label: 'Odległość · najbliżej' },
    { value: 'distance_far', label: 'Odległość · najdalej' },
    { value: 'price_desc', label: 'Stawka · od najwyższej' },
    { value: 'price_asc', label: 'Stawka · od najniższej' },
  ];

  const viewModes = [
    { value: 'list', label: 'Lista', icon: List },
    { value: 'map', label: 'Mapa', icon: Map },
    { value: 'split', label: 'Podział', icon: LayoutGrid }
  ];

  // W widoku mapy używamy fixed w Home.jsx
  // W widokach split i list - sticky toolbar, który jest przyklejony do góry i staje się przezroczysty przy scrollowaniu
  
  // Różne poziomy przezroczystości:
  // - Widok mapy: najbardziej przezroczysty (bg-white/30)
  // - Scrollowanie: średnio przezroczysty (bg-white/40)
  // - Bez scrollowania: nieprzezroczysty (bg-white)
  let transparencyClass = 'bg-white border-gray-200 shadow-sm';
  if (viewMode === 'map') {
    transparencyClass = 'bg-white/30 backdrop-blur-lg border-gray-200/20 shadow-sm';
  } else if (isScrolled) {
    transparencyClass = 'bg-white/40 backdrop-blur-lg border-gray-200/30 shadow-sm';
  }
  
  const sortBtnSurface =
    viewMode === 'map'
      ? 'bg-white/50 backdrop-blur-md hover:bg-white/70 border border-gray-200/30'
      : isScrolled
        ? 'bg-white/60 backdrop-blur-md hover:bg-white/80 border border-gray-200/40'
        : 'bg-gray-100 hover:bg-gray-200';

  return (
    <div
      data-testid="results-toolbar"
      className={`${viewMode === 'map' ? 'relative' : 'sticky top-16'} z-40 w-full max-w-[100vw] border-b transition-all duration-300 ${transparencyClass} relative`}
    >
      <div className="mx-auto min-w-0 max-w-6xl px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-col gap-2 md:gap-2.5">
          {/* Informacja o wynikach — osobny wiersz, żeby nie ściskać filtrów */}
          {showLeftInfo && (
            <div className="min-w-0 shrink-0 text-sm text-gray-700">
              <span className="font-medium">
                {searchQuery ? `${searchQuery} w ${location}` : `Wszystkie usługi w ${location}`}
              </span>
              <span className="ml-2 text-gray-500">• {resultsCount} wyników</span>
            </div>
          )}

          {/* Mobile: szybkie filtry w poziomym scrollu; desktop: w jednym rzędzie z akcjami */}
          <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
            <div className="scrollbar-hide flex min-w-0 touch-pan-x items-center gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] md:flex-1 md:overflow-visible md:pb-0">
              {categorySelector ? <div className="hidden shrink-0 md:block">{categorySelector}</div> : null}
              <button
                type="button"
                onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs transition-colors sm:px-3 ${
                  verifiedOnly ? 'font-medium text-green-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Verified
              </button>
              <button
                type="button"
                onClick={() => onB2bOnlyChange(!b2bOnly)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs transition-colors sm:px-3 ${
                  b2bOnly ? 'font-medium text-purple-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Firma
              </button>
              <button
                type="button"
                onClick={() => onProOnlyChange(!proOnly)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs transition-colors sm:px-3 ${
                  proOnly ? 'font-medium text-orange-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Star className="h-3.5 w-3.5 shrink-0" aria-hidden />
                TOP
              </button>
              {onAvailableNowChange && (
                <button
                  type="button"
                  onClick={() => onAvailableNowChange(!availableNow)}
                  title="Pokaż tylko wykonawców dostępnych w tej chwili"
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs transition-colors sm:px-3 ${
                    availableNow ? 'font-medium text-emerald-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Dostępny teraz
                </button>
              )}
            </div>

            {/* Sort / widok / Wszystkie filtry — zawsze mieści się w szerokości viewport */}
            <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 md:justify-end">
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`flex max-w-[min(100vw-8rem,16rem)] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-gray-700 transition-colors sm:max-w-none sm:gap-2 sm:px-3 ${sortBtnSurface}`}
                >
                  <span className="hidden shrink-0 sm:inline">Sortuj:</span>
                  <span className="min-w-0 flex-1 truncate font-medium sm:flex-none">
                    {sortOptions.find((opt) => opt.value === sortBy)?.label || 'Domyślne'}
                  </span>
                  <span className="shrink-0 text-xs" aria-hidden>
                    ▼
                  </span>
                </button>

                {showSortMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[min(100vw-2rem,260px)] max-w-[min(100vw-2rem,320px)] rounded-lg border border-gray-200 bg-white py-1.5 shadow-lg sm:min-w-[220px] sm:max-w-none">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onSortChange(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm leading-snug transition-colors hover:bg-gray-100 ${
                          sortBy === option.value ? 'bg-indigo-50 font-medium text-indigo-800' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!hideViewSwitcher && (
                <div
                  className={`flex shrink-0 items-center rounded-lg p-1 transition-all ${
                    viewMode === 'map'
                      ? 'border border-gray-200/30 bg-white/50 backdrop-blur-md'
                      : isScrolled
                        ? 'border border-gray-200/40 bg-white/60 backdrop-blur-md'
                        : 'bg-gray-100'
                  }`}
                >
                  {viewModes.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => onViewModeChange(mode.value)}
                      className={`rounded px-2 py-1 text-xs transition-colors ${
                        viewMode === mode.value
                          ? `${viewMode === 'map' ? 'bg-white/50' : isScrolled ? 'bg-white/60' : 'bg-white'} text-gray-900 shadow-sm`
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title={mode.label}
                    >
                      <mode.icon className="h-4 w-4 shrink-0" aria-hidden />
                    </button>
                  ))}
                </div>
              )}

              {rightExtra ? <div className="shrink-0">{rightExtra}</div> : null}
            </div>
          </div>
          {/* Drugi wiersz: Wyczyść filtry (tylko gdy są aktywne) */}
          {hasActiveFilters && onClearFilters && (
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={onClearFilters}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Wyczyść filtry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
