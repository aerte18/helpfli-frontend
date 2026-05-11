import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { companyPublicInfo } from "../legal/companyPublicInfo";

/**
 * Publiczna strona „informacje o firmie” — checklista P24 / przejrzystość dla płatności.
 */
export default function DaneFirmy() {
  const c = companyPublicInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Informacje o podmiocie</h1>
        <p className="text-gray-600 mb-8">
          Poniższe dane identyfikują operatora serwisu <strong>{c.siteUrl.replace(/^https?:\/\//, "")}</strong>{" "}
          (marka <strong>{c.brand}</strong>) w kontaktach prawnych, reklamacjach dotyczących działania platformy oraz
          płatności obsługiwanych przez zewnętrznych operatorów (np. Stripe, Przelewy24).
        </p>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Dane rejestrowe</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-1">
            <div>
              <dt className="text-gray-500">Pełna nazwa</dt>
              <dd className="font-medium text-gray-900">{c.legalName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Adres</dt>
              <dd className="font-medium text-gray-900">
                {c.addressLine1}
                <br />
                {c.addressLine2}
                <br />
                {c.country}
              </dd>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <dt className="text-gray-500">KRS</dt>
                <dd className="font-medium text-gray-900">{c.krs}</dd>
              </div>
              <div>
                <dt className="text-gray-500">NIP</dt>
                <dd className="font-medium text-gray-900">{c.nip}</dd>
              </div>
              <div>
                <dt className="text-gray-500">REGON</dt>
                <dd className="font-medium text-gray-900">{c.regon}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Kontakt</h2>
          <p className="text-sm text-gray-700">
            <strong>E-mail:</strong>{" "}
            <a href={`mailto:${c.emailLegal}`} className="text-indigo-600 hover:underline">
              {c.emailLegal}
            </a>
          </p>
          <p className="text-sm text-gray-700">
            <strong>Telefon:</strong> {c.phone}
          </p>
          <p className="text-sm text-gray-700">
            Formularz: <Link to="/contact" className="text-indigo-600 hover:underline">/contact</Link>
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-8">
          <strong>Uwaga dla zespołu:</strong> pola w nawiasach kwadratowych lub zmienne{" "}
          <code className="rounded bg-amber-100 px-1">VITE_COMPANY_*</code> należy uzupełnić przed audytem P24 /
          finalnym wdrożeniem produkcyjnym.
        </div>

        <ul className="text-sm text-gray-600 space-y-2 mb-10">
          <li>
            <Link to="/regulamin" className="text-indigo-600 hover:underline">
              Regulamin platformy
            </Link>
          </li>
          <li>
            <Link to="/prywatnosc" className="text-indigo-600 hover:underline">
              Polityka prywatności
            </Link>
          </li>
          <li>
            <Link to="/cennik" className="text-indigo-600 hover:underline">
              Cennik i model opłat
            </Link>
          </li>
        </ul>
      </div>
      <Footer />
    </div>
  );
}
