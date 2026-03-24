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
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-6 h-48"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{UI.sectionPopularHelp}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {topProviders.map((provider) => (
            <div key={provider._id || provider.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              {/* Header z badge'ami - zgodnie ze zdjęciem */}
              <div className="flex items-start justify-between mb-4">
                {/* Lewa strona - PRO badge */}
                <div className="flex items-center gap-2">
                  {(provider.providerTier === 'pro' || provider.level === 'pro') && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-orange-500 text-white">
                      <span>TOP</span>
                    </span>
                  )}
                  {provider.providerTier === 'standard' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-indigo-600 text-white">
                      <span>✨</span>
                      <span>PRO Standard</span>
                    </span>
                  )}
                </div>
                {/* Prawa strona - ocena */}
                <div className="flex items-center gap-1 text-gray-900">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-semibold">
                    {provider.rating?.toFixed(1) || provider.averageRating?.toFixed(1) || '0'}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({provider.ratingCount || provider.reviewCount || 0})
                  </span>
                </div>
              </div>

              {/* Nazwa providera - duża, pogrubiona */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">{provider.name}</h3>
              </div>

              {/* CTA - niebieski przycisk na dole */}
              <Link
                to={`/provider/${provider._id || provider.id}`}
                className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
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
