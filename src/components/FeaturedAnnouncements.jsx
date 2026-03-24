import React, { useEffect, useState } from "react";
import { apiGet } from "../lib/api.ts";

export default function FeaturedAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Pobierz wyróżnione ogłoszenia (featured: true, status: active)
        const response = await apiGet("/api/announcements?featured=true&status=active&limit=3");
        
        if (response && Array.isArray(response)) {
          setAnnouncements(response);
        } else if (response?.items && Array.isArray(response.items)) {
          setAnnouncements(response.items);
        } else if (response?.announcements && Array.isArray(response.announcements)) {
          setAnnouncements(response.announcements);
        } else {
          // Brak danych - nie wyświetlaj sekcji
          setAnnouncements([]);
        }
      } catch (error) {
        // Wycisz błąd - endpoint może nie istnieć lub nie być dostępny
        // Nie loguj błędu do konsoli, po prostu nie wyświetlaj sekcji
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Jeśli brak ogłoszeń lub ładowanie, nie wyświetlaj sekcji
  if (loading || !announcements.length) {
    return null;
  }

  const formatPrice = (price, priceType) => {
    const priceInPLN = (price / 100).toFixed(2);
    const typeLabels = {
      per_hour: "godz.",
      per_day: "dzień",
      per_week: "tydzień",
      per_month: "miesiąc",
      one_time: "jednorazowo"
    };
    return `${priceInPLN} PLN/${typeLabels[priceType] || "jednorazowo"}`;
  };

  const getTypeLabel = (type) => {
    const labels = {
      equipment_rental: "Wynajem sprzętu",
      parts_sale: "Sprzedaż części",
      service: "Usługa",
      other: "Inne"
    };
    return labels[type] || type;
  };

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Wyróżnione ogłoszenia
          </h2>
          <p className="text-gray-600">
            Sprawdź oferty sprzętu, części i usług od zaufanych wykonawców
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className="rounded-2xl bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#E9ECF5] hover:shadow-lg transition-shadow"
            >
              {/* Typ ogłoszenia */}
              <div className="mb-3">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full">
                  {getTypeLabel(announcement.type)}
                </span>
              </div>

              {/* Tytuł */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {announcement.title}
              </h3>

              {/* Opis */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {announcement.description}
              </p>

              {/* Cena */}
              <div className="mb-4">
                <div className="text-xl font-bold text-indigo-600">
                  {formatPrice(announcement.price, announcement.priceType)}
                </div>
              </div>

              {/* Lokalizacja */}
              {announcement.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{announcement.location}</span>
                </div>
              )}

              {/* Zdjęcia (jeśli są) */}
              {announcement.images && announcement.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={announcement.images[0]}
                    alt={announcement.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Dostępność */}
              {announcement.availability === "available" && (
                <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Dostępne</span>
                </div>
              )}

              {/* Przycisk kontaktu */}
              <button
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                onClick={() => {
                  // Można dodać modal z kontaktem lub przekierowanie
                  if (announcement.contactPhone) {
                    window.location.href = `tel:${announcement.contactPhone}`;
                  } else if (announcement.contactEmail) {
                    window.location.href = `mailto:${announcement.contactEmail}`;
                  }
                }}
              >
                Skontaktuj się
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

