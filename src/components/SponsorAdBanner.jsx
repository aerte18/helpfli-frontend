import React, { useEffect, useState, useCallback, useRef } from "react";

/**
 * SponsorAdBanner - Komponent wyświetlający reklamy sponsorowane
 * 
 * @param {string} position - Pozycja reklamy: 'sidebar', 'banner', 'between-items'
 * @param {string} page - Strona gdzie jest wyświetlana: 'order_details', 'my_orders', 'available_orders', 'landing_page_banner', 'search_results'
 * @param {object} context - Kontekst dla targetowania: { keywords, serviceCategory, orderType, location }
 * @param {number} limit - Maksymalna liczba reklam do wyświetlenia
 */
export default function SponsorAdBanner({ 
  position = "sidebar", 
  page = "order_details", 
  context = {}, 
  limit = 3 
}) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const loadingRef = useRef(false);

  // Memoize context string to prevent infinite loops
  const contextString = JSON.stringify(context || {});

  const loadAds = useCallback(async () => {
    // Prevent concurrent requests
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    try {
      setLoading(true);
      
      // Mapowanie pozycji na displayLocation dla API
      const displayLocationMap = {
        sidebar: page === "order_details" ? "order_details" : "search_results",
        banner: "landing_page_banner",
        "between-items": page === "my_orders" ? "my_orders" : "available_orders"
      };

      const displayLocation = displayLocationMap[position] || "order_details";
      
      // Buduj query params
      const params = new URLSearchParams({
        status: "active",
        displayLocation,
        limit: limit.toString()
      });

      // Dodaj kontekst jeśli jest dostępny
      if (context && Object.keys(context).length > 0) {
        params.append("context", JSON.stringify(context));
      }

      const response = await fetch(`/api/sponsor-ads?${params.toString()}`);
      if (!response.ok) {
        setAds([]);
        return;
      }
      const data = await response.json();

      if (data.ads && Array.isArray(data.ads)) {
        setAds(data.ads);
      } else if (Array.isArray(data)) {
        setAds(data);
      } else {
        setAds([]);
      }
    } catch (_error) {
      setAds([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, position, contextString, limit]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleClick = async (ad) => {
    try {
      // Track click
      await fetch(`/api/sponsor-ads/${ad._id}/click`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          position,
          context
        })
      });

      // Otwórz link w nowej karcie
      if (ad.link) {
        window.open(ad.link, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("[SponsorAdBanner] Błąd trackowania kliknięcia:", error);
      // Otwórz link nawet jeśli tracking się nie powiódł
      if (ad.link) {
        window.open(ad.link, "_blank", "noopener,noreferrer");
      }
    }
  };

  const trackImpression = async (ad) => {
    try {
      await fetch(`/api/sponsor-ads/${ad._id}/impression`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          position,
          context
        })
      });
    } catch (error) {
      console.error("[SponsorAdBanner] Błąd trackowania wyświetlenia:", error);
    }
  };

  // Track impressions when ads are loaded
  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach(ad => {
        trackImpression(ad);
      });
    }
  }, [ads]);

  // Auto-rotate dla bannerów (co 5 sekund)
  useEffect(() => {
    if (position === "banner" && ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [position, ads.length]);

  if (loading) {
    return (
      <div className="animate-pulse">
        {position === "sidebar" && (
          <div className="bg-gray-100 rounded-lg h-48 w-full"></div>
        )}
        {position === "banner" && (
          <div className="bg-gray-100 rounded-lg h-64 w-full"></div>
        )}
        {position === "between-items" && (
          <div className="bg-gray-100 rounded-lg h-32 w-full"></div>
        )}
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return null; // Nie wyświetlaj nic jeśli brak reklam
  }

  const currentAd = ads[currentIndex] || ads[0];

  // Renderowanie w zależności od pozycji
  if (position === "sidebar") {
    return (
      <div className="space-y-4">
        {ads.map((ad, index) => (
          <div
            key={ad._id || index}
            onClick={() => handleClick(ad)}
            className="cursor-pointer bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg p-4 border border-indigo-200 hover:shadow-lg transition-shadow"
          >
            {ad.logoUrl && (
              <img
                src={ad.logoUrl}
                alt={ad.advertiser?.name || "Reklama"}
                className="h-8 mb-2 object-contain"
              />
            )}
            {ad.imageUrl && (
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-32 object-cover rounded mb-2"
              />
            )}
            <h3 className="font-semibold text-sm text-gray-900 mb-1">{ad.title}</h3>
            {ad.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ad.description}</p>
            )}
            <button className="w-full px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">
              {ad.ctaText || "Sprawdź ofertę"}
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (position === "banner") {
    return (
      <div className="relative w-full">
        <div
          onClick={() => handleClick(currentAd)}
          className="cursor-pointer relative bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 md:p-8 text-white overflow-hidden"
        >
          {/* Background image jeśli jest */}
          {currentAd.imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${currentAd.imageUrl})` }}
            />
          )}
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              {currentAd.logoUrl && (
                <img
                  src={currentAd.logoUrl}
                  alt={currentAd.advertiser?.name || "Reklama"}
                  className="h-10 mb-3 object-contain"
                />
              )}
              <h3 className="text-xl md:text-2xl font-bold mb-2">{currentAd.title}</h3>
              {currentAd.description && (
                <p className="text-sm md:text-base opacity-90 mb-4">{currentAd.description}</p>
              )}
              <button className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {currentAd.ctaText || "Sprawdź ofertę"}
              </button>
            </div>
            {currentAd.imageUrl && (
              <div className="hidden md:block ml-6">
                <img
                  src={currentAd.imageUrl}
                  alt={currentAd.title}
                  className="h-32 w-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Wskaźniki karuzeli */}
          {ads.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (position === "between-items") {
    return (
      <div
        onClick={() => handleClick(currentAd)}
        className="cursor-pointer my-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-4">
          {currentAd.imageUrl && (
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title}
              className="h-20 w-20 object-cover rounded"
            />
          )}
          <div className="flex-1">
            {currentAd.logoUrl && (
              <img
                src={currentAd.logoUrl}
                alt={currentAd.advertiser?.name || "Reklama"}
                className="h-6 mb-1 object-contain"
              />
            )}
            <h3 className="font-semibold text-sm text-gray-900 mb-1">{currentAd.title}</h3>
            {currentAd.description && (
              <p className="text-xs text-gray-600 line-clamp-2">{currentAd.description}</p>
            )}
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors whitespace-nowrap">
            {currentAd.ctaText || "Sprawdź"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
