import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UI } from "../i18n/pl_ui";
import { apiGet } from "../lib/api";

export default function TopProviders({ service, city }) {
  const [topProviders, setTopProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProviders = async () => {
      try {
        const data = await apiGet(`/api/search/top?limit=6`);
        setTopProviders(data.providers || data.items || []);
      } catch (error) {
        console.error('Error fetching top providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProviders();
  }, []);

  if (loading) {
    return (
      <section className="bg-white py-10 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded max-w-md mx-auto mb-6 md:mb-8"></div>
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1 snap-x scrollbar-hide">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shrink-0 w-[min(280px,85vw)] md:w-auto snap-start bg-gray-100 rounded-xl p-5 md:p-6 h-44 md:h-48"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">{UI.sectionPopularHelp}</h2>
          <p className="md:hidden text-xs text-gray-500">Przesuń palcem, aby zobaczyć kolejnych wykonawców</p>
        </div>

        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1 snap-x snap-mandatory scrollbar-hide touch-pan-x [-webkit-overflow-scrolling:touch]">
          {topProviders.map((provider) => (
            <div key={provider._id || provider.id} className="shrink-0 w-[min(280px,85vw)] md:w-auto snap-start bg-white rounded-xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
              {/* Header z badge'ami - zgodnie ze zdjęciem */}
              <div className="flex items-start justify-between mb-3 md:mb-4">
                {/* Lewa strona - PRO badge */}
                <div className="flex items-center gap-2 min-w-0">
                  {(provider.providerTier === 'pro' || provider.level === 'pro') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-md text-[10px] md:text-xs font-bold bg-orange-500 text-white">
                      <span>TOP</span>
                    </span>
                  )}
                  {provider.providerTier === 'standard' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-md text-[10px] md:text-xs font-medium bg-indigo-600 text-white truncate max-w-[9rem] md:max-w-none">
                      <span>✨</span>
                      <span>PRO Standard</span>
                    </span>
                  )}
                </div>
                {/* Prawa strona - ocena */}
                <div className="flex items-center gap-1 text-gray-900 shrink-0">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-xs md:text-sm font-semibold">
                    {provider.rating?.toFixed(1) || provider.averageRating?.toFixed(1) || '0'}
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-500">
                    ({provider.ratingCount || provider.reviewCount || 0})
                  </span>
                </div>
              </div>

              {/* Nazwa providera - duża, pogrubiona */}
              <div className="mb-4 md:mb-6 flex-1 min-h-0">
                <h3 className="text-base md:text-xl font-bold text-gray-900 leading-tight line-clamp-2">{provider.name}</h3>
              </div>

              {/* CTA - niebieski przycisk na dole */}
              <Link
                to={`/provider/${provider._id || provider.id}`}
                className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 md:py-3 px-3 md:px-4 rounded-lg transition-colors text-sm md:font-medium mt-auto min-h-[44px] md:min-h-0 flex items-center justify-center"
              >
                Zobacz profil
              </Link>
            </div>
          ))}
        </div>

        {/* Link do wszystkich providerów - używamy tych samych parametrów co Home.jsx */}
        <div className="text-center">
          <Link
            to={`/providers${service || city ? '?' + new URLSearchParams({
              ...(service && { q: service, service: service }), // 'q' dla zgodności z Home
              ...(city && { city: city, location: city }), // 'city' i 'location' dla zgodności
              level: 'any', // 'any' zamiast 'all' dla zgodności z Home
              tier: 'all' // zachowujemy też 'tier' dla kompatybilności wstecznej
            }).toString() : ''}`}
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Zobacz więcej
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
