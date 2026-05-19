import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { companyPublicInfo } from "../legal/companyPublicInfo";

/**
 * Informacje o operatorze serwisu â€” przejrzystoĹ›Ä‡ dla uĹĽytkownikĂłw i operatorĂłw pĹ‚atnoĹ›ci.
 */
export default function DaneFirmy() {
  const c = companyPublicInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Informacje o operatorze</h1>
        <p className="text-gray-600 mb-8">
          PoniĹĽsze dane identyfikujÄ… operatora serwisu{" "}
          <strong>{c.siteUrl.replace(/^https?:\/\//, "")}</strong> (marka <strong>{c.brand}</strong>) w kontaktach
          prawnych, reklamacjach dotyczÄ…cych dziaĹ‚ania platformy oraz przy pĹ‚atnoĹ›ciach obsĹ‚ugiwanych przez
          zewnÄ™trznych operatorĂłw (np. Stripe, Przelewy24).
        </p>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Operator</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Nazwa</dt>
              <dd className="font-medium text-gray-900">{c.legalName}</dd>
            </div>
            {c.addressLine1?.trim() && (
              <div>
                <dt className="text-gray-500">Adres</dt>
                <dd className="font-medium text-gray-900">
                  {c.addressLine1}
                  {c.addressLine2?.trim() ? (
                    <>
                      <br />
                      {c.addressLine2}
                    </>
                  ) : null}
                  <br />
                  {c.country}
                </dd>
              </div>
            )}
            {c.showRegistry && c.krs?.trim() && (
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
            )}
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Kontakt</h2>
          <p className="text-sm text-gray-700">
            <strong>E-mail:</strong>{" "}
            <a href={`mailto:${c.emailContact}`} className="text-indigo-600 hover:underline">
              {c.emailContact}
            </a>
          </p>
          {c.phone?.trim() && (
            <p className="text-sm text-gray-700">
              <strong>Telefon:</strong> {c.phone}
            </p>
          )}
          <p className="text-sm text-gray-700">
            Formularz:{" "}
            <Link to="/contact" className="text-indigo-600 hover:underline">
              /contact
            </Link>
          </p>
        </div>

        <ul className="text-sm text-gray-600 space-y-2 mb-10">
          <li>
            <Link to="/regulamin" className="text-indigo-600 hover:underline">
              Regulamin platformy
            </Link>
          </li>
          <li>
            <Link to="/prywatnosc" className="text-indigo-600 hover:underline">
              Polityka prywatnoĹ›ci
            </Link>
          </li>
          <li>
            <Link to="/cennik" className="text-indigo-600 hover:underline">
              Cennik i model opĹ‚at
            </Link>
          </li>
        </ul>
      </div>
      <Footer />
    </div>
  );
}


