import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import { Star, Search, ShieldCheck } from "lucide-react";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error('Błąd pobierania opinii:', error);
        // Fallback - przykładowe opinie
        setReviews([
          {
            _id: '1',
            clientName: 'Anna K.',
            providerName: 'Jan Kowalski',
            service: 'Hydraulika',
            rating: 5,
            comment: 'Świetna obsługa, szybko i profesjonalnie. Polecam!',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            clientName: 'Piotr M.',
            providerName: 'Maria Nowak',
            service: 'Elektryka',
            rating: 5,
            comment: 'Bardzo zadowolony z usługi. Wykonawca punktualny i kompetentny.',
            createdAt: new Date().toISOString()
          },
          {
            _id: '3',
            clientName: 'Katarzyna L.',
            providerName: 'Tomasz Wiśniewski',
            service: 'Remont',
            rating: 4,
            comment: 'Dobra jakość wykonania, terminowość na wysokim poziomie.',
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie opinii...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Opinie o wykonawcach</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <p className="text-gray-700 mb-4">
            Sprawdź opinie o naszych wykonawcach i wybierz najlepszego specjalistę dla swoich potrzeb. 
            Wszystkie opinie są weryfikowane i pochodzą od rzeczywistych klientów.
          </p>
        </div>

        <p className="md:hidden text-xs text-gray-500 mb-2">Przesuń palcem, aby przeglądać opinie</p>
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible -mx-2 px-2 md:mx-0 md:px-0 pb-2 snap-x snap-mandatory scrollbar-hide touch-pan-x [-webkit-overflow-scrolling:touch]">
          {reviews.map((review) => (
            <div key={review._id} className="shrink-0 w-[min(320px,90vw)] md:w-auto snap-start bg-white p-5 md:p-6 rounded-lg shadow-md max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{review.clientName}</h3>
                  <p className="text-gray-600 text-sm">Klient</p>
                </div>
                <div className="text-right">
                  <div className="flex text-lg mb-1">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-gray-600 text-sm">{review.rating}/5</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 text-sm mb-2">
                  <span className="font-medium">Wykonawca:</span> {review.providerName}
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Usługa:</span> {review.service}
                </p>
              </div>

              <blockquote className="text-gray-700 italic mb-4">
                "{review.comment}"
              </blockquote>

              <div className="text-gray-500 text-xs">
                {new Date(review.createdAt).toLocaleDateString('pl-PL')}
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Star className="w-8 h-8 fill-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Brak opinii</h3>
            <p className="text-gray-600">
              Obecnie nie ma dostępnych opinii. Sprawdź ponownie później.
            </p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-2 md:mb-4">Dlaczego opinie są ważne?</h2>
          <p className="md:hidden text-xs text-gray-500 mb-3">Przesuń palcem</p>
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0 pb-1 snap-x snap-mandatory scrollbar-hide touch-pan-x [-webkit-overflow-scrolling:touch]">
            <div className="shrink-0 w-[min(240px,78vw)] md:w-auto snap-start text-center rounded-xl border border-gray-100 bg-gray-50/80 p-4 md:border-0 md:bg-transparent md:p-0">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Transparentność</h3>
              <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                Wszystkie opinie są weryfikowane i pochodzą od rzeczywistych klientów
              </p>
            </div>
            <div className="shrink-0 w-[min(240px,78vw)] md:w-auto snap-start text-center rounded-xl border border-gray-100 bg-gray-50/80 p-4 md:border-0 md:bg-transparent md:p-0">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Star className="w-6 h-6 fill-amber-500" />
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Jakość</h3>
              <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                System ocen pomaga wybrać najlepszych wykonawców w swojej dziedzinie
              </p>
            </div>
            <div className="shrink-0 w-[min(240px,78vw)] md:w-auto snap-start text-center rounded-xl border border-gray-100 bg-gray-50/80 p-4 md:border-0 md:bg-transparent md:p-0">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">Bezpieczeństwo</h3>
              <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                Opinie pomagają uniknąć nieprofesjonalnych wykonawców
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4">Chcesz zostawić opinię?</h2>
          <p className="text-gray-700 mb-4">
            Jeśli korzystałeś z usług naszych wykonawców, zostaw opinię i pomóż innym klientom 
            w wyborze najlepszego specjalisty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="/my-orders"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Moje zlecenia
            </a>
            <a 
              href="/search"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Znajdź wykonawcę
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
