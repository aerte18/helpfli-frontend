import { useEffect, useMemo, useRef, useState } from "react";

function useDebouncedValue(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function ServiceAutocomplete({ value, onChange, onPick, onSearch, placeholder = "Czego szukasz?", className = "", showSearchButton = false, onEscape }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounced = useDebouncedValue(value, 150);
  const boxRef = useRef(null);

  // Popularne usługi do podpowiadania
  const popularServices = [
    "Hydraulika", "Elektryka", "AGD i RTV", "Klimatyzacja i ogrzewanie", "Remont i wykończenia", "Montaż i stolarka",
    "Ślusarz i zabezpieczenia", "Sprzątanie", "Ogród i zew.", "Auto mobilnie", "IT i Smart home", "Zdrowie (tele)",
    "Zwierzęta (tele)", "Dezynsekcja / szkodniki", "Przeprowadzki i transport", "Gaz / instalacje", "Wywóz / utylizacja", "Awaryjne 24/7"
  ];

  useEffect(() => {
    const controller = new AbortController();
    const q = (debounced || "").trim();
    
    // Jeśli pole jest puste, nie pokazuj żadnych podpowiedzi
    if (q.length === 0) {
      setItems([]);
      setOpen(false);
      return;
    }
    
    // Minimum 2 znaki do wyszukiwania
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    
    async function run() {
      try {
        // Użyj endpointu /api/services/suggest który zwraca kategorie i podkategorie
        const url = `/api/services/suggest?q=${encodeURIComponent(q)}&limit=10`;
        const res = await fetch(url, { signal: controller.signal });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        
        // Struktura odpowiedzi: { terms: [], services: [], subcategories: [] }
        const suggestions = [];
        
        // Dodaj podkategorie (najważniejsze - pokazują kategorię i podkategorię)
        if (data.subcategories && Array.isArray(data.subcategories)) {
          data.subcategories.forEach(subcat => {
            suggestions.push({
              type: 'subcategory',
              display: subcat.categoryName ? `${subcat.categoryName} → ${subcat.name}` : subcat.name,
              value: subcat.name,
              categoryName: subcat.categoryName,
              subcategoryName: subcat.name,
              id: subcat.id,
              categoryId: subcat.categoryId
            });
          });
        }
        
        // Dodaj usługi
        if (data.services && Array.isArray(data.services)) {
          data.services.forEach(service => {
            const displayName = service.name || service.slug;
            // Unikaj duplikatów jeśli już mamy podkategorię o tej samej nazwie
            if (!suggestions.some(s => s.value === displayName)) {
              suggestions.push({
                type: 'service',
                display: displayName,
                value: displayName,
                slug: service.slug,
                parent: service.parent
              });
            }
          });
        }
        
        // Dodaj terminy jako ostatnie
        if (data.terms && Array.isArray(data.terms)) {
          data.terms.forEach(term => {
            const termValue = term.term || term;
            if (!suggestions.some(s => s.value === termValue)) {
              suggestions.push({
                type: 'term',
                display: termValue,
                value: termValue
              });
            }
          });
        }
        
        // Fallback do popularnych usług jeśli brak wyników
        if (suggestions.length === 0) {
          const matchingPopular = popularServices.filter(service => 
            service.toLowerCase().includes(q.toLowerCase())
          );
          matchingPopular.forEach(service => {
            suggestions.push({
              type: 'popular',
              display: service,
              value: service
            });
          });
        }
        
        setItems(suggestions.slice(0, 10));
        setOpen(true);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.warn('ServiceAutocomplete fetch error:', e);
          // Fallback do popularnych usług pasujących do wyszukiwania
          const matchingPopular = popularServices.filter(service => 
            service.toLowerCase().includes(q.toLowerCase())
          ).map(service => ({
            type: 'popular',
            display: service,
            value: service
          }));
          setItems(matchingPopular.slice(0, 8));
          setOpen(true);
        }
      }
    }
    run();
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e) => {
      // Nie zamykaj listy jeśli kliknięto na przycisk wyszukiwania
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
        setSelectedIndex(-1);
      } else if (e.target.closest('button[aria-label="Wyszukaj"]')) {
        // Jeśli kliknięto przycisk wyszukiwania, nie zamykaj listy tutaj - zostanie to zrobione w handleSearch
        return;
      }
    };
    document.addEventListener("click", onDoc, true); // Use capture phase
    return () => document.removeEventListener("click", onDoc, true);
  }, []);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (items.length > 0) {
          setOpen(true);
          setSelectedIndex(prev => prev < items.length - 1 ? prev + 1 : 0);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (items.length > 0) {
          setOpen(true);
          setSelectedIndex(prev => prev > 0 ? prev - 1 : items.length - 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (open && selectedIndex >= 0 && items[selectedIndex]) {
          // Jeśli jest wybrana opcja z listy, użyj jej
          const item = items[selectedIndex];
          const valueToPick = typeof item === 'string' ? item : item.value || item.display;
          onPick(valueToPick);
          setOpen(false);
          setSelectedIndex(-1);
        } else if (value && value.trim()) {
          // Jeśli nie ma wybranej opcji, ale jest tekst, użyj go
          if (onSearch) {
            onSearch(value.trim());
          } else {
            onPick(value.trim());
          }
          setOpen(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSelectedIndex(-1);
        if (onEscape) {
          onEscape();
        }
        break;
    }
  };

  const handleItemClick = (item) => {
    const valueToPick = typeof item === 'string' ? item : item.value || item.display;
    onPick(valueToPick);
    setOpen(false);
    setSelectedIndex(-1);
  };

  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔍 handleSearch called, value:', value);
    setOpen(false);
    
    // Nawet jeśli pole jest puste, wywołaj callback (może użytkownik chce zobaczyć wszystkich providerów)
    if (value && value.trim()) {
      console.log('🔍 Calling onSearch with:', value.trim());
      if (onSearch) {
        onSearch(value.trim());
      } else if (onPick) {
        onPick(value.trim());
      }
    } else {
      console.log('🔍 No value - calling onSearch with empty string to clear filters');
      // Wywołaj z pustym stringiem, aby wyczyścić filtry wyszukiwania
      if (onSearch) {
        onSearch('');
      } else if (onPick) {
        onPick('');
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (value && value.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          style={{ paddingRight: showSearchButton ? '2.5rem' : '1rem' }}
          autoComplete="off"
        />
        {showSearchButton && (
          <button
            type="button"
            onClick={(e) => {
              console.log('🔍 Button clicked!', value);
              handleSearch(e);
            }}
            onMouseDown={(e) => {
              console.log('🔍 Button mousedown');
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              console.log('🔍 Button mouseup');
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors cursor-pointer" 
            style={{ 
              color: 'var(--muted-foreground)',
              pointerEvents: 'auto',
              zIndex: 50,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'} 
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
            aria-label="Wyszukaj"
            tabIndex={0}
          >
            🔍
          </button>
        )}
      </div>
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {items.map((item, idx) => {
            const displayText = typeof item === 'string' ? item : item.display || item.value;
            const itemType = typeof item === 'string' ? 'term' : item.type || 'term';
            
            return (
              <li
                key={`${itemType}-${idx}-${displayText}`}
                className={`cursor-pointer px-4 py-2 hover:bg-gray-50 transition-colors text-gray-900 ${
                  idx === selectedIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                {itemType === 'subcategory' && item.categoryName ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{item.subcategoryName}</span>
                    <span className="text-xs text-gray-500">{item.categoryName}</span>
                  </div>
                ) : (
                  <span>{displayText}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}