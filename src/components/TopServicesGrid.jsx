import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";

function currentSeason() {
  const m = new Date().getMonth() + 1; // 1..12
  if ([12,1,2].includes(m)) return "winter";
  if ([3,4,5].includes(m))  return "spring";
  if ([6,7,8].includes(m))  return "summer";
  return "autumn";
}

export default function TopServicesGrid({ 
  parent = "", 
  limit = 12, 
  title = "Top usługi",
  showSeasonal = true,
  excludeSeasonal = true 
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const season = useMemo(() => currentSeason(), []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Pobierz usługi TOP bez filtru sezonowego, żeby uniknąć duplikatów z banerem
        const qs = new URLSearchParams({ 
          is_top: "1", 
          limit: String(limit + 3) // Pobierz więcej, żeby po wykluczeniu sezonowych zostało wystarczająco
        });
        
        if (parent) qs.set("parent", parent);
        
        let response = await fetch(`${API}/api/services?` + qs.toString());
        let result = await response.json();
        
        let services = result.items || [];
        
        // Jeśli mamy excludeSeasonal=true, usuń usługi sezonowe żeby uniknąć duplikatów z banerem
        if (excludeSeasonal && showSeasonal) {
          services = services.filter(service => 
            !service.seasonal || service.seasonal === 'none' || service.seasonal !== season
          );
        }
        
        // Ogranicz do żądanej liczby
        setData(services.slice(0, limit));
      } catch (err) {
        console.error('Błąd podczas pobierania usług:', err);
        setError('Nie udało się załadować usług');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [parent, limit, season, showSeasonal, excludeSeasonal]);

  if (loading) {
    return (
      <section className="my-8">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-xl p-4 bg-white animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-8">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center text-red-600 py-8">
          {error}
        </div>
      </section>
    );
  }

  if (!data.length) {
    return null;
  }

  return (
    <section className="my-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map(service => (
          <article 
            key={service.slug} 
            className="border rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-blue-300"
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {service.parent_slug && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {service.parent_slug}
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                service.service_kind === 'remote' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {service.service_kind === 'remote' ? 'online' : 'dojazd'}
              </span>
              {service.seasonal && service.seasonal !== 'none' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {service.seasonal}
                </span>
              )}
              {service.is_top && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⭐ TOP
                </span>
              )}
            </div>
            
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {service.name_pl || service.name_en || service.name}
            </h3>
            
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
              {service.description}
            </p>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {typeof service.base_price_min === 'number' && typeof service.base_price_max === 'number' && (
                  <span className="font-medium">
                    ~ {service.base_price_min}–{service.base_price_max} {service.unit || 'PLN'}
                  </span>
                )}
              </div>
              <Link
                to={`/search?service=${encodeURIComponent(service.parent_slug || service.slug)}`}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Wybierz
              </Link>
            </div>
            
            {service.urgency_level <= 2 && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                🚨 Pilne
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
