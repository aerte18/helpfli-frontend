import { useState, useEffect } from 'react';
import ServiceCategoryDropdown from './ServiceCategoryDropdown';

export default function AdvancedFilters({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  maxDistance,
  onMaxDistanceChange,
  userLocation,
  locationError,
  onRequestLocation,
  onApply, 
  onClear 
}) {
  const [localFilters, setLocalFilters] = useState(filters || {});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Resetuj localFilters tylko gdy drawer się otwiera (nie przy każdej zmianie filters)
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setLocalFilters(filters || {});
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, filters, isInitialized]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onFiltersChange({});
    onClear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--qs-color-border)] bg-[var(--qs-color-bg-soft)]">
            <h2 className="text-lg font-semibold text-[var(--qs-color-text)]">Filtry zaawansowane</h2>
            <button
              onClick={onClose}
              className="text-[var(--qs-color-muted)] hover:text-[var(--qs-color-text)] transition-colors rounded-full p-1 hover:bg-white"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Kategoria usługi */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Kategoria usługi</h3>
              <ServiceCategoryDropdown
                onCategorySelect={(categoryData) => {
                  handleFilterChange('category', categoryData.category);
                  handleFilterChange('subcategory', categoryData.subcategory);
                  handleFilterChange('categoryId', categoryData.categoryId);
                  handleFilterChange('subcategoryId', categoryData.subcategoryId);
                }}
                placeholder="Wybierz kategorię"
                showIcon={false}
              />
            </div>

            {/* Ocena */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Minimalna ocena</h3>
              <div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={localFilters.minRating || 0}
                  onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[var(--qs-color-muted)] mt-1.5">
                  <span>0.0 ⭐</span>
                  <span className="font-semibold text-[var(--qs-color-text)]">
                    {localFilters.minRating ? `${localFilters.minRating.toFixed(1)} ⭐` : 'Dowolna'}
                  </span>
                  <span>5.0 ⭐</span>
                </div>
              </div>
            </div>

            {/* Poziom/Tier */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Poziom wykonawcy</h3>
              <select
                value={localFilters.level || 'any'}
                onChange={(e) => handleFilterChange('level', e.target.value === 'any' ? null : e.target.value)}
                className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="any">Wszystkie</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="pro">TOP</option>
              </select>
            </div>

            {/* Stawka wykonawcy (cena za usługę) */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-1">Stawka wykonawcy</h3>
              <p className="text-xs text-[var(--qs-color-muted)] mb-3">
                Tylko wykonawcy, których cena za usługę mieści się w podanym przedziale (zł).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--qs-color-muted)] mb-1.5 font-medium">Min (zł)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={localFilters.budgetMin ?? ''}
                    onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--qs-color-muted)] mb-1.5 font-medium">Max (zł)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={localFilters.budgetMax ?? ''}
                    onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
                    placeholder="Bez limitu"
                    className="w-full px-3 py-2 border border-[var(--qs-color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Dostępność */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Dostępność</h3>
              <div className="space-y-2">
                {[
                  { value: 'now', label: 'Dostępny teraz' },
                  { value: 'today', label: 'Dziś' },
                  { value: 'tomorrow', label: 'Jutro' },
                  { value: 'offline', label: 'Niedostępny' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="availability"
                      value={option.value}
                      checked={localFilters.available === option.value}
                      onChange={(e) => handleFilterChange('available', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-[var(--qs-color-text)]">{option.label}</span>
                  </label>
                ))}
                <p className="text-xs text-[var(--qs-color-muted)] mt-2">
                  Opcje "Dziś" i "Jutro" pokazują tylko wykonawców korzystających z harmonogramu (kalendarza).
                </p>
              </div>
            </div>

            {/* Zasięg */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Zasięg</h3>
              <div>
                <label className="block text-xs text-[var(--qs-color-muted)] mb-1.5 font-medium">Maksymalna odległość (km)</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxDistance || 10}
                  onChange={(e) => onMaxDistanceChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[var(--qs-color-muted)] mt-1.5">
                  <span>1 km</span>
                  <span className="font-semibold text-[var(--qs-color-text)]">{maxDistance || 10} km</span>
                  <span>50 km</span>
                </div>
                
                {/* Status geolokalizacji */}
                <div className="mt-2 text-xs">
                  {userLocation ? (
                    <div className="text-green-600 flex items-center gap-1">
                      <span>📍</span>
                      <span>Lokalizacja: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                    </div>
                  ) : locationError ? (
                    <div className="text-red-600 flex items-center gap-1">
                      <span>❌</span>
                      <span>{locationError}</span>
                      <button 
                        onClick={onRequestLocation}
                        className="text-blue-600 hover:underline ml-1"
                      >
                        Spróbuj ponownie
                      </button>
                    </div>
                  ) : (
                    <div className="text-yellow-600 flex items-center gap-1">
                      <span>⏳</span>
                      <span>Pobieranie lokalizacji...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metoda płatności */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Metoda płatności</h3>
              <p className="text-xs text-[var(--qs-color-muted)] mb-2">
                Pokaż wykonawców, którzy akceptują wybraną metodę płatności.
              </p>
              <div className="space-y-2">
                {[
                  { value: null, label: 'Wszystkie' },
                  { value: 'system', label: 'Tylko Helpfli (z gwarancją)' },
                  { value: 'external', label: 'Tylko poza systemem' },
                  { value: 'both', label: 'Oba – Helpfli i poza systemem' }
                ].map((option) => (
                  <label key={String(option.value ?? 'any')} className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value={String(option.value ?? '')}
                      checked={(localFilters.paymentType ?? null) === option.value}
                      onChange={(e) => handleFilterChange('paymentType', e.target.value === '' ? null : e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-[var(--qs-color-text)]">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rodzaj usługodawcy */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Rodzaj usługodawcy</h3>
              <div className="space-y-2">
                {[
                  { value: false, label: 'Osoba prywatna' },
                  { value: true, label: 'Firma' },
                  { value: null, label: 'Oba typy' }
                ].map((option) => (
                  <label key={String(option.value)} className="flex items-center">
                    <input
                      type="radio"
                      name="clientType"
                      value={String(option.value)}
                      checked={localFilters.b2b === option.value}
                      onChange={(e) => {
                        const val = e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
                        handleFilterChange('b2b', val);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-[var(--qs-color-text)]">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dodatkowe opcje */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--qs-color-text)] mb-3">Dodatkowe opcje</h3>
              <div className="space-y-2">
                {[
                  { key: 'instantChat', label: 'Chat natychmiastowy' }
                ].map((option) => (
                  <label key={option.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters[option.key] || false}
                      onChange={(e) => handleFilterChange(option.key, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-[var(--qs-color-text)]">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[var(--qs-color-border)] bg-[var(--qs-color-bg-soft)] flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 qs-btn qs-btn-outline text-sm !px-5 !py-2.5"
            >
              Wyczyść
            </button>
            <button
              onClick={handleApply}
              className="flex-1 qs-btn qs-btn-primary text-sm !px-5 !py-2.5"
            >
              Zastosuj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
