import React, { useState, useRef, useEffect } from 'react';
import { sortCategoriesByOrder, sortSubcategories } from '../constants/categoryOrder';

// Mapowanie nazw kategorii
const getCategoryName = (slug) => {
  if (!slug) return '';
  const normalized = slug.replace(/_/g, '-');
  const categoryNames = {
    'hydraulika': 'Hydraulika',
    'elektryka': 'Elektryka',
    'agd': 'AGD i RTV',
    'agd-rtv': 'AGD i RTV',
    'klima_ogrz': 'Klimatyzacja i ogrzewanie',
    'klimatyzacja-ogrzewanie': 'Klimatyzacja i ogrzewanie',
    'remont': 'Remont i wykończenia',
    'remont-wykonczenia': 'Remont i wykończenia',
    'montaz': 'Montaż i stolarka',
    'stol_montaz': 'Montaż i stolarka',
    'stolarstwo-montaz': 'Montaż i stolarka',
    'slusarz': 'Ślusarz i zabezpieczenia',
    'slusarz-zabezpieczenia': 'Ślusarz i zabezpieczenia',
    'sprzatanie': 'Sprzątanie',
    'ogrod': 'Dom i ogród',
    'dom-ogrod': 'Dom i ogród',
    'auto_mobilne': 'Auto mobilnie',
    'auto-mobilne': 'Auto mobilnie',
    'it_smart': 'IT i Smart home',
    'it': 'IT i Smart home',
    'zdrowie': 'Zdrowie (tele)',
    'zwierzeta': 'Zwierzęta (tele)',
    'dezynsekcja-szkodniki': 'Dezynsekcja / szkodniki',
    'przeprowadzki': 'Przeprowadzki i transport',
    'przeprowadzki-transport': 'Przeprowadzki i transport',
    'gaz': 'Gaz / instalacje',
    'wywoz-utylizacja': 'Wywóz / utylizacja',
    '24h': 'Awaryjne 24/7',
    'pomoc-24-7': 'Awaryjne 24/7',
    'zlota-raczka': 'Złota rączka',
    'codzienne-sprawy': 'Codzienne sprawy',
    'urzedy-formalnosci': 'Urzędy i formalności',
    'edukacja-korepetycje': 'Edukacja i korepetycje',
    'rower-hulajnoga': 'Rower / hulajnoga',
    'monitoring-alarms': 'Monitoring i alarmy',
    'akwarystyka': 'Akwarystyka',
    'wynajem': 'Wynajem',
    'architektura': 'Architektura',
    'inne': 'Inne / nie na liście'
  };
  if (categoryNames[normalized]) return categoryNames[normalized];
  return normalized
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export default function ServiceCategorySelector({ 
  value, 
  onChange, 
  label, 
  includeAll = true,
  userServices = [], // Usługi które provider ma zaznaczone
  orderCounts = {}, // Liczba zleceń per usługa: { "Hydraulik": 5, "Elektryk": 3 }
  showOnlyUserServices = false // Czy pokazywać tylko usługi providera
}) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const API = import.meta.env.VITE_API_URL || "";
        const limit = 1000;
        const servicesUrl = API ? `${API}/api/services?limit=${limit}` : `/api/services?limit=${limit}`;
        const res = await fetch(servicesUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          console.log('ServiceCategorySelector API response:', result);
          const servicesData = result.items || result || [];
          console.log('ServiceCategorySelector services data:', servicesData);
          setServices(servicesData);
          
          // Pogrupuj usługi według parent_slug
          const categoriesMap = {};
          servicesData.forEach(service => {
            const category = service.parent_slug || 'inne';
            if (!categoriesMap[category]) {
              categoriesMap[category] = {
                slug: category,
                name: getCategoryName(category),
                services: []
              };
            }
            categoriesMap[category].services.push(service);
          });
          
          const normalized = Object.values(categoriesMap).map(cat => ({
            ...cat,
            services: sortSubcategories({
              ...cat,
              services: cat.services
            })
          }));
          setCategories(sortCategoriesByOrder(normalized));
        }
      } catch (error) {
        console.error('Błąd pobierania usług:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

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

  const handleServiceSelect = (service) => {
    onChange(service.name_pl || service.name_en || service.name);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  const handleCategorySelect = (category) => {
    onChange(category.name);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  // Określ które kategorie/usługi pokazać
  const getDisplayItems = () => {
    // Jeśli showOnlyUserServices jest true, pokaż TYLKO usługi providera
    if (showOnlyUserServices && userServices.length > 0) {
      // Pobierz ID usług providera (obsługa zarówno obiektów jak i stringów)
      const userServiceIds = userServices.map(s => {
        if (typeof s === 'string') return s;
        return s._id || s;
      });
      
      // Znajdź kategorie które zawierają usługi providera
      const userCategories = new Set();
      userServices.forEach(service => {
        const serviceId = typeof service === 'string' ? service : (service._id || service);
        const serviceObj = services.find(s => {
          const sId = s._id || s;
          return String(sId) === String(serviceId);
        });
        if (serviceObj && serviceObj.parent_slug) {
          userCategories.add(serviceObj.parent_slug);
        }
      });
      
      // Filtruj kategorie i usługi - tylko te które provider ma zaznaczone
      const filteredCategories = categories
        .filter(cat => userCategories.has(cat.slug))
        .map(cat => ({
          ...cat,
          services: cat.services.filter(service => {
            const serviceId = service._id || service;
            return userServiceIds.some(userId => String(userId) === String(serviceId));
          })
        }))
        .filter(cat => cat.services.length > 0);
      
      return { type: 'categories', items: filteredCategories };
    }
    
    // W przeciwnym razie (showAllServices=true) pokaż WSZYSTKIE kategorie
    return { type: 'categories', items: categories };
  };

  const displayItems = getDisplayItems();
  // Jeśli showOnlyUserServices i nie ma usług, pokaż "Wybierz usługę", w przeciwnym razie "Wszystkie"
  const displayText = value || (includeAll ? "Wszystkie" : (showOnlyUserServices && userServices.length === 0 ? "Wybierz usługę" : "Wszystkie"));

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-slate-500">Ładowanie usług...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-left flex items-center justify-between"
      >
        <span>{displayText}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[600px] max-w-[90vw] max-h-96 overflow-hidden">
          <div className="flex">
            {/* Kolumna z kategoriami */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto max-h-96">
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white">
                  Kategorie
                </h3>
                {includeAll && (
                  <button
                    onClick={() => {
                      onChange("Wszystkie");
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                      value === "Wszystkie" ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    Wszystkie
                  </button>
                )}
                {displayItems.items.map((category) => {
                  // Policz zlecenia dla wszystkich usług w kategorii
                  const categoryOrderCount = category.services.reduce((sum, service) => {
                    const serviceName = service.name_pl || service.name_en || service.name;
                    return sum + (orderCounts[serviceName] || 0);
                  }, 0);
                  
                  return (
                    <button
                      key={category.slug}
                      onClick={() => handleCategorySelect(category)}
                      onMouseEnter={() => setHoveredCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 flex items-center justify-between ${
                        value === category.name ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span>{category.name}</span>
                      {categoryOrderCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {categoryOrderCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kolumna z podusługami */}
            <div className="w-2/3 overflow-y-auto max-h-96">
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white">
                  {hoveredCategory ? hoveredCategory.name : 'Wybierz kategorię'}
                </h3>
                {hoveredCategory && (
                  <div className="space-y-1">
                    {hoveredCategory.services.map((service) => {
                      const serviceName = service.name_pl || service.name_en || service.name;
                      const count = orderCounts[serviceName] || 0;
                      return (
                        <button
                          key={service._id}
                          onClick={() => handleServiceSelect(service)}
                          className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 flex items-center justify-between"
                        >
                          <span>{serviceName}</span>
                          {count > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
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
