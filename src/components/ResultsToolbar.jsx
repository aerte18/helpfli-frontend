import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  
  return (
    <div 
      data-testid="results-toolbar"
      className={`${viewMode === 'map' ? 'relative' : 'sticky top-16'} z-40 border-b transition-all duration-300 ${transparencyClass} relative`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between gap-4">
          {/* Lewa strona - informacje o wynikach */}
          {showLeftInfo && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">
                  {searchQuery ? `${searchQuery} w ${location}` : `Wszystkie usługi w ${location}`}
                </span>
                <span className="text-gray-500 ml-2">• {resultsCount} wyników</span>
              </div>
            </div>
          )}

          {/* Środek - selektor kategorii + quick toggles */}
          <div className="flex items-center gap-2">
            {/* Wybór kategorii (opcjonalnie) */}
            {categorySelector ? (
              <div className="hidden md:block">
                {categorySelector}
              </div>
            ) : null}
            <button
              onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
              className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                verifiedOnly 
                  ? 'text-green-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </button>
            <button
              onClick={() => onB2bOnlyChange(!b2bOnly)}
              className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                b2bOnly 
                  ? 'text-purple-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Firma
            </button>
            <button
              onClick={() => onProOnlyChange(!proOnly)}
              className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                proOnly 
                  ? 'text-orange-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              TOP
            </button>
            {onAvailableNowChange && (
              <button
                type="button"
                onClick={() => onAvailableNowChange(!availableNow)}
                title="Pokaż tylko wykonawców dostępnych w tej chwili"
                className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
                  availableNow 
                    ? 'text-emerald-700 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Dostępny teraz
              </button>
            )}
          </div>

          {/* Prawa strona - sortowanie i widok + slot na dodatkowe akcje */}
          <div className="flex items-center gap-3">
            {/* Sortowanie */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-lg transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white/50 backdrop-blur-md hover:bg-white/70 border border-gray-200/30'
                    : isScrolled
                      ? 'bg-white/60 backdrop-blur-md hover:bg-white/80 border border-gray-200/40'
                      : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span>Sortuj:</span>
                <span className="font-medium">
                  {sortOptions.find(opt => opt.value === sortBy)?.label || 'Domyślne'}
                </span>
                <span className="text-xs">▼</span>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 min-w-[220px] bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm leading-snug hover:bg-gray-100 transition-colors ${
                        sortBy === option.value ? 'bg-indigo-50 text-indigo-800 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Przełącznik widoku – ukryty gdy hideViewSwitcher (renderowany nad listą / na mapie) */}
            {!hideViewSwitcher && (
              <div className={`flex items-center rounded-lg p-1 transition-all ${
                viewMode === 'map'
                  ? 'bg-white/50 backdrop-blur-md border border-gray-200/30'
                  : isScrolled
                    ? 'bg-white/60 backdrop-blur-md border border-gray-200/40'
                    : 'bg-gray-100'
              }`}>
                {viewModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => onViewModeChange(mode.value)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      viewMode === mode.value 
                        ? `${viewMode === 'map' ? 'bg-white/50' : isScrolled ? 'bg-white/60' : 'bg-white'} text-gray-900 shadow-sm` 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title={mode.label}
                  >
                    <mode.icon className="w-4 h-4 shrink-0" aria-hidden />
                  </button>
                ))}
              </div>
            )}

            {/* Wszystkie filtry */}
            <div className="ml-auto">{rightExtra}</div>
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
