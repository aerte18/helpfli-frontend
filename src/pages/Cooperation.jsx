import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Cooperation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Współpraca</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Zostań naszym partnerem</h2>
          <p className="text-gray-700 mb-4">
            Helpfli to dynamicznie rozwijająca się platforma, która oferuje wiele możliwości współpracy. 
            Dołącz do nas i razem budujmy przyszłość usług lokalnych.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">👷‍♂️</div>
            <h3 className="text-lg font-semibold mb-3">Dla wykonawców</h3>
            <p className="text-gray-700 mb-4">
              Oferuj swoje usługi na naszej platformie i zyskaj dostęp do tysięcy potencjalnych klientów.
            </p>
            <ul className="text-gray-700 space-y-2 mb-4">
              <li>• Darmowa rejestracja</li>
              <li>• Dostęp do nowych zleceń</li>
              <li>• System ocen i opinii</li>
              <li>• Bezpieczne płatności</li>
              <li>• Wsparcie techniczne</li>
            </ul>
            <Link 
              to="/register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
            >
              Zostań wykonawcą
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold mb-3">Dla firm</h3>
            <p className="text-gray-700 mb-4">
              Współpracuj z nami jako firma i zyskaj dostęp do szerokiej bazy wykwalifikowanych wykonawców.
            </p>
            <ul className="text-gray-700 space-y-2 mb-4">
              <li>• Dostęp do weryfikowanych wykonawców</li>
              <li>• Zniżki dla firm</li>
              <li>• Dedykowane wsparcie</li>
              <li>• Raporty i analityka</li>
              <li>• Integracje API</li>
            </ul>
            <Link 
              to="/contact"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
            >
              Skontaktuj się z nami
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Program partnerski</h2>
          <p className="text-gray-700 mb-4">
            Dołącz do naszego programu partnerskiego i zarabiaj polecając naszą platformę.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold mb-2">Prowizje</h3>
              <p className="text-gray-700 text-sm">
                Zarabiaj prowizje za każdego poleconego wykonawcę
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="font-semibold mb-2">Wzrost</h3>
              <p className="text-gray-700 text-sm">
                Wspieraj rozwój platformy i zyskuj wraz z nami
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🤝</div>
              <h3 className="font-semibold mb-2">Wsparcie</h3>
              <p className="text-gray-700 text-sm">
                Otrzymuj pełne wsparcie w promocji platformy
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Wymagania dla wykonawców</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Podstawowe wymagania:</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Pełnoletność</li>
                <li>• Doświadczenie w wybranej dziedzinie</li>
                <li>• Dokumenty potwierdzające kwalifikacje</li>
                <li>• Ubezpieczenie OC (dla niektórych usług)</li>
                <li>• Pozytywne nastawienie do klientów</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Proces weryfikacji:</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Weryfikacja tożsamości (KYC)</li>
                <li>• Sprawdzenie dokumentów</li>
                <li>• Weryfikacja referencji</li>
                <li>• Test wiedzy (opcjonalnie)</li>
                <li>• Akceptacja regulaminu</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Masz pytania?</h2>
          <p className="text-gray-700 mb-4">
            Nasz zespół jest gotowy odpowiedzieć na wszystkie Twoje pytania dotyczące współpracy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/contact"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Skontaktuj się z nami
            </Link>
            <a 
              href="mailto:partnerships@helpfli.pl"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              partnerships@helpfli.pl
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
