import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from "react";
import {
  buildProviderServiceCategories,
  getExpandedSlugsForSelection,
} from "../utils/buildProviderServiceCategories";

function ManageServices() {
  
  const [availableServices, setAvailableServices] = useState([]);
  const [userServices, setUserServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // Kategorie rozwinięte

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const limit = 1000;
        const servicesUrl = apiUrl(`/api/services?limit=${limit}`);
        const userServicesUrl = apiUrl("/api/user-services");
        const categoriesUrl = apiUrl("/api/services/categories");
        let servicesRes, userServicesRes, categoriesRes;
        try {
          [servicesRes, userServicesRes, categoriesRes] = await Promise.all([
            fetch(servicesUrl),
            fetch(userServicesUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(categoriesUrl, { cache: 'no-store' })
          ]);
        } catch (fetchError) {
          console.error('❌ ManageServices: Błąd fetch:', fetchError);
          throw fetchError;
        }

        if (!servicesRes.ok) {
          const errorText = await servicesRes.text();
          console.error('❌ ManageServices: Błąd pobierania usług:', errorText.slice(0, 500));
          throw new Error('Nie udało się pobrać usług');
        }
        if (!categoriesRes.ok) {
          console.warn('⚠️ ManageServices: /api/services/categories zwróciło', categoriesRes.status);
        }

        if (!servicesRes.ok) {
          const errorText = await servicesRes.text();
          console.error('❌ ManageServices: Błąd pobierania usług:', servicesRes.status, servicesRes.statusText, errorText);
          throw new Error(`HTTP ${servicesRes.status}: ${servicesRes.statusText}`);
        }

        let servicesData, userServData, categoriesData;
        try {
          servicesData = await servicesRes.json();
        } catch (jsonError) {
          console.error('❌ ManageServices: Błąd parsowania usług:', jsonError);
          throw jsonError;
        }
        try {
          userServData = await userServicesRes.json();
        } catch {
          userServData = [];
        }
        try {
          categoriesData = await categoriesRes.json();
        } catch {
          categoriesData = { items: [] };
        }

        // API zwraca {items: [...], total: 50, hasMore: true}
        const services = Array.isArray(servicesData.items) ? servicesData.items : 
                        (Array.isArray(servicesData) ? servicesData : []);
        // user-services API zwraca bezpośrednio tablicę, nie obiekt
        const userServ = Array.isArray(userServData) ? userServData : (userServData.services || []);

        if (services.length === 0) {
          console.error('❌ ManageServices: Brak usług w odpowiedzi API');
        }

        setAvailableServices(services);
        setUserServices(userServ);

        const { mainCategories: mc, subcategories: sm } = buildProviderServiceCategories(
          services,
          categoriesData
        );
        setMainCategories(mc);
        setSubcategories(sm);
        setExpandedCategories(
          getExpandedSlugsForSelection(sm, userServ.map((u) => u._id))
        );

        if (mc.length === 0) {
          console.warn('⚠️ ManageServices: Brak kategorii - sprawdź strukturę danych usług');
        }

      } catch (err) {
        console.error("❌ ManageServices: Błąd podczas pobierania danych:", err);
        // Ustaw puste dane w przypadku błędu
        setAvailableServices([]);
        setUserServices([]);
        setMainCategories([]);
        setSubcategories({});
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(err => {
      console.error('❌ ManageServices: Nieobsłużony błąd w fetchData:', err);
      setLoading(false);
    });
  }, [token]);

  // Sprawdź czy kategoria główna jest zaznaczona (ma wszystkie podkategorie)
  const isMainCategorySelected = (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    if (categorySubs.length === 0) return false;
    
    return categorySubs.every(sub => 
      userServices.some(userService => userService._id === sub._id)
    );
  };

  // Sprawdź czy kategoria główna jest częściowo zaznaczona
  const isMainCategoryPartial = (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    if (categorySubs.length === 0) return false;
    
    const selectedCount = categorySubs.filter(sub => 
      userServices.some(userService => userService._id === sub._id)
    ).length;
    
    return selectedCount > 0 && selectedCount < categorySubs.length;
  };

  // Obsługa rozwijania/zwijania kategorii
  const toggleCategoryExpand = (categorySlug) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug);
      } else {
        newSet.add(categorySlug);
      }
      return newSet;
    });
  };

  // Obsługa zaznaczania/odznaczania głównej kategorii
  const handleMainCategoryToggle = async (categorySlug) => {
    const categorySubs = subcategories[categorySlug] || [];
    const isCurrentlySelected = isMainCategorySelected(categorySlug);
    
    // Rozwiń kategorię jeśli jest zwinięta
    if (!expandedCategories.has(categorySlug)) {
      setExpandedCategories(prev => new Set(prev).add(categorySlug));
    }
    
    if (isCurrentlySelected) {
      // Odznacz wszystkie podkategorie
      for (const sub of categorySubs) {
        await handleRemove(sub._id);
      }
    } else {
      // Zaznacz wszystkie podkategorie
      for (const sub of categorySubs) {
        if (!userServices.some(userService => userService._id === sub._id)) {
          await handleAdd(sub._id);
        }
      }
    }
  };

  const handleAdd = async (serviceId) => {
    try {
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(apiUrl(`/api/user-services/add/${serviceId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserServices(data.services);
      }
    } catch (err) {
      console.error("Błąd przy dodawaniu:", err);
    }
  };

  const handleRemove = async (serviceId) => {
    try {
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(apiUrl(`/api/user-services/${serviceId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserServices(data.services);
      }
    } catch (err) {
      console.error("Błąd przy usuwaniu:", err);
    }
  };

  
  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-700">Ładowanie usług...</p>
      </div>
    );
  }

  if (mainCategories.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 font-semibold mb-2">⚠️ Brak dostępnych kategorii usług</p>
        <p className="text-yellow-700 text-sm">
          Nie znaleziono żadnych kategorii usług. Skontaktuj się z administratorem.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--qs-color-bg-soft)] py-4 md:py-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
              Zarządzanie usługami
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              Wybierz kategorie usług, które chcesz oferować klientom. 
              <span className="font-medium"> Kliknij na nazwę kategorii lub przycisk strzałki, aby rozwinąć podkategorie.</span> 
              Po wybraniu kategorii automatycznie otrzymasz dostęp do wszystkich podusług w tej kategorii.
            </p>
          </div>

      <div className="space-y-4">
        {mainCategories.map((category) => {
          const categorySubs = subcategories[category.slug] || [];
          const isSelected = isMainCategorySelected(category.slug);
          const isPartial = isMainCategoryPartial(category.slug);
          const isExpanded = expandedCategories.has(category.slug);
          const showSubs = isExpanded; // widoczne gdy kategoria jest rozwinięta
          
          return (
            <div key={category._id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartial;
                    }}
                    onChange={() => handleMainCategoryToggle(category.slug)}
                    className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <label 
                    className="text-base md:text-lg font-semibold text-slate-900 cursor-pointer flex-1 hover:text-indigo-600 transition-colors"
                    onClick={() => toggleCategoryExpand(category.slug)}
                  >
                    {category.name_pl}
                  </label>
                  <span className="text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                    {categorySubs.length} {categorySubs.length === 1 ? 'usługa' : categorySubs.length < 5 ? 'usługi' : 'usług'}
                  </span>
                  {categorySubs.length > 0 && (
                    <button
                      onClick={() => toggleCategoryExpand(category.slug)}
                      className="ml-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      aria-label={isExpanded ? "Zwiń" : "Rozwiń"}
                    >
                      <svg
                        className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {categorySubs.length > 0 && (
                <div
                  className={`mt-4 ml-8 grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-300 ${
                    showSubs ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 hidden'
                  }`}
                >
                  {categorySubs.map((sub) => {
                    const isSubSelected = userServices.some(userService => userService._id === sub._id);
                    return (
                      <div 
                        key={sub._id} 
                        className={`flex items-center p-2 rounded-lg transition-colors ${
                          isSubSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSubSelected}
                          onChange={() => isSubSelected ? handleRemove(sub._id) : handleAdd(sub._id)}
                          className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer"
                        />
                        <label 
                          className="ml-3 text-sm text-slate-700 cursor-pointer flex-1" 
                          onClick={() => isSubSelected ? handleRemove(sub._id) : handleAdd(sub._id)}
                        >
                          {sub.name_pl}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

          {/* Podsumowanie wybranych usług */}
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Wybrane usługi 
              <span className="ml-2 text-indigo-600">({userServices.length})</span>
            </h3>
            {userServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userServices.map((service) => (
                  <div 
                    key={service._id} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <span className="text-sm text-slate-700 font-medium flex-1">{service.name_pl}</span>
                    <button
                      onClick={() => handleRemove(service._id)}
                      className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">Nie wybrano żadnych usług</p>
                <p className="text-slate-400 text-xs mt-1">Zaznacz kategorie powyżej, aby dodać usługi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageServices;