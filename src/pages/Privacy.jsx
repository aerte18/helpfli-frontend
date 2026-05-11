import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { companyPublicInfo } from "../legal/companyPublicInfo";

export default function Privacy() {
  const c = companyPublicInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Polityka prywatności {c.brand}</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900">
          Niniejsza polityka opisuje zasady przetwarzania danych w serwisie {c.siteUrl.replace(/^https?:\/\//, "")}{" "}
          (marketplace usług lokalnych). Wiążące są także postanowienia{" "}
          <Link to="/regulamin" className="font-medium underline">
            Regulaminu
          </Link>
          .
        </div>

        <h2 className="text-2xl font-semibold mt-6 mb-3">§1 Administrator danych</h2>
        <p className="text-gray-800 mb-4">
          Administratorem danych osobowych jest <strong>{c.legalName}</strong> z siedzibą: {c.addressLine1},{" "}
          {c.addressLine2}, {c.country} (KRS: {c.krs}, NIP: {c.nip}, REGON: {c.regon}).
        </p>
        <p className="text-gray-800 mb-4">
          Kontakt w sprawach ochrony danych:{" "}
          <a href={`mailto:${c.emailPrivacy}`} className="text-indigo-600 hover:underline">
            {c.emailPrivacy}
          </a>
          .
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">§2 Cele i podstawy przetwarzania</h2>
        <p className="mb-2">Dane przetwarzamy w celu:</p>
        <ul className="list-disc list-inside text-gray-800 space-y-1 mb-4">
          <li>założenia i obsługi konta oraz świadczenia usług drogą elektroniczną (art. 6 ust. 1 lit. b RODO),</li>
          <li>realizacji zleceń, ofert, płatności i rozliczeń (art. 6 ust. 1 lit. b i c RODO),</li>
          <li>weryfikacji tożsamości wykonawców (KYC), jeśli obowiązek wynika z prawa lub polityki ryzyka (art. 6 ust. 1 lit. c i f),</li>
          <li>marketingu własnych usług oraz analityki — o ile wyrazisz zgodę lub na podstawie prawnie uzasadnionego interesu (art. 6 ust. 1 lit. a i f RODO),</li>
          <li>dochodzenia lub obrony roszczeń (art. 6 ust. 1 lit. f RODO).</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-3">§3 Odbiorcy danych i przekazywanie poza EOG</h2>
        <p className="text-gray-800 mb-3">
          Dane mogą być powierzane podmiotom przetwarzającym w naszym imieniu (hosting, e-mail, analityka, obsługa
          zgłoszeń). <strong>Płatności elektroniczne</strong> obsługiwane są przez certyfikowanych operatorów, w
          szczególności <strong>Stripe</strong> (Stripe Technology Europe Ltd. lub podmioty powiązane w strukturze
          Stripe) oraz — w zależności od metody płatności — <strong>Przelewy24</strong>. Przekazanie danych niezbędnych
          do autoryzacji transakcji odbywa się na podstawie umów powierzenia / klauzul standardowych zgodnie z
          dokumentacją operatora.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Szczegóły:{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            polityka prywatności Stripe
          </a>
          ; dla P24 — regulamin i polityka dostawcy widoczne przy płatności.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">§4 Okres przechowywania</h2>
        <p className="text-gray-800 mb-4">
          Przechowujemy dane przez czas korzystania z usług oraz przez okres wymagany przepisami (m.in. rachunkowych,
          podatkowych), a następnie usuwamy lub anonimizujemy, jeśli przepis nie wymaga dłuższego archiwizowania.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">§5 Prawa osoby, której dane dotyczą</h2>
        <ul className="list-disc list-inside text-gray-800 mb-4">
          <li>dostęp do danych, sprostowanie, usunięcie lub ograniczenie przetwarzania,</li>
          <li>sprzeciw wobec przetwarzania w celach marketingowych lub prawnie uzasadnionego interesu,</li>
          <li>przenoszenie danych, o ile technicznie możliwe,</li>
          <li>wniesienie skargi do Prezesa UODO (uodo.gov.pl).</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-3">§6 Pliki cookies</h2>
        <p className="text-gray-800 mb-4">
          Serwis wykorzystuje pliki cookies niezbędne do działania strony, sesji i bezpieczeństwa, a za Twoją zgodą —
          cookies analityczne lub marketingowe. Możesz zarządzać zgodą w banerze cookies lub w ustawieniach
          przeglądarki.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">§7 Zmiany</h2>
        <p className="text-gray-800 mb-8">
          Aktualna wersja polityki jest publikowana pod adresem{" "}
          <Link to="/prywatnosc" className="text-indigo-600 hover:underline">
            /prywatnosc
          </Link>
          . O istotnych zmianach możemy poinformować e-mailem lub komunikatem na platformie.
        </p>
      </div>
      <Footer />
    </div>
  );
}
