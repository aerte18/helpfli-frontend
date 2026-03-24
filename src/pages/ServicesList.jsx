import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { apiGet } from "../lib/api";
import { IconByCategory } from "../components/icons/HelpfliCategoryIcons";
import { sortCategoriesByOrder, sortSubcategories } from "../constants/categoryOrder";
import { SERVICES_CATALOG } from "../constants/servicesCatalog";

export default function ServicesList() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setError(null);
        const data = await apiGet('/api/services/categories');
        
        let categoriesData = [];
        if (Array.isArray(data)) {
          categoriesData = data;
        } else if (data.items && Array.isArray(data.items)) {
          categoriesData = data.items;
        } else if (data.categories && Array.isArray(data.categories)) {
          categoriesData = data.categories;
        }
        
        // Sortuj kategorie zgodnie z kolejnością
        const sorted = sortCategoriesByOrder(categoriesData.map(cat => ({
          ...cat,
          subcategories: sortSubcategories({
            slug: cat.slug || cat.id,
            services: cat.subcategories || []
          })
        })));
        
        setCategories(sorted);
      } catch (error) {
        console.error('Błąd pobierania kategorii:', error);
        // Fallback do statycznego katalogu
        console.warn('ServicesList - using static catalog fallback');
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
          const sorted = sortCategoriesByOrder(fallbackCategories.map(cat => ({
            ...cat,
            subcategories: sortSubcategories({
              slug: cat.slug || cat.id,
              services: cat.subcategories || []
            })
          })));
          setCategories(sorted);
          setError(null); // Wyczyść błąd, jeśli fallback działa
          console.log('✅ ServicesList - fallback catalog loaded:', sorted.length);
        } catch (fallbackError) {
          console.error('ServicesList - fallback also failed:', fallbackError);
          setError('Nie udało się pobrać kategorii');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Pobierz podkategorie dla wybranej kategorii
    const subs = category.subcategories || [];
    // Dla kategorii "Inne" pokaż tylko pierwszą podkategorię
    if (category.slug === 'inne' && subs.length > 0) {
      setSubcategories([subs[0]]);
    } else {
      setSubcategories(subs);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSubcategories([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--qs-color-bg-soft)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie kategorii...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--qs-color-bg-soft)] flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Błąd ładowania</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--qs-color-bg-soft)] py-4 md:py-5">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="bg-white shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-[#E9ECF5] p-8">
          {!selectedCategory ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[var(--qs-color-text)]">Lista usług</h1>
              </div>
              
              <div className="mb-6">
                <p className="text-[var(--qs-color-muted)]">
                  Wybierz kategorię, aby zobaczyć dostępne usługi
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => {
                  const categoryName = category.name || category.name_pl || category.label || category.slug || 'Kategoria';
                  const categorySlug = category.slug || category.id;
                  
                  return (
                    <button
                      key={categorySlug}
                      onClick={() => handleCategorySelect(category)}
                      className="qs-card p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-4xl">
                          <IconByCategory id={categorySlug} className="w-12 h-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--qs-color-text)]">
                          {categoryName}
                        </h3>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <p className="text-sm text-[var(--qs-color-muted)]">
                            {category.subcategories.length} {category.subcategories.length === 1 ? 'usługa' : 'usług'}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToCategories}
                    className="text-[var(--qs-color-muted)] hover:text-[var(--qs-color-text)] transition-colors"
                  >
                    ← Wróć do kategorii
                  </button>
                  <h1 className="text-3xl font-bold text-[var(--qs-color-text)]">
                    {selectedCategory.name || selectedCategory.name_pl || selectedCategory.label}
                  </h1>
                </div>
              </div>

              {subcategories.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <div className="text-4xl mb-4">🔧</div>
                  <h3 className="text-xl font-semibold mb-2">Brak dostępnych usług</h3>
                  <p className="text-gray-600">
                    W tej kategorii nie ma jeszcze dostępnych usług.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subcategories.map((subcategory) => {
                    const serviceName = subcategory.name_pl || subcategory.name_en || subcategory.name || subcategory.label || 'Usługa';
                    const serviceSlug = subcategory.slug || subcategory.id || subcategory._id;
                    
                    return (
                      <div key={serviceSlug} className="qs-card p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-[var(--qs-color-text)] mb-3">
                          {serviceName}
                        </h3>
                        
                        {(subcategory.description || subcategory.description_pl) && (
                          <p className="text-[var(--qs-color-muted)] text-sm mb-4 line-clamp-3">
                            {subcategory.description_pl || subcategory.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                          {(() => {
                            const tags = Array.isArray(subcategory.tags) 
                              ? subcategory.tags 
                              : (typeof subcategory.tags === 'string' ? subcategory.tags.split(',').map(t => t.trim()) : []);
                            return tags.slice(0, 3).map((tag, index) => (
                              <span 
                                key={index}
                                className="qs-chip text-xs"
                              >
                                {tag}
                              </span>
                            ));
                          })()}
                        </div>

                        <Link 
                          to={`/home?service=${encodeURIComponent(serviceSlug)}`}
                          className="qs-btn qs-btn-primary w-full text-center"
                        >
                          Znajdź wykonawcę
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!selectedCategory && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
              <h2 className="text-xl font-semibold mb-4">Nie znalazłeś odpowiedniej usługi?</h2>
              <p className="text-[var(--qs-color-muted)] mb-4">
                Jeśli nie widzisz usługi, której szukasz, skorzystaj z naszego Asystenta AI, 
                który pomoże Ci znaleźć odpowiedniego wykonawcę.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/concierge"
                  className="qs-btn qs-btn-primary text-center"
                >
                  Asystent AI
                </Link>
                <Link 
                  to="/contact"
                  className="qs-btn qs-btn-outline text-center"
                >
                  Skontaktuj się z nami
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
