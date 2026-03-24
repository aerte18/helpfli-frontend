import React, { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqCategories = [
    { id: "all", name: "Wszystkie", icon: "📋" },
    { id: "account", name: "Konto", icon: "👤" },
    { id: "orders", name: "Zlecenia", icon: "📝" },
    { id: "payments", name: "Płatności", icon: "💳" },
    { id: "providers", name: "Wykonawcy", icon: "👷‍♂️" },
    { id: "technical", name: "Techniczne", icon: "🔧" }
  ];

  const faqItems = [
    {
      id: 1,
      category: "account",
      question: "Jak założyć konto?",
      answer: "Aby założyć konto, kliknij przycisk 'Zarejestruj się' w prawym górnym rogu strony. Wypełnij formularz rejestracji podając swoje dane kontaktowe i hasło. Po rejestracji otrzymasz email z linkiem aktywacyjnym."
    },
    {
      id: 2,
      category: "orders",
      question: "Jak utworzyć zlecenie?",
      answer: "Aby utworzyć zlecenie, zaloguj się do swojego konta i kliknij 'Stwórz zlecenie'. Wypełnij formularz podając opis usługi, lokalizację i preferowany termin. Możesz również skorzystać z AI Concierge, który pomoże Ci znaleźć odpowiednią usługę."
    },
    {
      id: 3,
      category: "orders",
      question: "Jak anulować zlecenie?",
      answer: "Zlecenie można anulować w sekcji 'Moje zlecenia'. Kliknij na zlecenie, które chcesz anulować, a następnie wybierz opcję 'Anuluj zlecenie'. Pamiętaj, że anulowanie zlecenia może wiązać się z opłatami w zależności od etapu realizacji."
    },
    {
      id: 4,
      category: "payments",
      question: "Jakie metody płatności są dostępne?",
      answer: "Akceptujemy płatności kartą kredytową/debetową, przelewem bankowym oraz płatności online (PayPal, BLIK). Wszystkie płatności są bezpieczne i chronione przez nasz system."
    },
    {
      id: 5,
      category: "payments",
      question: "Kiedy otrzymam zwrot pieniędzy?",
      answer: "Zwrot pieniędzy jest przetwarzany w ciągu 3-5 dni roboczych od momentu anulowania zlecenia. Kwota zostanie zwrócona na kartę lub konto, z którego została pobrana opłata."
    },
    {
      id: 6,
      category: "providers",
      question: "Jak zostać wykonawcą?",
      answer: "Aby zostać wykonawcą, zarejestruj się na platformie i wypełnij formularz wykonawcy. Prześlij wymagane dokumenty i przejdź proces weryfikacji KYC. Po pozytywnej weryfikacji będziesz mógł oferować swoje usługi."
    },
    {
      id: 7,
      category: "providers",
      question: "Jak otrzymuję płatności?",
      answer: "Płatności są przekazywane wykonawcom po zakończeniu zlecenia i potwierdzeniu przez klienta. Możesz ustawić preferowane konto bankowe w ustawieniach konta."
    },
    {
      id: 8,
      category: "technical",
      question: "Nie mogę się zalogować - co robić?",
      answer: "Sprawdź czy podajesz prawidłowy email i hasło. Jeśli zapomniałeś hasła, użyj opcji 'Przypomnij hasło'. Jeśli problem nadal występuje, skontaktuj się z naszym wsparciem technicznym."
    },
    {
      id: 9,
      category: "technical",
      question: "Czy aplikacja działa na telefonie?",
      answer: "Tak, nasza platforma jest w pełni responsywna i działa na wszystkich urządzeniach mobilnych. Możesz korzystać z niej przez przeglądarkę na telefonie lub tablecie."
    }
  ];

  const filteredFaqs = faqItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Centrum pomocy</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Często zadawane pytania</h2>
          
          <div className="mb-6">
            <input
              type="text"
              placeholder="Szukaj w FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-gray-700">{item.answer}</p>
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Nie znaleziono odpowiedzi</h3>
              <p className="text-gray-600">
                Spróbuj zmienić kryteria wyszukiwania lub skontaktuj się z nami bezpośrednio.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">📞 Kontakt telefoniczny</h3>
            <p className="text-gray-700 mb-4">
              Potrzebujesz natychmiastowej pomocy? Zadzwoń do nas!
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Telefon:</span> +48 123 456 789
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Godziny:</span> 8:00 - 20:00 (pn-pt)
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">📧 Email</h3>
            <p className="text-gray-700 mb-4">
              Napisz do nas, a odpowiemy w ciągu 24 godzin.
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Ogólne:</span> kontakt@helpfli.pl
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Wsparcie:</span> support@helpfli.pl
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Przydatne linki</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Dla klientów</h3>
              <ul className="space-y-1">
                <li><Link to="/search" className="text-indigo-600 hover:underline">Znajdź wykonawcę</Link></li>
                <li><Link to="/create-order" className="text-indigo-600 hover:underline">Stwórz zlecenie</Link></li>
                <li><Link to="/my-orders" className="text-indigo-600 hover:underline">Moje zlecenia</Link></li>
                <li><Link to="/concierge" className="text-indigo-600 hover:underline">Asystent AI</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Dla wykonawców</h3>
              <ul className="space-y-1">
                <li><Link to="/register" className="text-indigo-600 hover:underline">Zostań wykonawcą</Link></li>
                <li><Link to="/verification" className="text-indigo-600 hover:underline">Weryfikacja KYC</Link></li>
                <li><Link to="/provider-home" className="text-indigo-600 hover:underline">Panel wykonawcy</Link></li>
                <li><Link to="/account/subscriptions" className="text-indigo-600 hover:underline">Subskrypcje</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Nie znalazłeś odpowiedzi?</h2>
          <p className="text-gray-700 mb-4">
            Jeśli nie znalazłeś odpowiedzi na swoje pytanie, skontaktuj się z nami bezpośrednio. 
            Nasz zespół wsparcia chętnie Ci pomoże!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/contact"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Skontaktuj się z nami
            </Link>
            <a 
              href="mailto:support@helpfli.pl"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              support@helpfli.pl
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
