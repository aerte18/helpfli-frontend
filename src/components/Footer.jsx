import React from "react";
import { Link } from "react-router-dom";
import { companyPublicInfo } from "../legal/companyPublicInfo";
import SocialMediaLinks from "./SocialMediaLinks";

export default function Footer() {
  const c = companyPublicInfo;
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0">
          {/* Przydatne linki */}
          <div className="min-w-[220px] rounded-xl border border-gray-100 p-4 md:min-w-0 md:rounded-none md:border-0 md:p-0">
            <h3 className="text-base font-semibold text-gray-900 mb-3 md:text-lg md:mb-4">Przydatne linki</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  O nas
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Lista usług
                </Link>
              </li>
              <li>
                <Link to="/cennik" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Cennik i opłaty
                </Link>
              </li>
              <li>
                <Link to="/dane-firmy" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Informacje o operatorze
                </Link>
              </li>
              <li>
                <Link to="/regulamin" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link to="/prywatnosc" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link to="/cooperation" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Współpraca
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Opinie
                </Link>
              </li>
            </ul>
          </div>

          {/* Pomoc */}
          <div className="min-w-[220px] rounded-xl border border-gray-100 p-4 md:min-w-0 md:rounded-none md:border-0 md:p-0">
            <h3 className="text-base font-semibold text-gray-900 mb-3 md:text-lg md:mb-4">Pomoc</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/poradniki" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Poradniki AI
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Centrum pomocy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Operator */}
          <div className="min-w-[220px] rounded-xl border border-gray-100 p-4 md:min-w-0 md:rounded-none md:border-0 md:p-0">
            <h3 className="text-base font-semibold text-gray-900 mb-3 md:text-lg md:mb-4">Operator</h3>
            <div className="text-sm md:text-base text-gray-600 space-y-2">
              <p className="font-medium text-gray-900">{c.legalName}</p>
              <p>
                <Link to="/dane-firmy" className="text-indigo-600 hover:underline">
                  Informacje o operatorze
                </Link>
              </p>
              <p>
                <a href={`mailto:${c.emailContact}`} className="hover:text-gray-900">
                  {c.emailContact}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Dolna część footera */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2026 Helpfli. Wszystkie prawa zastrzeżone.
            </div>
            <SocialMediaLinks variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}

