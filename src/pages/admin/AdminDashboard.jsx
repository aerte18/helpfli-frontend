import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link to="/home" className="text-slate-600 hover:underline">Podgląd Home</Link>
      </div>

          {/* KPI */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Użytkownicy zaakceptowani" value="24,1K" />
            <KPI label="Nowi (miesiąc)" value="8,213" />
            <KPI label="GMV (30d)" value="2,41 mln zł" />
            <KPI label="Śr. cena" value="185 zł" />
          </section>

          {/* Tables */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Nowi użytkownicy">
              <SimpleTable
                headers={["Nazwa", "Email", "Telefon", "Status"]}
                rows={[
                  ["Kathryn Murphy", "k.murphy@example.co", "+48 609 211 286", "Zaakceptowany"],
                  ["Devon Lane", "d.lane@example.com", "+48 789 358 136", "Zaakceptowany"],
                  ["Savannah Nguyen", "s.nguyen@example.com", "+48 513 783 919", "Oczekuje"],
                ]}
              />
            </Card>
            <Card title="Ostatnie zlecenia">
              <SimpleTable
                headers={["ID", "Użytkownik", "Wykonawca", "Kwota"]}
                rows={[["#18239", "Dianne Russell", "Marvin Cleaning", "250 zł"],["#18238", "Albert Flores", "Ralph Electrical", "160 zł"],["#18237", "Cody Fisher", "DIY Locals", "220 zł"]]}
                linkText="Zobacz wszystko"
              />
            </Card>
          </section>

          {/* Bottom */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Popularne problemy">
              <SimpleTable
                headers={["Problem", "Zgłoszenia"]}
                rows={[["Zatkany odpływ", "340"],["Brak prądu", "315"],["Uszk. gniazdko", "287"],["Pęknięta rura", "225"],["Niesprawna lodówka", "209"]]}
              />
            </Card>
            <Card title="Przegląd rynku">
              <div className="h-56 rounded-xl bg-[linear-gradient(135deg,#eff6ff,#eef2ff)] flex items-center justify-center text-slate-500">
                (Miejsce na mapę/wykres)
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
function SimpleTable({ headers, rows, linkText }) {
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
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-4">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {linkText && <div className="mt-2 text-blue-700 text-sm hover:underline cursor-pointer">{linkText}</div>}
    </div>
  );
}