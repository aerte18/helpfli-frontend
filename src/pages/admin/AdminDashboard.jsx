import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/analytics/dashboard"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Nie udało się pobrać danych dashboardu");
        const json = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [token]);

  const usersAccepted = data?.kpi?.usersAccepted ?? 0;
  const newUsersMonth = data?.kpi?.newUsersMonth ?? 0;
  const gmv30d = data?.kpi?.gmv30d ?? 0;
  const avgPrice = data?.kpi?.avgPrice ?? 0;

  const recentUsersRows = useMemo(
    () => (data?.recentUsers || []).map((u) => [u.name, u.email, u.phone, u.status]),
    [data]
  );
  const recentOrdersRows = useMemo(
    () => (data?.recentOrders || []).map((o) => [`#${o.id.slice(-6)}`, o.user, o.provider, `${o.amountPLN} zł`]),
    [data]
  );
  const topProblemsRows = useMemo(
    () => (data?.topProblems || []).map((p) => [p.name, p]),
    [data]
  );

  if (loading) {
    return <div className="py-10 text-slate-500">Ładowanie dashboardu...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link to="/home" className="text-slate-600 hover:underline">Podgląd Home</Link>
      </div>

          {/* KPI */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Użytkownicy zaakceptowani" value={formatInt(usersAccepted)} />
            <KPI label="Nowi (miesiąc)" value={formatInt(newUsersMonth)} />
            <KPI label="GMV (30d)" value={formatPLN(gmv30d)} />
            <KPI label="Śr. cena" value={`${formatInt(avgPrice)} zł`} />
          </section>

          {/* Tables */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Nowi użytkownicy">
              <SimpleTable
                headers={["Nazwa", "Email", "Telefon", "Status"]}
                rows={recentUsersRows}
              />
            </Card>
            <Card title="Ostatnie zlecenia">
              <SimpleTable
                headers={["ID", "Użytkownik", "Wykonawca", "Kwota"]}
                rows={recentOrdersRows}
                linkText="Zobacz wszystko"
                linkTo="/admin/analytics"
              />
            </Card>
          </section>

          {/* Bottom */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Popularne problemy (AI + spory)">
              <SimpleTable
                headers={["Problem", "Źródło", "Zgłoszenia"]}
                rows={topProblemsRows}
                rowRenderer={(row, i) => {
                  const [name, problem] = row;
                  const aiCount = Number(problem?.aiCount || 0);
                  const disputeCount = Number(problem?.disputeCount || 0);
                  return (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{name}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1.5">
                          {aiCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                              AI
                            </span>
                          )}
                          {disputeCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              Spór
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4">{problem?.count ?? 0}</td>
                    </tr>
                  );
                }}
              />
            </Card>
            <Card title="Przegląd rynku">
              <div className="h-56 rounded-xl bg-[linear-gradient(135deg,#eff6ff,#eef2ff)] p-4 overflow-auto">
                {(data?.marketOverview || []).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Brak danych rynkowych
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="py-2 pr-4">Miasto</th>
                        <th className="py-2 pr-4">Zlecenia (30d)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.marketOverview || []).map((row) => (
                        <tr key={row.city} className="border-t border-slate-200/70">
                          <td className="py-2 pr-4">{row.city}</td>
                          <td className="py-2 pr-4">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </section>

          {/* Admin links */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin" className="block rounded-xl border p-4 hover:bg-white/50 transition">
              <div className="font-semibold">Panel główny</div>
              <div className="text-sm text-gray-600">Podsumowanie</div>
            </Link>
            <Link to="/admin/ranking" className="block rounded-xl border p-4 hover:bg-white/50 transition">
              <div className="font-semibold">Konfiguracja rankingu</div>
              <div className="text-sm text-gray-600">Wagi, próg TOP, audyt</div>
            </Link>
            <Link to="/admin/verifications" className="block rounded-xl border p-4 hover:bg-white/50 transition">
              <div className="font-semibold">Weryfikacje</div>
              <div className="text-sm text-gray-600">KYC, zatwierdzanie wykonawców</div>
            </Link>
            <Link to="/admin/kb" className="block rounded-xl border p-4 hover:bg-white/50 transition">
              <div className="font-semibold">Baza wiedzy</div>
              <div className="text-sm text-gray-600">Zarządzanie artykułami KB</div>
            </Link>
          </section>
    </>
  );
}
function formatInt(v) {
  return new Intl.NumberFormat("pl-PL").format(Number(v || 0));
}
function formatPLN(grosze) {
  const zl = Number(grosze || 0) / 100;
  if (zl >= 1_000_000) return `${(zl / 1_000_000).toFixed(2).replace(".", ",")} mln zł`;
  return `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(zl)} zł`;
}
function KPI({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
function SimpleTable({ headers, rows, linkText, linkTo, rowRenderer }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:hover]:bg-slate-50">
          {rows.map((r, i) =>
            rowRenderer ? rowRenderer(r, i) : (
              <tr key={i} className="border-t">
                {r.map((c, j) => (
                  <td key={j} className="py-2 pr-4">{c}</td>
                ))}
              </tr>
            )
          )}
          {rows.length === 0 && (
            <tr className="border-t">
              <td className="py-3 pr-4 text-slate-500" colSpan={headers.length}>Brak danych</td>
            </tr>
          )}
        </tbody>
      </table>
      {linkText && linkTo && (
        <Link to={linkTo} className="mt-2 inline-block text-blue-700 text-sm hover:underline">
          {linkText}
        </Link>
      )}
    </div>
  );
}