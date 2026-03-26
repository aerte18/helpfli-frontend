import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Mapowanie nazw kategorii
const getCategoryName = (slug) => {
  const categoryNames = {
    'hydraulika': 'Hydraulika',
    'elektryka': 'Elektryka', 
    'agd': 'AGD i RTV',
    'agd_rtv': 'AGD i RTV',
    'klima_ogrz': 'Klimatyzacja i ogrzewanie',
    'remont': 'Remont i wykończenia',
    'montaz': 'Montaż i stolarka',
    'stol_montaz': 'Montaż i stolarka',
    'slusarz': 'Ślusarz i zabezpieczenia',
    'sprzatanie': 'Sprzątanie',
    'ogrod': 'Ogród i zew.',
    'auto_mobilne': 'Auto mobilnie',
    'it_smart': 'IT i Smart home',
    'zdrowie': 'Zdrowie (tele)',
    'zwierzeta': 'Zwierzęta (tele)',
    'pest': 'Dezynsekcja / szkodniki',
    'przeprowadzki': 'Przeprowadzki i transport',
    'gaz': 'Gaz / instalacje',
    'odpady': 'Wywóz / utylizacja',
    '24h': 'Awaryjne 24/7',
    'okna_drzwi': 'Okna i drzwi',
    'dach_rzyg': 'Dach i rynny',
    'podlogi': 'Podłogi',
    'mal_tap': 'Malowanie/Tapety',
    'inne': 'Inne / nie na liście'
  };
  return categoryNames[slug] || slug;
};

export default function ServiceManager({ user, onServicesUpdate }) {
  const { fetchMe } = useAuth();
  const [allServices, setAllServices] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [userServices, setUserServices] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pobierz wszystkie dostępne usługi i pogrupuj według kategorii
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const API = import.meta.env.VITE_API_URL || "";
        const res = await fetch(apiUrl(`/api/services`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          const services = result.items || result || [];
          setAllServices(services);
          
          // Pogrupuj usługi według parent_slug
          const categories = {};
          services.forEach(service => {
            const category = service.parent_slug || 'inne';
            if (!categories[category]) {
              categories[category] = {
                slug: category,
                name: getCategoryName(category),
                services: []
              };
            }
            categories[category].services.push(service);
          });
          
          setMainCategories(Object.values(categories));
        }
      } catch (error) {
        console.error('Błąd pobierania usług:', error);
      }
    };

    fetchServices();
  }, []);

  // Pobierz usługi użytkownika i konwertuj na kategorie
  useEffect(() => {
    const fetchUserServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const API = import.meta.env.VITE_API_URL || "";
        const res = await fetch(apiUrl(`/api/user-services`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const services = await res.json();
          const serviceIds = services.map(s => s._id || s.id);
          setUserServices(serviceIds);
          
          // Konwertuj usługi na kategorie
          const userCategoriesSet = new Set();
          serviceIds.forEach(serviceId => {
            const service = allServices.find(s => s._id === serviceId);
            if (service && service.parent_slug) {
              userCategoriesSet.add(service.parent_slug);
            }
          });
          setUserCategories(Array.from(userCategoriesSet));
        }
      } catch (error) {
        console.error('Błąd pobierania usług użytkownika:', error);
      } finally {
        setLoading(false);
      }
    };

    if (allServices.length > 0) {
      fetchUserServices();
    }
  }, [allServices]);

  const toggleCategory = (categorySlug) => {
    setUserCategories(prev => {
      const isSelected = prev.includes(categorySlug);
      if (isSelected) {
        // Usuń kategorię i wszystkie jej usługi
        const category = mainCategories.find(c => c.slug === categorySlug);
        const categoryServiceIds = category ? category.services.map(s => s._id) : [];
        setUserServices(prevServices => 
          prevServices.filter(id => !categoryServiceIds.includes(id))
        );
        return prev.filter(slug => slug !== categorySlug);
      } else {
        // Dodaj kategorię i wszystkie jej usługi
        const category = mainCategories.find(c => c.slug === categorySlug);
        const categoryServiceIds = category ? category.services.map(s => s._id) : [];
        setUserServices(prevServices => 
          [...prevServices, ...categoryServiceIds.filter(id => !prevServices.includes(id))]
        );
        return [...prev, categorySlug];
      }
    });
  };

  const toggleService = (serviceId) => {
    setUserServices(prev => {
      const isSelected = prev.includes(serviceId);
      if (isSelected) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const saveServices = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || "";
      const res = await fetch(apiUrl(`/api/user-services`), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ services: userServices })
      });

      if (res.ok) {
        // Zaktualizuj główną usługę (pierwsza wybrana kategoria)
        if (userCategories.length > 0) {
          const firstCategoryName = getCategoryName(userCategories[0]);
          await fetch(apiUrl(`/api/users/me/profile`), {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ service: firstCategoryName })
          });
        }

        onServicesUpdate?.(userServices);
        
        // Odśwież dane użytkownika w kontekście
        console.log('ServiceManager: Odświeżanie danych użytkownika...');
        await fetchMe();
        console.log('ServiceManager: Dane użytkownika odświeżone');
        
        alert('Usługi zostały zaktualizowane!');
      } else {
        throw new Error('Błąd zapisywania usług');
      }
    } catch (error) {
      console.error('Błąd zapisywania usług:', error);
      alert('Nie udało się zapisać usług');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Ładowanie usług...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Kategorie usług które świadczysz</h3>
        <p className="text-sm text-gray-600 mb-4">
          Wybierz kategorie usług, które chcesz oferować klientom. Po wybraniu kategorii automatycznie otrzymasz dostęp do wszystkich podusług w tej kategorii. Pierwsza wybrana kategoria będzie twoją główną specjalizacją.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {mainCategories.map((category) => {
          const isSelected = userCategories.includes(category.slug);
          return (
            <button
              key={category.slug}
              onClick={() => toggleCategory(category.slug)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium block">{category.name}</span>
                  <span className="text-xs text-gray-500">
                    {category.services.length} usług
                  </span>
                </div>
                {isSelected && (
                  <span className="text-blue-500 text-xl">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>


      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          Wybrano: {userCategories.length} kategorii ({userServices.length} usług)
        </div>
        <button
          onClick={saveServices}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Zapisywanie...' : 'Zapisz usługi'}
        </button>
      </div>
    </div>
  );
}
