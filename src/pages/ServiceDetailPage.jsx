import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CATEGORY_ICONS } from "../components/icons/HelpfliCategoryIcons";
import Footer from "../components/Footer";
import PageBackground, { GlassCard } from "../components/PageBackground";

const API = import.meta.env.VITE_API_URL || "";

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [topProviders, setTopProviders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Pobierz szczegóły usługi
        console.log('ServiceDetailPage: fetching service for slug:', slug);
        const serviceResponse = await fetch(apiUrl(`/api/services?slug=${slug}&limit=1`));
        const serviceData = await serviceResponse.json();
        console.log('ServiceDetailPage: service data:', serviceData);
        
        if (serviceData.items?.length) {
          setService(serviceData.items[0]);
        } else {
          setError("Usługa nie została znaleziona");
          return;
        }

        // Pobierz top providerów w kategorii
        const providersResponse = await fetch(apiUrl(`/api/providers?service=${serviceData.items[0]._id}&limit=6`));
        const providersData = await providersResponse.json();
        setTopProviders(providersData.items || []);

        // Pobierz statystyki (na razie mockowane)
        setStats({
          averagePrice: serviceData.items[0].base_price_min && serviceData.items[0].base_price_max 
            ? Math.round((serviceData.items[0].base_price_min + serviceData.items[0].base_price_max) / 2)
            : null,
          priceRange: serviceData.items[0].base_price_min && serviceData.items[0].base_price_max
            ? `${serviceData.items[0].base_price_min}-${serviceData.items[0].base_price_max} PLN`
            : "Do ustalenia",
          averageTime: "2-4 godziny",
          popularity: "Wysoka",
          seasonality: serviceData.items[0].seasonal || "Cały rok"
        });

      } catch (error) {
        console.error('Error fetching service data:', error);
        setError("Błąd podczas ładowania danych");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchServiceData();
    }
  }, [slug]);

  if (loading) {
    return (
      <PageBackground>
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </PageBackground>
    );
  }

  if (error || !service) {
    return (
      <PageBackground>
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg mb-2">Błąd</div>
            <div className="text-gray-600 mb-4">{error || "Usługa nie została znaleziona"}</div>
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              ← Wróć do strony głównej
            </Link>
          </div>
        </div>
      </PageBackground>
    );
  }

  const getIcon = (parentSlug) => {
    const Icon = CATEGORY_ICONS[parentSlug] || CATEGORY_ICONS['inne'];
    return <Icon size={32} strokeWidth={2} className="text-indigo-600" />;
  };

  const getExpertTips = (serviceSlug) => {
    const tips = {
      czyszczenie_rynien: [
        "Czyszczenie rynien najlepiej wykonać jesienią, po opadnięciu liści",
        "Sprawdź czy rynny nie są uszkodzone - pęknięcia mogą powodować przecieki",
        "Używaj odpowiednich narzędzi - drabina musi być stabilna i zabezpieczona",
        "Zatkane rynny mogą powodować zalania fundamentów - nie bagatelizuj problemu"
      ],
      czyszczenie_pieca: [
        "Przegląd pieca należy wykonać przed sezonem grzewczym",
        "Czyszczenie komina to obowiązek - zaniedbanie może być niebezpieczne",
        "Sprawdź szczelność połączeń - wycieki gazu są bardzo niebezpieczne",
        "Regularne czyszczenie poprawia sprawność i obniża koszty ogrzewania"
      ],
      grabienie_lisci: [
        "Liście najlepiej grabić gdy są suche - łatwiej się zbierają",
        "Kompostuj liście - to naturalny nawóz dla ogrodu",
        "Nie zostawiaj liści na trawniku - mogą go udusić",
        "Używaj odpowiednich narzędzi - grabie z szerokimi zębami są najskuteczniejsze"
      ]
    };
    return tips[serviceSlug] || [
      "Skontaktuj się z nami po więcej wskazówek",
      "Zawsze sprawdź referencje wykonawcy",
      "Poproś o wycenę przed rozpoczęciem prac",
      "Upewnij się, że wykonawca ma odpowiednie ubezpieczenie"
    ];
  };

  return (
    <PageBackground className="py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-slate-500">
            <li><Link to="/" className="hover:text-indigo-600">Strona główna</Link></li>
            <li>/</li>
            <li><Link to="/search" className="hover:text-indigo-600">Usługi</Link></li>
            <li>/</li>
            <li className="text-slate-900">{service.name_pl || service.name_en}</li>
          </ol>
        </nav>

        {/* Header sekcja */}
        <GlassCard className="p-6 md:p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {getIcon(service.parent_slug)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {service.name_pl || service.name_en}
              </h1>
              <p className="text-lg text-slate-600 mb-4">
                Znajdź pomoc w twojej okolicy
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {stats?.seasonality}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {stats?.popularity}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link
                to={`/create-order?service=${service.slug}`}
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] text-white font-semibold shadow-[0_12px_32px_rgba(79,70,229,0.5)] hover:shadow-[0_16px_40px_rgba(79,70,229,0.65)] transition-all"
                onClick={() => console.log('ServiceDetailPage: clicking order button, service.slug:', service.slug)}
              >
                Zamów teraz
              </Link>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statystyki */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">📊 Statystyki</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-500">Średnia cena</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats?.averagePrice ? `${stats.averagePrice} PLN` : "Do ustalenia"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Zakres cenowy</div>
                  <div className="text-lg font-medium text-slate-900">{stats?.priceRange}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Średni czas wykonania</div>
                  <div className="text-lg font-medium text-slate-900">{stats?.averageTime}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Sezonowość</div>
                  <div className="text-lg font-medium text-slate-900">{stats?.seasonality}</div>
                </div>
              </div>
            </GlassCard>

            {/* Wskazówki ekspertów */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 Wskazówki ekspertów</h2>
              <ul className="space-y-3">
                {getExpertTips(service.slug).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                    <span className="text-sm text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top providerzy */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">🏆 Top providerzy w tej kategorii</h2>
              
              {topProviders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topProviders.map((provider) => (
                    <div key={provider._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {provider.name?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{provider.name}</h3>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600">
                              {provider.averageRating?.toFixed(1) || 'Brak ocen'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {provider.location || 'Lokalizacja nie podana'}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {provider.price ? `${provider.price} PLN` : 'Cena do ustalenia'}
                        </span>
                        <Link
                          to={`/provider/${provider._id}`}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          Zobacz profil →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    Brak dostępnych providerów w tej chwili
                  </div>
                  <Link
                    to="/create-order?service=${service.slug}"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Złóż zlecenie
                  </Link>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
      <Footer />
    </PageBackground>
  );
}
