import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function safeReadUserFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const adminUser = user || safeReadUserFromStorage();
  
  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
        {/* Left nav */}
        <aside className="bg-white rounded-2xl shadow">
          {/* Profil admina */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{adminUser?.name || 'Administrator'}</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
            </div>
          </div>
          <nav className="px-2 pb-3 space-y-1">
            <NavItem active={location.pathname === '/admin'} to="/admin">Dashboard</NavItem>
            <NavItem active={location.pathname === '/admin/verifications'} to="/admin/verifications">Weryfikacje</NavItem>
            <NavItem active={location.pathname === '/admin/kyc'} to="/admin/kyc">KYC</NavItem>
            <NavItem active={location.pathname === '/admin/analytics'} to="/admin/analytics">Analityka</NavItem>
            <NavItem active={location.pathname === '/admin/ranking'} to="/admin/ranking">Ranking</NavItem>
            <NavItem active={location.pathname === '/admin/kb'} to="/admin/kb">Baza wiedzy</NavItem>
            <NavItem active={location.pathname === '/admin/partners'} to="/admin/partners">Partnerzy</NavItem>
            <NavItem active={location.pathname === '/admin/sponsor-ads'} to="/admin/sponsor-ads">Reklamy sponsorowane</NavItem>
            <NavItem active={location.pathname === '/admin/coupons'} to="/admin/coupons">Kupony</NavItem>
            <NavItem active={location.pathname === '/admin/invoices'} to="/admin/invoices">Faktury</NavItem>
            <NavItem active={location.pathname === '/admin/notifications'} to="/admin/notifications">Powiadomienia</NavItem>
            <NavItem active={location.pathname === '/admin/reports'} to="/admin/reports">Raporty</NavItem>
            <NavItem active={location.pathname === '/admin/settings'} to="/admin/settings">Ustawienia</NavItem>
          </nav>
        </aside>

        {/* Main content */}
        <main className="space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ children, active, to }) {
  if (to) {
    return (
      <Link 
        to={to}
        className={`block px-3 py-2 rounded-xl transition-colors ${
          active ? "bg-slate-100 font-medium text-slate-900" : "hover:bg-slate-50 text-slate-700"
        }`}
      >
        {children}
      </Link>
    );
  }
  
  return (
    <div className={`px-3 py-2 rounded-xl ${active ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}>
      {children}
    </div>
  );
}

