import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CompanyTab({ user }) {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.company) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/api/companies/${user.company}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          setCompany(data);
        } else {
          setError('Nie udało się pobrać danych firmy');
        }
      } catch (err) {
        console.error('Błąd pobierania firmy:', err);
        setError('Błąd pobierania danych firmy');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [user?.company]);

  const isCompanyOwner = user?.role === 'company_owner' || user?.roleInCompany === 'owner';
  const isCompanyManager = user?.role === 'company_manager' || user?.roleInCompany === 'manager';
  const isInCompany = !!user?.company;

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Ładowanie...</div>
    );
  }

  // Jeśli użytkownik nie ma firmy
  if (!isInCompany) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="text-blue-600 text-3xl">🏢</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                Nie należysz do żadnej firmy
              </h3>
              <p className="text-blue-800 mb-4">
                Możesz zarejestrować firmę i zarządzać zespołem albo dołączyć do istniejącej firmy.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/company/create"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Zarejestruj firmę
                </Link>
                <Link
                  to="/company/join"
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Dołącz do firmy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Jeśli użytkownik ma firmę
  return (
    <div className="space-y-4">
      {/* Informacje o firmie */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{company?.name || 'Moja firma'}</h2>
            <p className="text-gray-600 mt-1">
              {isCompanyOwner ? 'Właściciel' : isCompanyManager ? 'Manager' : 'Członek'}
            </p>
          </div>
          {(isCompanyOwner || isCompanyManager) && (
            <Link
              to="/account/company"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Panel zarządzania →
            </Link>
          )}
        </div>

        {company && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm text-gray-500">NIP</div>
              <div className="font-medium">{company.nip || 'Brak'}</div>
            </div>
            {company.regon && (
              <div>
                <div className="text-sm text-gray-500">REGON</div>
                <div className="font-medium">{company.regon}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{company.email || user?.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Telefon</div>
              <div className="font-medium">{company.phone || user?.phone || 'Brak'}</div>
            </div>
            {company.address && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500">Adres</div>
                <div className="font-medium">
                  {typeof company.address === 'string' 
                    ? company.address 
                    : `${company.address.street || ''} ${company.address.city || ''}`.trim()}
                </div>
              </div>
            )}
          </div>
        )}

        {company?.status === 'pending' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <span>⏳</span>
              <span className="text-sm">Firma oczekuje na weryfikację</span>
            </div>
          </div>
        )}

        {company?.status === 'active' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <span>✅</span>
              <span className="text-sm">Firma jest zweryfikowana i aktywna</span>
            </div>
          </div>
        )}
      </div>

      {/* Szybkie akcje */}
      {(isCompanyOwner || isCompanyManager) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/account/company"
            className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold mb-1">Zarządzaj zespołem</div>
            <div className="text-sm text-gray-600">Dodaj i zarządzaj wykonawcami</div>
          </Link>
          <Link
            to="/account/company"
            className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-semibold mb-1">Rozliczenia</div>
            <div className="text-sm text-gray-600">Portfel i faktury firmy</div>
          </Link>
          <Link
            to="/account/company"
            className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-semibold mb-1">Ustawienia</div>
            <div className="text-sm text-gray-600">Konfiguracja firmy</div>
          </Link>
        </div>
      )}
    </div>
  );
}

