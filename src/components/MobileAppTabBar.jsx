import { useEffect, useMemo, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, ClipboardList, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const tabClass =
  "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-1 text-[10px] font-medium transition-colors";

/** Safari: odstęp layout↔visual rzadko przekracza ~100px; większe wartości to zwykle artefakt przy scrollu → „dziura” pod paskiem. */
const MAX_VV_BOTTOM_GAP_PX = 120;

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

  /** Ustawia --qs-vv-bottom-offset (padding body, mapy itd.). Sam pasek: bottom:0 — offset na nav powodował „dziurę” przy scrollu w Safari. */
  const vvRaf = useRef(0);
  useEffect(() => {
    const root = document.documentElement;
    const clearOffset = () => {
      root.style.setProperty("--qs-vv-bottom-offset", "0px");
    };

    if (!visible) {
      clearOffset();
      return undefined;
    }

    const vv = window.visualViewport;
    const mq = window.matchMedia("(max-width: 767px)");

    const sync = () => {
      if (vvRaf.current) cancelAnimationFrame(vvRaf.current);
      vvRaf.current = requestAnimationFrame(() => {
        vvRaf.current = 0;
        if (!mq.matches) {
          clearOffset();
          return;
        }
        if (!vv) {
          clearOffset();
          return;
        }
        const raw = Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height));
        const gap = Math.min(raw, MAX_VV_BOTTOM_GAP_PX);
        root.style.setProperty("--qs-vv-bottom-offset", `${gap}px`);
      });
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });

    return () => {
      if (vvRaf.current) cancelAnimationFrame(vvRaf.current);
      vvRaf.current = 0;
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      clearOffset();
    };
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

  /** „Moje zlecenia” — działa dla klienta i wykonawcy (GET /api/orders/my). */
  const ordersPath = "/my-orders";

  if (!visible) return null;

  const inactive = { color: "var(--muted-foreground)" };
  const activeStyle = { color: "var(--primary)" };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[45] border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)] [transform:translateZ(0)]"
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
          <span className="truncate w-full text-center">Zlecenia</span>
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
