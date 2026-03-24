import React from "react";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Regulations() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Regulamin Platformy Helpfli</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Data ostatniej aktualizacji:</strong> {new Date().toLocaleDateString('pl-PL')}
        </p>
      </div>

      <p className="mb-4">
        Niniejszy Regulamin określa zasady korzystania z platformy Helpfli,
        dostępnej pod adresem helpfli.pl, prowadzonej przez Helpfli Sp. z o.o.
        z siedzibą w Polsce, wpisaną do rejestru przedsiębiorców KRS pod numerem [KRS],
        NIP: [NIP], REGON: [REGON].
      </p>

      <p className="mb-4">
        <strong>Kontakt:</strong> kontakt@helpfli.pl
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§1 Definicje</h2>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li><b>Platforma Helpfli</b> – serwis internetowy umożliwiający Klientom i Usługodawcom zawieranie umów o świadczenie usług, dostępny pod adresem helpfli.pl.</li>
        <li><b>Klient</b> – osoba fizyczna lub prawna korzystająca z usług Usługodawców za pośrednictwem Platformy.</li>
        <li><b>Usługodawca (Wykonawca)</b> – osoba fizyczna, prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, świadcząca usługi za pośrednictwem Platformy.</li>
        <li><b>Konto</b> – indywidualny panel użytkownika, tworzony podczas rejestracji, umożliwiający korzystanie z usług Platformy.</li>
        <li><b>Zlecenie</b> – zamówienie usługi złożone przez Klienta za pośrednictwem Platformy.</li>
        <li><b>Oferta</b> – propozycja wykonania zlecenia złożona przez Usługodawcę.</li>
        <li><b>Umowa</b> – umowa o świadczenie usług zawierana między Klientem a Usługodawcą.</li>
        <li><b>Gwarancja Helpfli</b> – ochrona transakcji dla płatności realizowanych przez system płatności Platformy.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§2 Rejestracja i korzystanie z konta</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>2.1.</strong> Założenie konta na Platformie jest dobrowolne i bezpłatne. Rejestracja wymaga podania danych osobowych zgodnie z <Link to="/prywatnosc" className="text-blue-600 hover:underline">Polityką Prywatności</Link>.
        </p>
        <p>
          <strong>2.2.</strong> Klient i Usługodawca są zobowiązani podać prawdziwe, aktualne i kompletne dane. Podanie nieprawdziwych danych może skutkować odmową świadczenia usług lub usunięciem konta.
        </p>
        <p>
          <strong>2.3.</strong> Usługodawcy podlegają procesowi weryfikacji tożsamości (KYC - Know Your Customer) zgodnie z obowiązującymi przepisami prawa.
        </p>
        <p>
          <strong>2.4.</strong> Zabrania się udostępniania konta osobom trzecim. Użytkownik ponosi pełną odpowiedzialność za wszystkie działania dokonane za pomocą jego konta.
        </p>
        <p>
          <strong>2.5.</strong> Użytkownik zobowiązany jest do zachowania poufności danych logowania. W przypadku podejrzenia nieuprawnionego dostępu do konta, użytkownik zobowiązany jest niezwłocznie zmienić hasło i powiadomić Administratora.
        </p>
        <p>
          <strong>2.6.</strong> Administrator zastrzega sobie prawo do czasowego lub trwałego zablokowania lub usunięcia konta użytkownika, który narusza postanowienia Regulaminu lub przepisy prawa.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§3 Świadczenie usług</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>3.1.</strong> Platforma Helpfli pełni rolę pośrednika w zawieraniu umów pomiędzy Klientem a Usługodawcą. Platforma nie jest stroną umowy o świadczenie usług.
        </p>
        <p>
          <strong>3.2.</strong> Umowa o realizację zlecenia zawierana jest bezpośrednio pomiędzy Klientem a Usługodawcą na podstawie oferty złożonej przez Usługodawcę i zaakceptowanej przez Klienta.
        </p>
        <p>
          <strong>3.3.</strong> Helpfli nie ponosi odpowiedzialności za jakość, terminowość ani sposób wykonania usług świadczonych przez Usługodawców, z wyjątkiem płatności dokonanych w systemie płatności Platformy, które objęte są Gwarancją Helpfli.
        </p>
        <p>
          <strong>3.4.</strong> Usługodawca zobowiązany jest do świadczenia usług zgodnie z opisem w ofercie oraz zgodnie z obowiązującymi przepisami prawa.
        </p>
        <p>
          <strong>3.5.</strong> Klient zobowiązany jest do przekazania Usługodawcy wszystkich niezbędnych informacji i umożliwienia wykonania usługi.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§4 Płatności i gwarancja Helpfli</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>4.1.</strong> Płatności mogą być realizowane przez system płatności online (np. Stripe, Przelewy24) lub bezpośrednio między Klientem a Usługodawcą.
        </p>
        <p>
          <strong>4.2.</strong> W przypadku płatności realizowanych przez system płatności Platformy, Klient otrzymuje ochronę transakcji („Gwarancja Helpfli"), która obejmuje:
        </p>
        <ul className="list-disc list-inside ml-6 space-y-1">
          <li>zabezpieczenie środków do momentu potwierdzenia wykonania usługi przez Klienta,</li>
          <li>możliwość zwrotu środków w przypadku niewykonania lub nienależytego wykonania usługi,</li>
          <li>mediację w sporach między Klientem a Usługodawcą.</li>
        </ul>
        <p>
          <strong>4.3.</strong> W przypadku płatności poza systemem Platformy, Helpfli nie odpowiada za rozliczenia między Klientem a Usługodawcą.
        </p>
        <p>
          <strong>4.4.</strong> Platforma pobiera prowizję od transakcji realizowanych przez system płatności, zgodnie z aktualnym cennikiem dostępnym na Platformie.
        </p>
        <p>
          <strong>4.5.</strong> Wszelkie zwroty środków realizowane są zgodnie z przepisami prawa konsumenckiego oraz postanowieniami umowy zawartej między Klientem a Usługodawcą.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§5 Opinie i oceny</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>5.1.</strong> Klienci mogą wystawiać opinie i oceny Usługodawcom po zrealizowanym zleceniu.
        </p>
        <p>
          <strong>5.2.</strong> Opinie muszą być rzetelne, zgodne z prawdą i nie mogą naruszać dóbr osobistych ani praw osób trzecich.
        </p>
        <p>
          <strong>5.3.</strong> Helpfli zastrzega sobie prawo do moderacji, edycji lub usunięcia opinii naruszających prawo, dobre obyczaje lub postanowienia Regulaminu.
        </p>
        <p>
          <strong>5.4.</strong> Usługodawca ma prawo do odpowiedzi na opinię Klienta.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§6 Odpowiedzialność</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>6.1.</strong> Helpfli odpowiada wyłącznie za prawidłowe działanie Platformy oraz za szkody wynikające z niewykonania lub nienależytego wykonania przez Platformę obowiązków wynikających z Regulaminu.
        </p>
        <p>
          <strong>6.2.</strong> Usługodawca ponosi pełną odpowiedzialność za wykonanie usług, w tym za szkody wyrządzone Klientowi w związku z niewykonaniem lub nienależytym wykonaniem usługi.
        </p>
        <p>
          <strong>6.3.</strong> Klient zobowiązany jest do podania prawdziwych danych, dokonania płatności zgodnie z umową oraz współpracy z Usługodawcą w zakresie niezbędnym do wykonania usługi.
        </p>
        <p>
          <strong>6.4.</strong> Helpfli nie ponosi odpowiedzialności za:
        </p>
        <ul className="list-disc list-inside ml-6 space-y-1">
          <li>jakość usług świadczonych przez Usługodawców,</li>
          <li>szkody wynikające z niewykonania lub nienależytego wykonania usługi przez Usługodawcę,</li>
          <li>działania lub zaniechania Klienta lub Usługodawcy,</li>
          <li>awarie techniczne niezależne od Platformy,</li>
          <li>utratę danych spowodowaną działaniami użytkownika lub siłą wyższą.</li>
        </ul>
        <p>
          <strong>6.5.</strong> Odpowiedzialność Helpfli jest ograniczona do wysokości prowizji pobranej od danej transakcji, z wyjątkiem przypadków, gdy szkoda wynika z umyślnego działania lub rażącego niedbalstwa Platformy.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§7 Reklamacje</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>7.1.</strong> Reklamacje dotyczące działania Platformy można zgłaszać na adres e-mail: kontakt@helpfli.pl lub za pośrednictwem formularza kontaktowego dostępnego na Platformie.
        </p>
        <p>
          <strong>7.2.</strong> Reklamacja powinna zawierać: imię i nazwisko (nazwę) reklamującego, adres e-mail, opis problemu oraz żądanie.
        </p>
        <p>
          <strong>7.3.</strong> Helpfli rozpatruje reklamacje w terminie 14 dni roboczych od dnia otrzymania reklamacji.
        </p>
        <p>
          <strong>7.4.</strong> Odpowiedź na reklamację zostanie przesłana na adres e-mail podany w reklamacji.
        </p>
        <p>
          <strong>7.5.</strong> W przypadku niezadowolenia z rozstrzygnięcia reklamacji, Klient będący konsumentem ma prawo skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w tym:
        </p>
        <ul className="list-disc list-inside ml-6 space-y-1">
          <li>zgłoszenia sprawy do stałego polubownego sądu konsumenckiego,</li>
          <li>zgłoszenia sprawy do wojewódzkiego inspektora Inspekcji Handlowej,</li>
          <li>skorzystania z platformy ODR (Online Dispute Resolution) dostępnej pod adresem: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://ec.europa.eu/consumers/odr</a>.</li>
        </ul>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§8 Prawo odstąpienia od umowy</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>8.1.</strong> Zgodnie z przepisami ustawy o prawach konsumenta, konsument ma prawo odstąpić od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny.
        </p>
        <p>
          <strong>8.2.</strong> Prawo odstąpienia nie przysługuje w przypadku, gdy usługa została w pełni wykonana za wyraźną zgodą konsumenta, który został poinformowany, że po spełnieniu świadczenia utraci prawo odstąpienia.
        </p>
        <p>
          <strong>8.3.</strong> Aby skorzystać z prawa odstąpienia, konsument powinien poinformować o swojej decyzji na adres: kontakt@helpfli.pl.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§9 Ochrona danych osobowych</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>9.1.</strong> Administratorem danych osobowych użytkowników Platformy jest Helpfli Sp. z o.o.
        </p>
        <p>
          <strong>9.2.</strong> Szczegółowe informacje dotyczące przetwarzania danych osobowych znajdują się w <Link to="/prywatnosc" className="text-blue-600 hover:underline">Polityce Prywatności</Link>.
        </p>
        <p>
          <strong>9.3.</strong> Użytkownik ma prawo do dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu wobec przetwarzania danych.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§10 Własność intelektualna</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>10.1.</strong> Wszystkie treści zamieszczone na Platformie, w tym teksty, grafiki, logo, znaki towarowe, są chronione prawem autorskim i stanowią własność Helpfli lub podmiotów trzecich.
        </p>
        <p>
          <strong>10.2.</strong> Użytkownik nie może kopiować, modyfikować, rozpowszechniać ani wykorzystywać w celach komercyjnych treści zamieszczonych na Platformie bez pisemnej zgody Helpfli.
        </p>
        <p>
          <strong>10.3.</strong> Użytkownik zachowuje prawa autorskie do treści zamieszczanych przez siebie na Platformie, udzielając jednocześnie Helpfli licencji do ich wykorzystania w celach związanych z działaniem Platformy.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-3">§11 Postanowienia końcowe</h2>
      <div className="space-y-3 mb-4">
        <p>
          <strong>11.1.</strong> Regulamin obowiązuje od dnia publikacji na stronie helpfli.pl/regulamin.
        </p>
        <p>
          <strong>11.2.</strong> Helpfli zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn, w szczególności w przypadku zmiany przepisów prawa, zmiany funkcjonalności Platformy lub z innych ważnych powodów.
        </p>
        <p>
          <strong>11.3.</strong> O zmianach Regulaminu użytkownicy zostaną poinformowani drogą elektroniczną (e-mail) oraz poprzez zamieszczenie informacji na Platformie co najmniej 14 dni przed wejściem zmian w życie.
        </p>
        <p>
          <strong>11.4.</strong> W przypadku braku akceptacji zmian Regulaminu, użytkownik ma prawo zrezygnować z korzystania z Platformy i usunąć swoje konto.
        </p>
        <p>
          <strong>11.5.</strong> W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy o prawach konsumenta oraz ustawy o świadczeniu usług drogą elektroniczną.
        </p>
        <p>
          <strong>11.6.</strong> Wszelkie spory wynikające z korzystania z Platformy będą rozstrzygane przez sądy właściwe dla siedziby Helpfli, chyba że przepisy prawa stanowią inaczej.
        </p>
        <p>
          <strong>11.7.</strong> Rejestrując się na Platformie, użytkownik potwierdza, że zapoznał się z Regulaminem i akceptuje jego postanowienia.
        </p>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Kontakt w sprawach związanych z Regulaminem:</strong><br />
          Helpfli Sp. z o.o.<br />
          E-mail: kontakt@helpfli.pl<br />
          Telefon: [numer telefonu]
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
