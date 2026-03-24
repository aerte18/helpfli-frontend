import React from "react";
import Footer from "../components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Polityka Prywatności Helpfli</h1>

      <p>
        Administratorem danych osobowych użytkowników Platformy Helpfli jest
        [Twoja Firma Sp. z o.o.] z siedzibą w [adres], NIP: [NIP]. Kontakt: [email kontaktowy].
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§1 Zakres zbieranych danych</h2>
      <p>
        Zbieramy dane osobowe niezbędne do świadczenia usług, w szczególności:
        imię, nazwisko, adres e-mail, numer telefonu, dane lokalizacyjne, dane do faktury.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§2 Cele przetwarzania danych</h2>
      <p>Dane osobowe są przetwarzane w celu:</p>
      <ul className="list-disc list-inside">
        <li>rejestracji i obsługi konta użytkownika,</li>
        <li>realizacji zleceń i płatności,</li>
        <li>weryfikacji tożsamości Usługodawców (KYC),</li>
        <li>wystawiania opinii i ocen,</li>
        <li>marketingu i powiadomień, jeśli użytkownik wyraził zgodę.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§3 Podstawa prawna</h2>
      <p>
        Dane są przetwarzane na podstawie art. 6 ust. 1 lit. b, c i f RODO – 
        wykonanie umowy, wypełnienie obowiązków prawnych i prawnie uzasadniony interes Administratora.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§4 Udostępnianie danych</h2>
      <p>
        Dane mogą być przekazywane podmiotom wspierającym obsługę płatności,
        księgowości, IT oraz organom uprawnionym na mocy prawa.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§5 Cookies</h2>
      <p>
        Platforma wykorzystuje pliki cookies w celu poprawy działania serwisu,
        analizy ruchu oraz personalizacji treści. Użytkownik może wyłączyć cookies
        w ustawieniach przeglądarki.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§6 Okres przechowywania danych</h2>
      <p>
        Dane przechowujemy przez okres korzystania z usług oraz przez czas wymagany
        przepisami prawa podatkowego i rachunkowego.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§7 Prawa użytkownika</h2>
      <ul className="list-disc list-inside">
        <li>dostęp do swoich danych,</li>
        <li>sprostowanie danych,</li>
        <li>usunięcie danych („prawo do bycia zapomnianym"),</li>
        <li>ograniczenie przetwarzania,</li>
        <li>sprzeciw wobec przetwarzania,</li>
        <li>przeniesienie danych do innego administratora.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§8 Kontakt</h2>
      <p>
        W sprawach związanych z ochroną danych osobowych prosimy o kontakt
        pod adresem e-mail: [email kontaktowy].
      </p>
      </div>
      <Footer />
    </div>
  );
}




