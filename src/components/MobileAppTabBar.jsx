import { useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, ClipboardList, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const tabClass =
  "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-1 text-[10px] font-medium transition-colors";

export default function MobileAppTabBar() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  const visible = useMemo(() => {
    if (loading || !user) return false;
    if (user.role === "admin") return false;
    if (pathname.startsWith("/admin")) return false;
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/verify-email")
    ) {
      return false;
    }
    return true;
  }, [loading, user, pathname]);

  useEffect(() => {
    if (visible) {
      document.body.classList.add("has-mobile-tab");
    } else {
      document.body.classList.remove("has-mobile-tab");
    }
    return () => document.body.classList.remove("has-mobile-tab");
  }, [visible]);

  const homePath = useMemo(() => {
    if (!user) return "/";
    if (
      user.role === "provider" ||
      user.role === "company_owner" ||
      user.role === "company_manager"
    ) {
      return "/provider-home";
    }
    return "/home";
  }, [user]);

  const isProviderSide = useMemo(() => {
    if (!user) return false;
    return (
      user.role === "provider" ||
      user.role === "company_owner" ||
      user.role === "company_manager"
    );
  }, [user]);

  /** „Moje zlecenia” — działa dla klienta i wykonawcy (GET /api/orders/my). */
  const ordersPath = "/my-orders";

  if (!visible) return null;

  const inactive = { color: "var(--muted-foreground)" };
  const activeStyle = { color: "var(--primary)" };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[45] border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
      aria-label="Nawigacja aplikacji"
    >
      <div className="flex max-w-lg mx-auto">
        <NavLink
          to={homePath}
          end
          className={tabClass}
          style={({ isActive }) => (isActive ? activeStyle : inactive)}
        >
          <Home className="w-6 h-6 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="truncate w-full text-center">Start</span>
        </NavLink>
        <NavLink
          to={ordersPath}
          className={tabClass}
          style={({ isActive }) => (isActive ? activeStyle : inactive)}
        >
          <ClipboardList className="w-6 h-6 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="truncate w-full text-center">{isProviderSide ? "Oferty" : "Zlecenia"}</span>
        </NavLink>
        <NavLink
          to="/inbox"
          className={tabClass}
          style={({ isActive }) => (isActive ? activeStyle : inactive)}
        >
          <MessageCircle className="w-6 h-6 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="truncate w-full text-center">Czat</span>
        </NavLink>
        <NavLink
          to="/account"
          className={tabClass}
          style={({ isActive }) => (isActive ? activeStyle : inactive)}
        >
          <UserRound className="w-6 h-6 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="truncate w-full text-center">Konto</span>
        </NavLink>
      </div>
    </nav>
  );
}
