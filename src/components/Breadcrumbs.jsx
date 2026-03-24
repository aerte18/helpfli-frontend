import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  // Specjalne mapowanie dla niektórych ścieżek
  const getLabel = (seg, path) => {
    // Dla /account/company pokaż "Panel firmy" zamiast "company"
    if (path === "/account/company") {
      return "Panel firmy";
    }
    // Dla /company/dashboard pokaż "Dashboard" zamiast "dashboard"
    if (path === "/company/dashboard") {
      return "Dashboard";
    }
    // Dla /account pokaż "Konto" zamiast "account"
    if (path === "/account" && !segments.includes("company")) {
      return "Konto";
    }
    // Domyślnie: zamień podkreślenia i myślniki na spacje i sformatuj
    return decodeURIComponent(seg).replace(/[-_]/g, " ");
  };

  // Buduj breadcrumbs z inteligentnym mapowaniem
  const crumbs = segments.map((seg, idx) => {
    const path = "/" + segments.slice(0, idx + 1).join("/");
    const label = getLabel(seg, path);
    return { path, label };
  });

  // Specjalna obsługa dla /account/company - pomiń "account" w breadcrumbs
  const filteredCrumbs = crumbs.filter((crumb, idx) => {
    // Jeśli jesteśmy na /account/company, pomiń pośredni "account"
    if (location.pathname === "/account/company" && crumb.path === "/account") {
      return false;
    }
    return true;
  });

  if (filteredCrumbs.length === 0) return null;

  return (
    <nav 
      className="px-4 py-2 text-sm text-white" 
      aria-label="Breadcrumb"
      style={{ backgroundColor: 'var(--foreground)' }}
    >
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded">
            Start
          </Link>
        </li>
        {filteredCrumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1">
            <span>/</span>
            {i < filteredCrumbs.length - 1 ? (
              <Link to={c.path} className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-white font-medium">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}















