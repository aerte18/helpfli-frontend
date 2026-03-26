import { apiUrl } from "@/lib/apiUrl";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IconByCategory } from "./icons/HelpfliCategoryIcons";
import { UI } from "../i18n/pl_ui";
import { sortCategoriesByOrder, sortSubcategories } from "../constants/categoryOrder";
import { SERVICES_CATALOG } from "../constants/servicesCatalog";

export default function ServiceCategoryDropdown({ 
  onCategorySelect, 
  placeholder = UI.sectionAreas,
  className = "",
  showIcon = true,
  clearTrigger = 0,
  providerServices = [], // usługi wybranego providera (dla zleceń bezpośrednich)
  showOnlyProviderServices = false // czy pokazywać tylko usługi providera
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [allServices, setAllServices] = useState([]); // wszystkie usługi z API (do mapowania)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reaguj na clearTrigger - czyść wybrane kategorie
  useEffect(() => {
    if (clearTrigger > 0) {
      console.log('🧹 ServiceCategoryDropdown - clearing selection, clearTrigger:', clearTrigger);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setIsOpen(false);
      setHoveredCategory(null);
    }
  }, [clearTrigger]);

  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let ignore = false;
    
    // NAJPIERW załaduj fallback natychmiast, żeby użytkownik widział kategorie od razu
    try {
      const fallbackCategories = SERVICES_CATALOG.map(cat => ({
        id: cat.id,
        slug: cat.id,
        name: cat.label,
        label: cat.label,
        subcategories: (cat.children || []).map(sub => ({
          id: sub.slug,
          slug: sub.slug,
          name: sub.label,
          label: sub.label
        }))
      }));
      const enriched = fallbackCategories.map(cat => ({
        ...cat,
        subcategories: sortSubcategories(cat)
      }));
      setServiceCategories(sortCategoriesByOrder(enriched));
      setLoading(false); // Od razu pokaż kategorie
      console.log('✅ ServiceCategoryDropdown - fallback catalog loaded immediately:', enriched.length);
    } catch (fallbackError) {
      console.error('ServiceCategoryDropdown - immediate fallback failed:', fallbackError);
    }
    
    // POTEM spróbuj zaktualizować z API w tle
    (async () => {
      try {
        setError('');
        
        // Timeout dla fetch - jeśli nie odpowiada w 3 sekundy, zostaw fallback
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout - backend nie odpowiada')), 3000)
        );
        
        // Użyj proxy Vite (relatywny URL) - Vite automatycznie przekieruje do backendu
        // Spróbuj najpierw /api/services/categories (zawiera parent_slug z usług), potem /api/categories (statyczne)
        // ZAWSZE używaj relatywnego URL (proxy Vite), żeby uniknąć problemów z CORS
        // Dodaj cache-busting, żeby uniknąć problemów z cache przeglądarki
        const cacheBuster = `?_t=${Date.now()}`;
        let apiUrl = `/api/services/categories${cacheBuster}`;
        console.log('ServiceCategoryDropdown - fetching from:', apiUrl);
        
        let res;
        try {
          res = await Promise.race([
            fetch(apiUrl, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }),
            timeoutPromise
          ]);
          console.log('ServiceCategoryDropdown - response status:', res.status);
        } catch (fetchError) {
          console.warn('ServiceCategoryDropdown - fetch failed or timeout:', fetchError.message);
          throw fetchError; // Przejdź do fallback
        }
        
        // Jeśli /api/services/categories nie działa, spróbuj /api/categories
        if (!res.ok) {
          console.warn('ServiceCategoryDropdown - /api/services/categories failed, trying /api/categories');
          apiUrl = `/api/categories${cacheBuster}`;
          try {
            res = await Promise.race([
              fetch(apiUrl, {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              }),
              timeoutPromise
            ]);
            console.log('ServiceCategoryDropdown - /api/categories response status:', res.status);
          } catch (fetchError2) {
            console.warn('ServiceCategoryDropdown - /api/categories also failed:', fetchError2.message);
            throw fetchError2; // Przejdź do fallback
          }
        }
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          console.error('ServiceCategoryDropdown - error response:', errorText);
          // Przejdź do fallback zamiast zwracać pustą listę
          throw new Error('API zwróciło błąd');
        }
        
        const text = await res.text();
        if (!text || text.trim() === '') {
          throw new Error('Pusta odpowiedź z serwera');
        }
        
        const data = JSON.parse(text);
        console.log('ServiceCategoryDropdown - response data:', data);
        // Obsłuż różne formaty odpowiedzi
        let categories = [];
        if (Array.isArray(data)) {
          categories = data;
        } else if (data.items && Array.isArray(data.items)) {
          categories = data.items;
        } else if (data.categories && Array.isArray(data.categories)) {
          categories = data.categories;
        } else if (data.success && data.items) {
          categories = data.items;
        }
        
        // Upewnij się że kategorie mają strukturę z podkategoriami
        categories = categories.map(cat => {
          // Jeśli kategoria ma już subcategories, zostaw jak jest
          if (cat.subcategories && Array.isArray(cat.subcategories)) {
            return {
              ...cat,
              subcategories: sortSubcategories({
                ...cat,
                services: cat.subcategories
              })
            };
          }
          // Jeśli nie ma, dodaj pustą tablicę
          return {
            ...cat,
            subcategories: []
          };
        });
        
        console.log('ServiceCategoryDropdown - parsed categories:', categories.length, 'with subcategories:', categories.filter(c => c.subcategories?.length > 0).length);
        console.log('ServiceCategoryDropdown - first category:', categories[0]);
        if (!ignore) {
                const enriched = categories.map(cat => ({
                  ...cat,
                  subcategories: sortSubcategories(cat)
                }));
                setServiceCategories(sortCategoriesByOrder(enriched));
          setError(''); // Wyczyść błąd, jeśli dane są poprawne
          if (categories.length === 0) {
            console.warn('ServiceCategoryDropdown - no categories found in response');
            setError('Brak kategorii w odpowiedzi');
          } else {
            console.log('✅ ServiceCategoryDropdown - categories loaded successfully:', categories.length);
          }
        }
      } catch (e) {
        console.error('ServiceCategoryDropdown - error:', e);
        // Fallback do statycznego katalogu - ZAWSZE uruchom, nawet jeśli API nie działa
        if (!ignore) {
          console.warn('ServiceCategoryDropdown - using static catalog fallback');
          try {
            // Konwertuj SERVICES_CATALOG do formatu używanego przez komponent
            const fallbackCategories = SERVICES_CATALOG.map(cat => ({
              id: cat.id,
              slug: cat.id,
              name: cat.label,
              label: cat.label,
              subcategories: (cat.children || []).map(sub => ({
                id: sub.slug,
                slug: sub.slug,
                name: sub.label,
                label: sub.label
              }))
            }));
            const enriched = fallbackCategories.map(cat => ({
              ...cat,
              subcategories: sortSubcategories(cat)
            }));
            setServiceCategories(sortCategoriesByOrder(enriched));
            setError(''); // Wyczyść błąd, jeśli fallback działa
            setLoading(false); // WAŻNE: zawsze ustaw loading na false
            console.log('✅ ServiceCategoryDropdown - fallback catalog loaded:', enriched.length);
          } catch (fallbackError) {
            console.error('ServiceCategoryDropdown - fallback also failed:', fallbackError);
            setError('Nie udało się załadować kategorii');
            setServiceCategories([]);
            setLoading(false); // WAŻNE: zawsze ustaw loading na false
          }
        }
      } finally {
        if (!ignore) setLoading(false); // Podwójne zabezpieczenie - zawsze ustaw loading na false
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Pobierz wszystkie usługi z API (do mapowania ID usług providera do slugów)
  useEffect(() => {
    if (showOnlyProviderServices && providerServices.length > 0) {
      (async () => {
        try {
          const API = import.meta.env.VITE_API_URL || '';
          const res = await fetch(apiUrl(`/api/services?limit=1000`));
          if (res.ok) {
            const data = await res.json();
            const services = data.items || data || [];
            setAllServices(services);
          }
        } catch (error) {
          console.error('Błąd pobierania usług:', error);
        }
      })();
    }
  }, [showOnlyProviderServices, providerServices.length]);

  // Filtruj kategorie na podstawie usług providera
  const filteredCategories = useMemo(() => {
    // Jeśli nie filtrujemy po usługach providera, zwróć wszystkie kategorie
    if (!showOnlyProviderServices) {
      return serviceCategories;
    }
    
    // Jeśli filtrujemy, ale provider nie ma usług, zwróć pustą listę
    if (providerServices.length === 0) {
      return [];
    }

    // Jeśli nie ma jeszcze wszystkich usług, zwróć puste (poczekaj na załadowanie)
    if (allServices.length === 0 && serviceCategories.length > 0) {
      // Spróbuj dopasować po nazwach jeśli nie ma slugów
      const providerServiceNames = providerServices.map(s => {
        const name = s.name_pl || s.name || s.name_en || '';
        return name.toLowerCase();
      });

      return serviceCategories
        .map(category => {
          const filteredSubcategories = (category.subcategories || []).filter(sub => {
            const subName = (sub.name || sub.label || '').toLowerCase();
            return providerServiceNames.some(psn => 
              subName.includes(psn) || 
              psn.includes(subName) ||
              subName === psn
            );
          });

          if (filteredSubcategories.length > 0) {
            return {
              ...category,
              subcategories: filteredSubcategories
            };
          }
          return null;
        })
        .filter(cat => cat !== null);
    }

    if (allServices.length === 0) {
      return [];
    }

    // Pobierz usługi providera z API
    const providerServiceIds = providerServices.map(s => String(s._id || s.id || s));
    const providerServicesFromAPI = allServices.filter(s => 
      providerServiceIds.includes(String(s._id || s.id))
    );

    if (providerServicesFromAPI.length === 0) {
      return [];
    }

    // Utwórz mapę: parent_slug -> [slug1, slug2, ...]
    const servicesByCategory = {};
    providerServicesFromAPI.forEach(service => {
      const parentSlug = (service.parent_slug || '').toLowerCase();
      const serviceSlug = (service.slug || '').toLowerCase();
      if (parentSlug) {
        if (!servicesByCategory[parentSlug]) {
          servicesByCategory[parentSlug] = [];
        }
        servicesByCategory[parentSlug].push(serviceSlug);
      }
    });

    // Filtruj kategorie i podkategorie
    return serviceCategories
      .map(category => {
        const categorySlug = (category.slug || category.id || '').toLowerCase();
        const categoryServices = servicesByCategory[categorySlug] || [];

        if (categoryServices.length === 0) {
          return null;
        }

        // Filtruj podkategorie - tylko te które mają slug pasujący do usług providera
        const filteredSubcategories = (category.subcategories || []).filter(sub => {
          const subSlug = (sub.slug || sub.id || '').toLowerCase();
          const subName = (sub.name || sub.label || '').toLowerCase();
          
          // Sprawdź czy slug podkategorii pasuje do slugów usług providera
          return categoryServices.some(serviceSlug => {
            return (
              serviceSlug === subSlug || 
              serviceSlug.includes(subSlug) || 
              subSlug.includes(serviceSlug) ||
              serviceSlug === subName ||
              serviceSlug.includes(subName) ||
              subName.includes(serviceSlug)
            );
          });
        });

        // Zwróć kategorię tylko jeśli ma przynajmniej jedną podkategorię
        if (filteredSubcategories.length > 0) {
          return {
            ...category,
            subcategories: filteredSubcategories
          };
        }
        return null;
      })
      .filter(cat => cat !== null);
  }, [serviceCategories, providerServices, allServices, showOnlyProviderServices]);

  const handleCategorySelect = (category, subcategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setIsOpen(false);
    setHoveredCategory(null);
    
    if (onCategorySelect) {
      onCategorySelect({
        category: category.name,
        subcategory: subcategory?.name,
        categoryId: category.id,
        subcategoryId: subcategory?.id,
        categorySlug: category.slug || category.id,
        subcategorySlug: subcategory?.slug || subcategory?.id,
        keywords: subcategory?.keywords
      });
    }
  };

  // Zawsze pokazuj placeholder jeśli nie ma wybranej kategorii
  const displayText = selectedCategory && selectedCategory.name
    ? selectedCategory.name
    : placeholder;

  // Użyj przefiltrowanych kategorii jeśli jest filtrowanie, w przeciwnym razie wszystkie
  const categoriesToDisplay = showOnlyProviderServices ? filteredCategories : serviceCategories;

  // Zastosuj lokalne filtrowanie po wpisanym tekście (kategoria lub podkategoria)
  const searchTermLower = searchTerm.trim().toLowerCase();
  const categoriesWithSearch = useMemo(() => {
    if (!searchTermLower) return categoriesToDisplay;

    return categoriesToDisplay
      .map((category) => {
        const matchesCategory = (category.name || category.label || '')
          .toLowerCase()
          .includes(searchTermLower);

        const matchedSubcategories = (category.subcategories || []).filter((sub) =>
          (sub.name || sub.label || '').toLowerCase().includes(searchTermLower)
        );

        if (matchesCategory || matchedSubcategories.length > 0) {
          return {
            ...category,
            subcategories: matchedSubcategories.length > 0 ? matchedSubcategories : category.subcategories,
          };
        }
        return null;
      })
      .filter((c) => c !== null);
  }, [categoriesToDisplay, searchTermLower]);

  // Debug: loguj stan komponentu
  console.log('ServiceCategoryDropdown render:', { 
    loading, 
    error, 
    categoriesCount: serviceCategories.length,
    filteredCount: filteredCategories.length,
    hasSubcategories: serviceCategories.filter(c => c.subcategories?.length > 0).length,
    showOnlyProviderServices,
    providerServicesCount: providerServices.length
  });

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center px-4 py-3 bg-white border border-gray-300 rounded-lg`}>
        <span className="text-gray-500 text-sm">Ładowanie kategorii…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center px-4 py-3 bg-red-50 border border-red-300 rounded-lg`}>
        <span className="text-red-600 text-sm">Błąd: {error}</span>
      </div>
    );
  }
  if (serviceCategories.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg`}>
        <span className="text-yellow-600 text-sm">Brak kategorii (załadowano: {serviceCategories.length})</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Przycisk główny */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between ${
          className?.includes('h-12') 
            ? 'h-12 px-4 text-base' 
            : className?.includes('text-sm') 
            ? 'px-3 py-2 text-sm' 
            : 'px-4 py-3'
        } bg-white border border-gray-300 rounded-lg hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
      >
        <div className="flex items-center gap-3">
          {showIcon && selectedCategory && (
            <IconByCategory id={selectedCategory.id} className="h-5 w-5" />
          )}
          <span className="text-gray-700 truncate">{displayText}</span>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[800px] max-h-96 overflow-hidden">
          <div className="flex">
            {/* Lista głównych kategorii */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto max-h-96">
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white">
                  {UI.sectionAreas}
                </h3>
                <div className="mb-2 sticky top-6 bg-white pt-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      // po wpisaniu ustaw hover na null, żeby prawa kolumna pokazywała wynik dopiero po wyborze
                      setHoveredCategory(null);
                    }}
                    placeholder="Wpisz nazwę usługi…"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {categoriesToDisplay.length === 0 && showOnlyProviderServices ? (
                  <div className="text-sm text-gray-500 italic px-3 py-4 text-center">
                    Wybrany wykonawca nie ma jeszcze przypisanych usług
                  </div>
                ) : (
                  <div className="space-y-1">
                    {categoriesWithSearch.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setHoveredCategory(category)}
                        onMouseEnter={() => setHoveredCategory(category)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                          hoveredCategory?.id === category.id
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IconByCategory id={category.id} className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lista podkategorii */}
            <div className="w-2/3 overflow-y-auto max-h-96">
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white">
                  {hoveredCategory ? hoveredCategory.name : UI.sectionAreas}
                </h3>
                {hoveredCategory ? (
                  <div className="space-y-1">
                    {hoveredCategory.subcategories && hoveredCategory.subcategories.length > 0 ? (
                      hoveredCategory.subcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleCategorySelect(hoveredCategory, subcategory)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors"
                        >
                          {subcategory.name}
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic px-3 py-2">
                        Brak podkategorii dla {hoveredCategory.name}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic px-3 py-2">
                    Wybierz kategorię z lewej strony
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



