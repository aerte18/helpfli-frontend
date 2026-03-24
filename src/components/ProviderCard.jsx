import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UI } from "../i18n/pl_ui";
import { ShieldCheck, Star, Heart, Sparkles, MapPin, Clock, Building2, Trophy, Award, Zap } from "lucide-react";
import StarRating from "./StarRating";
import Badge from "./ui/Badge";
import TopIcon from "./icons/TopIcon";
import AIIcon from "./icons/AIIcon";
import OriginalLogoIcon from "./icons/OriginalLogoIcon";
import { getIconBySlug } from "./icons/HelpfliCategoryIcons";
import { metrics } from "../utils/metrics";
import { useInView } from "../utils/useInView";
import { getProviderServiceLabel } from "../utils/getProviderLabel";

const isActive = (d) => d && new Date(d) > new Date();

const getStatusInfo = (providerStatus) => {
  // Najpierw sprawdź dostępność "teraz" z harmonogramu (jeśli jest)
  // availableNow jest obliczane przez backend na podstawie harmonogramu + isOnline
  if (providerStatus?.availableNow === true || providerStatus?.isOnline === true) {
    return { dot: "bg-emerald-500", text: UI.providerCanHelpNow };
  } else if (providerStatus?.isOnline === false && providerStatus?.availableNow === false) {
    return { dot: "bg-slate-400", text: UI.providerOffline };
  } else if (providerStatus?.lastSeenAt) {
    // Fallback: sprawdź czy ostatnio widziany w ciągu 5 minut
    const lastSeen = new Date(providerStatus.lastSeenAt);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    if (diffMinutes <= 5) {
      return { dot: "bg-emerald-500", text: UI.providerCanHelpNow };
    }
  }
  return { dot: "bg-slate-400", text: UI.providerOffline };
};

export default function ProviderCard({ data, onSelect, onQuote, onCompare, isCompared, compact = false }) {
  const [fav, setFav] = useState(false);
  const navigate = useNavigate();
  const st = getStatusInfo(data?.provider_status);
  const [ref, inView] = useInView({ threshold: 0.6 });

  // Sprawdź promocje (tylko efekty wizualne dla klientów)
  const highlight = isActive(data?.promo?.highlightUntil);
  const top = isActive(data?.promo?.topBadgeUntil);
  const ai = isActive(data?.promo?.aiTopTagUntil);
  
  // Nowe badge'i Pakietu 2
  const isTop = data?.badges?.topUntil && new Date(data.badges.topUntil) > new Date();
  const isPro = !!data?.badges?.pro;
  
  // Nowe badge'y z modelu badges
  const topActive = data?.badges?.topUntil && new Date(data.badges.topUntil) > new Date();
  const highlightActive = data?.badges?.highlightUntil && new Date(data.badges.highlightUntil) > new Date();
  const aiActive = data?.badges?.aiRecommendedUntil && new Date(data.badges.aiRecommendedUntil) > new Date();

  const handleProfileClick = () => {
    metrics.act(data._id || data.id, "clicks");
    navigate(`/provider/${data.id}`, { state: { provider: data } });
  };

  // Track impression when component mounts
  useEffect(() => {
    metrics.hit(data._id || data.id, "impressions");
  }, [data._id, data.id]);

  // Sponsorowane: loguj impresję po wejściu karty w viewport (capping per-user)
  useEffect(() => {
    if (inView && data?._sponsored && data?._campaignId) {
      const token = localStorage.getItem("token");
      if (token) {
        fetch("/api/metrics/sponsor/imp", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ campaignId: data._campaignId, providerId: data._id || data.id })
        }).catch(()=>{});
      }
    }
  }, [inView, data?._sponsored, data?._campaignId, data?._id, data?.id]);

  // Funkcja do określenia nazwy usługi/kategorii na podstawie liczby usług
  const getServiceDisplayName = () => {
    // Jeśli jest tylko jedna usługa/kategoria
    if (data.service) {
      return data.service;
    }
    
    // Jeśli są wszystkie usługi w danych
    const allServices = data.allServices || data.services || [];
    
    if (allServices.length === 0) {
      return 'Usługa';
    }
    
    if (allServices.length === 1) {
      // Pojedyncza usługa - pokaż nazwę
      const service = allServices[0];
      return typeof service === 'string' ? service : (service.name_pl || service.name || service);
    }
    
    // Wiele usług - sprawdź kategorie
    if (allServices.length <= 3) {
      // Sprawdź kategorie usług
      const categories = new Set();
      allServices.forEach(service => {
        const serviceObj = typeof service === 'string' ? null : service;
        if (serviceObj?.parent_slug) {
          categories.add(serviceObj.parent_slug);
        }
      });
      
      // Jeśli wszystkie z jednej kategorii, pokaż nazwę kategorii
      if (categories.size === 1) {
        const categorySlug = Array.from(categories)[0];
        const categoryMap = {
          'hydraulika': 'Hydraulika',
          'elektryka': 'Elektryka',
          'agd': 'AGD i RTV',
          'agd_rtv': 'AGD i RTV',
          'klima_ogrz': 'Klimatyzacja i ogrzewanie',
          'remont': 'Remont i wykończenia',
          'montaz': 'Montaż i stolarka',
          'stol_montaz': 'Montaż i stolarka',
          'sprzatanie': 'Sprzątanie',
          'ogrod': 'Ogród',
          'it_smart': 'IT i Smart home',
          'inne': 'Inne'
        };
        return categoryMap[categorySlug] || categorySlug;
      }
      
      // Różne kategorie (2-3) - pokaż listę nazw usług (maksymalnie 2-3)
      const serviceNames = allServices.slice(0, 3).map(s => {
        if (typeof s === 'string') return s;
        return s.name_pl || s.name || s.service || 'Usługa';
      }).filter(Boolean);
      return serviceNames.join(', ');
    }
    
    // 4+ usług - pokaż "Złota rączka" lub "Wielobranżowy"
    // Sprawdź czy to różne kategorie
    const categories = new Set();
    allServices.forEach(service => {
      const serviceObj = typeof service === 'string' ? null : service;
      if (serviceObj?.parent_slug || serviceObj?.category) {
        categories.add(serviceObj.parent_slug || serviceObj.category);
      }
    });
    
    // Jeśli różne kategorie (więcej niż 1) lub 4+ usługi
    if (categories.size > 1 || allServices.length >= 4) {
      return 'Złota rączka';
    }
    
    // W przeciwnym razie pokaż pierwszą kategorię + "i inne"
    const firstService = allServices[0];
    const firstName = typeof firstService === 'string' 
      ? firstService 
      : (firstService.name_pl || firstService.name || firstService);
    return `${firstName} i inne`;
  };
  
  const serviceName = getServiceDisplayName();
  
  // Pobierz ikonę usługi (użyj pierwszej usługi dla ikony)
  const firstService = data.allServices?.[0] || data.service;
  const serviceSlug = data.serviceSlug || 
    (typeof firstService === 'string' 
      ? firstService.toLowerCase().replace(/\s+/g, '-')
      : (firstService?.slug || firstService?.name_pl?.toLowerCase().replace(/\s+/g, '-') || 'inne'));
  const ServiceIcon = getIconBySlug(serviceSlug);
  // Użyj headline jeśli jest dostępny, w przeciwnym razie skróć bio lub użyj domyślnego opisu
  const getServiceDescription = () => {
    if (data.headline) {
      return data.headline;
    }
    if (data.bio) {
      // Jeśli bio jest dłuższe niż 60 znaków, skróć je
      return data.bio.length > 60 ? data.bio.substring(0, 57) + '...' : data.bio;
    }
    return `${serviceName} - profesjonalne usługi dostępne 24/7`;
  };
  const serviceDescription = getServiceDescription();

  // Sprawdź czy to firma czy osoba
  const isCompany = data.company || data.companyId || data.company_id || data.companyName || (data.roleInCompany && data.roleInCompany !== 'none');

  // Kompaktowy widok dla siatki
  if (compact) {
    return (
      <div ref={ref}
        className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border h-full flex flex-col"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: highlight || highlightActive ? '#a855f7' : 'var(--border)',
          borderWidth: highlight || highlightActive ? '2px' : '1px',
        }}
      >
        {/* Nagłówek z avatarem i nazwą */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start gap-3">
            <img
              src={data.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=4F46E5`}
              alt={data.name}
              className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            />
            <div className="flex-1 min-w-0">
              <button 
                onClick={handleProfileClick}
                className="font-semibold hover:underline text-left block text-sm mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                {data.name}
              </button>
              {/* Nagłówek z profilu (Konto → Profil) – pod nazwą zamiast listy usług */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-0" style={{ color: 'var(--muted-foreground)' }}>
                {serviceDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Treść */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Ocena i badge'i */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <StarRating
                value={Number(data.rating ?? data.averageRating ?? 0)}
                size={14}
                showValue={false}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {data.rating?.toFixed(1) || data.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {(data.verified || data.verification?.verified || (Array.isArray(data.badges) && data.badges.includes("verified"))) && (
                <ShieldCheck className="w-4 h-4 text-green-600" title="Zweryfikowany" />
              )}
              {(data.providerTier === 'pro' || data.level === 'pro' || isPro) && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-orange-500 text-white rounded" title="TOP Provider">TOP</span>
              )}
              {data.b2b && (
                <Building2 className="w-4 h-4 text-purple-600" title="Firma" />
              )}
            </div>
          </div>

          {/* Odległość i status */}
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
            {data.distanceKm !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{data.distanceKm?.toFixed(1)} km</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
              <span>{st.text}</span>
            </div>
          </div>

          {/* Przyciski */}
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => onCompare?.(data)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${
                  isCompared
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 font-medium'
                    : ''
                }`}
                style={!isCompared ? {
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)'
                } : {}}
                onMouseEnter={(e) => {
                  if (!isCompared) {
                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCompared) {
                    e.currentTarget.style.backgroundColor = 'var(--card)';
                  }
                }}
              >
                {isCompared ? '✓ Porównaj' : 'Porównaj'}
              </button>
              <button
                onClick={() => {
                  metrics.act(data._id || data.id, "quoteRequests");
                  onQuote?.(data);
                }}
                className="btn-helpfli-primary flex-1 px-3 py-2 text-xs"
              >
                Zapytaj
              </button>
            </div>
            <button
              onClick={() => {
                const preFilledData = {
                  providerId: data._id || data.id,
                  providerName: data.name,
                  service: data.service || data.allServices?.[0]?.name || data.allServices?.[0] || "usługa",
                  location: data.location?.address || data.city || "",
                };
                navigate('/create-order', { 
                  state: { 
                    preFilled: preFilledData,
                    direct: true
                  } 
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl font-medium transition-colors bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg"
            >
              Złóż zlecenie
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pełny widok — na mobile jedna kolumna (bez wąskiego paska), na sm+ układ dwukolumnowy
  return (
    <div ref={ref}
      className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: highlight || highlightActive ? '#a855f7' : 'var(--border)',
        borderWidth: highlight || highlightActive ? '2px' : '1px',
        boxShadow: highlight || highlightActive ? '0 0 0 3px rgba(217,70,239,0.18)' : undefined
      }}
    >
      {/* Mobile: nagłówek karty — jeden avatar, pełna szerokość (jak lista w aplikacji) */}
      <div className="sm:hidden flex gap-3 p-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
        <div className="relative shrink-0">
          {isCompany ? (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
              <ServiceIcon className="w-8 h-8" style={{ color: 'white' }} />
            </div>
          ) : (
            <img
              src={data.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=4F46E5`}
              alt={data.name}
              className="w-14 h-14 rounded-full object-cover border-2 shadow-md"
              style={{ borderColor: 'var(--border)' }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={handleProfileClick}
            className="font-bold text-left text-base w-full mb-1"
            style={{ color: 'var(--foreground)' }}
          >
            {data.name}
          </button>
          <p className="text-sm mb-0 line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>
            {serviceDescription}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* Lewa sekcja — tylko tablet+ (na mobile pokazane wyżej) */}
        <div className="hidden sm:flex sm:flex-col sm:w-1/3 items-center justify-center relative p-6" style={{ backgroundColor: 'var(--primary)' }}>
          {isCompany ? (
            // Dla firm - ikona usługi
            <div className="transform rotate-12">
              <ServiceIcon className="w-16 h-16" style={{ color: 'white' }} />
            </div>
          ) : (
            // Dla osób - avatar z inicjałami lub zdjęciem
            <img
              src={data.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=4F46E5`}
              alt={data.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
          )}
          {/* Wyróżnienia - różne ikony w zależności od typu */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 items-end">
            {/* TOP Provider - złota tarcza/trophy */}
            {(isTop || topActive || top) && (
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-1.5 shadow-lg" title="TOP Provider">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            )}
            {/* AI Recommended - indigo gwiazda */}
            {(aiActive || ai) && (
              <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full p-1.5 shadow-lg" title="AI Recommended">
                <AIIcon className="w-4 h-4 text-white" />
              </div>
            )}
            {/* Highlight - fioletowa iskra */}
            {(highlight || highlightActive) && (
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-full p-1.5 shadow-lg" title="Wyróżniony">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            {/* TOP - pomarańczowa etykieta */}
            {(data.level === 'pro' || isPro) && !topActive && !aiActive && !highlight && !highlightActive && (
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-full px-2 py-1 shadow-lg" title="TOP Provider">
                <span className="text-white text-xs font-bold">TOP</span>
              </div>
            )}
          </div>
        </div>

        {/* Prawa sekcja - szczegóły */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col" style={{ backgroundColor: 'var(--card)' }}>
          {/* Desktop: avatar + nazwa (na mobile już w nagłówku karty) */}
          <div className="hidden sm:flex items-start gap-3 mb-3">
            <img
              src={data.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=4F46E5`}
              alt={data.name}
              className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={handleProfileClick}
                className="font-bold hover:underline text-left block mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                {data.name}
              </button>
              
              <p className="text-sm mb-0 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                {serviceDescription}
              </p>
            </div>
          </div>

          <div className="border-t my-3 sm:my-4" style={{ borderColor: 'var(--border)' }}></div>

          {/* Informacje o ocenie/odległości/statusie - NA DOLE */}
          <div className="space-y-2 text-sm mb-4">
            {/* Ocena (gwiazdki) + Znaczniki po prawej */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Ocena (gwiazdki) - po lewej */}
              <div className="flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                <StarRating
                  value={Number(data.rating ?? data.averageRating ?? 0)}
                  size={16}
                  showValue={false}
                />
                <span className="font-medium">
                  {data.rating?.toFixed(1) || data.averageRating?.toFixed(1) || '0.0'}
                </span>
                {(data.reviewsCount || data.ratingCount) && (
                  <span style={{ color: 'var(--muted-foreground)' }}>({data.reviewsCount || data.ratingCount})</span>
                )}
              </div>
              
              {/* Znaczniki - po prawej */}
              <div className="flex items-center gap-1.5">
                {/* Verified - zielona tarcza z checkiem */}
                {(data.verified || data.verification?.verified || (Array.isArray(data.badges) && data.badges.includes("verified"))) && (
                  <div className="flex items-center" title="Zweryfikowany">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  </div>
                )}
                {/* TOP - etykieta */}
                {(data.providerTier === 'pro' || data.level === 'pro' || isPro) && (
                  <div className="flex items-center" title="TOP Provider">
                    <span className="px-1.5 py-0.5 text-xs font-bold bg-orange-500 text-white rounded">TOP</span>
                  </div>
                )}
                {/* Faktura - budynek */}
                {data.b2b && (
                  <div className="flex items-center" title="Firma">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>
                )}
              </div>
            </div>
            {/* Odległość i status dostępności */}
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {data.distanceKm !== undefined && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{data.distanceKm?.toFixed(1)} km</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{st.text}</span>
              </div>
            </div>
          </div>

          {/* Przyciski — na mobile pełna szerokość, min. ~44px (Apple HIG) */}
          <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap sm:gap-3">
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <button
                type="button"
                onClick={() => {
                  onCompare?.(data);
                }}
                className={`min-h-[44px] sm:min-h-0 px-4 py-3 sm:py-2.5 text-sm rounded-lg border transition-colors ${
                  isCompared
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 font-medium'
                    : ''
                }`}
                style={!isCompared ? {
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)'
                } : {}}
                onMouseEnter={(e) => {
                  if (!isCompared) {
                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCompared) {
                    e.currentTarget.style.backgroundColor = 'var(--card)';
                  }
                }}
              >
                {isCompared ? '✓ Porównaj' : 'Porównaj'}
              </button>
              <button
                type="button"
                onClick={() => {
                  metrics.act(data._id || data.id, "quoteRequests");
                  onQuote?.(data);
                }}
                className="btn-helpfli-primary min-h-[44px] sm:min-h-0 px-4 sm:px-6 py-3 sm:py-2.5 text-sm"
              >
                Zapytaj
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const preFilledData = {
                  providerId: data._id || data.id,
                  providerName: data.name,
                  service: data.service || data.allServices?.[0]?.name || data.allServices?.[0] || "usługa",
                  location: data.location?.address || data.city || "",
                };
                navigate('/create-order', { 
                  state: { 
                    preFilled: preFilledData,
                    direct: true
                  } 
                });
              }}
              className="w-full sm:w-auto min-h-[46px] sm:min-h-0 px-4 py-3 sm:py-2.5 text-sm rounded-xl font-semibold transition-colors bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md active:scale-[0.99]"
            >
              Złóż zlecenie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

