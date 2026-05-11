import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { companyPublicInfo } from "../legal/companyPublicInfo";

/**
 * Publiczny opis usług i opłat — pod P24/Stripe (widoczny „realny” marketplace, nie sam software).
 */
export default function Cennik() {
  const c = companyPublicInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Cennik i opłaty</h1>
        <p className="text-gray-600 mb-8">
          <strong>{c.brand}</strong> to <strong>marketplace usług lokalnych</strong>: łączymy osoby szukające
          wykonawców (m.in. hydraulika, elektryka, sprzątanie, transport) z wykonawcami, którzy składają oferty i
          realizują zlecenia. Opłaty za samo połączenie i obsługę transakcji w systemie są oddzielne od{" "}
          <strong>ceny usługi u wykonawcy</strong> (wynika z oferty).
        </p>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Usługi dla użytkownika</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>
              <strong>Publikacja zlecenia</strong> — opis potrzeby, wybór kategorii, kontakt z wykonawcami przez
              platformę.
            </li>
            <li>
              <strong>Realizacja usługi</strong> — wykonywana przez wybranego wykonawcę; wynagrodzenie wykonawcy i
              ewentualne koszty materiałów wynikają z treści oferty i umowy między stronami.
            </li>
            <li>
              <strong>Ochrona płatności w systemie</strong> (Gwarancja {c.brand}) — przy płatności przez operatora
              płatności środki są rozliczane zgodnie z{" "}
              <Link to="/regulamin" className="text-indigo-600 hover:underline">
                Regulaminem
              </Link>{" "}
              (m.in. zwolnienie po akceptacji wykonania lub procedury sporów).
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Opłaty platformy</h2>
          <p className="text-sm text-gray-700 mb-3">
            Platforma może pobierać <strong>prowizję</strong> od transakcji rozliczanych w systemie płatności oraz
            oferować <strong>pakiety abonamentowe</strong> (np. wyższy limit zapytań AI, niższe prowizje) — aktualne
            kwoty i korzyści:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>
              <Link to="/why-pro" className="text-indigo-600 hover:underline">
                Pakiety i ceny subskrypcji (klient / wykonawca)
              </Link>{" "}
              — strona publiczna z orientacyjnym cennikiem planów.
            </li>
            <li>
              Szczegóły prowizji od zleceń i portfela — w{" "}
              <Link to="/regulamin" className="text-indigo-600 hover:underline">
                Regulaminie
              </Link>{" "}
              oraz w interfejsie przy akceptacji oferty / płatności.
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Płatności online</h2>
          <p className="text-sm text-gray-700 mb-3">
            Płatności kartą, BLIK, Przelewy24 i innymi metodami dostępnymi w danym momencie obsługuje{" "}
            <strong>zewnętrzny operator płatności</strong> (np. Stripe z modułem Przelewy24). {c.legalName} nie
            przechowuje pełnych danych karty; przetwarzanie danych płatniczych odbywa się u operatora zgodnie z jego
            regulaminem oraz{" "}
            <Link to="/prywatnosc" className="text-indigo-600 hover:underline">
              Polityką prywatności
            </Link>{" "}
            {c.brand}.
          </p>
          <p className="text-sm text-gray-700">
            <strong>Reklamacje dotyczące działania platformy lub rozliczeń w modelu ochrony transakcji:</strong>{" "}
            <a href={`mailto:${c.emailLegal}`} className="text-indigo-600 hover:underline">
              {c.emailLegal}
            </a>{" "}
            lub{" "}
            <Link to="/contact" className="text-indigo-600 hover:underline">
              formularz kontaktowy
            </Link>
            . Spory co do jakości usługi fizycznej / zdalnej w pierwszej kolejności dotyczą stosunku Klient —
            Wykonawca; platforma może wspierać mediację zgodnie z Regulaminem.
          </p>
        </section>

        <p className="text-xs text-gray-500">
          Treść ma charakter informacyjny. Wiążące są postanowienia Regulaminu w brzmieniu obowiązującym w momencie
          złożenia zlecenia lub dokonania płatności.
        </p>
      </div>
      <Footer />
    </div>
  );
}
