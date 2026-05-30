import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Building2 } from "lucide-react";

export default function CompanyTab({ user }) {
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

  if (!isInCompany) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-white p-2 text-indigo-600 shadow-sm">
              <Users className="h-6 w-6" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-indigo-950 mb-2">
                Dołącz do firmy wieloosobowej
              </h3>
              <p className="text-indigo-900/90 mb-2 text-sm leading-relaxed">
                Jako wykonawca działasz samodzielnie — jako osoba fizyczna lub firma jednoosobowa
                (ustawiasz to w <strong>Rozliczeniach</strong> i weryfikacji profilu).
              </p>
              <p className="text-indigo-900/80 mb-4 text-sm leading-relaxed">
                Jeśli chcesz pracować w większym zespole (np. firma remontowa z wieloma fachowcami),
                możesz dołączyć do istniejącej firmy wieloosobowej — wyślij prośbę lub poczekaj na zaproszenie od właściciela.
              </p>
              <Link
                to="/company/join"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                Wyślij prośbę o dołączenie
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800 mb-1 flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" aria-hidden />
            Chcesz zarządzać własnym zespołem?
          </p>
          <p>
            Zakładanie firmy wieloosobowej (konto właściciela z panelem zespołu) odbywa się osobno —
            nie z poziomu konta wykonawcy. Skontaktuj się z nami lub załóż konto biznesowe przez stronę rejestracji firm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{company?.name || company?.company?.name || 'Mój zespół'}</h2>
            <p className="text-gray-600 mt-1">
              {isCompanyOwner ? 'Właściciel firmy' : isCompanyManager ? 'Manager' : 'Członek zespołu'}
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
              <div className="font-medium">{company.nip || company.company?.nip || 'Brak'}</div>
            </div>
            {(company.regon || company.company?.regon) && (
              <div>
                <div className="text-sm text-gray-500">REGON</div>
                <div className="font-medium">{company.regon || company.company?.regon}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{company.email || company.company?.email || user?.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Telefon</div>
              <div className="font-medium">{company.phone || company.company?.phone || user?.phone || 'Brak'}</div>
            </div>
          </div>
        )}

        {(company?.status === 'pending' || company?.company?.status === 'pending') && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <span>⏳</span>
              <span className="text-sm">Firma oczekuje na weryfikację</span>
            </div>
          </div>
        )}

        {(company?.status === 'active' || company?.company?.status === 'active') && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <span>✅</span>
              <span className="text-sm">Firma jest zweryfikowana i aktywna</span>
            </div>
          </div>
        )}
      </div>

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
