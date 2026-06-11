import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { loginUrlWithNext } from "../utils/authRedirect";

const MAX_VV_BOTTOM_GAP_PX = 120;

const HIDDEN_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/admin",
  "/onboarding",
  "/checkout",
  "/payment-result",
];

export default function GuestMobileStickyCta() {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  const visible = useMemo(() => {
    if (loading || user) return false;
    if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return false;
    if (pathname.startsWith("/orders/")) return false;
    return true;
  }, [loading, user, pathname]);

  const returnPath = `${pathname}${search}`;
  const loginHref = loginUrlWithNext(pathname, search);
  const registerHref =
    returnPath && returnPath !== "/"
      ? `/register?next=${encodeURIComponent(returnPath)}`
      : "/register";

  // Gość ma od razu zobaczyć wartość (mapa, wykonawcy, AI) — bez ściany logowania.
  // Na stronach wyszukiwania proponujemy AI (goście mają darmowe zapytania),
  // wszędzie indziej — przejście do wyszukiwarki z mapą.
  const onSearchPage = ["/home", "/providers", "/nearby-providers", "/services"].some(
    (p) => pathname === p || pathname.startsWith(`${p}?`)
  );
  const exploreHref = onSearchPage ? "/concierge" : "/home";
  const exploreLabel = onSearchPage
    ? "Opisz problem z AI — bez logowania"
    : "Znajdź pomoc od razu — bez logowania";
  const ExploreIcon = onSearchPage ? Sparkles : MapPin;

  useEffect(() => {
    if (visible) {
      document.body.classList.add("has-guest-mobile-cta");
    } else {
      document.body.classList.remove("has-guest-mobile-cta");
    }
    return () => document.body.classList.remove("has-guest-mobile-cta");
  }, [visible]);

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
        const gap = raw < 2 ? 0 : Math.min(raw, MAX_VV_BOTTOM_GAP_PX);
        root.style.setProperty("--qs-vv-bottom-offset", `${gap}px`);
      });
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("orientationchange", sync);

    return () => {
      if (vvRaf.current) cancelAnimationFrame(vvRaf.current);
      vvRaf.current = 0;
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("orientationchange", sync);
      clearOffset();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <nav
      data-qs-guest-mobile-cta
      className="md:hidden fixed bottom-0 left-0 right-0 z-[44] border-t shadow-[0_-4px_16px_rgba(0,0,0,0.08)] qs-fixed-bottom-visual"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
      role="region"
      aria-label="Szybkie logowanie"
    >
      <div className="flex max-w-lg mx-auto gap-2 px-3 pt-2">
        <Link
          to={loginHref}
          className="flex-1 min-w-0 py-2.5 px-3 rounded-xl text-center text-sm font-semibold border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          Zaloguj się
        </Link>
        <Link
          to={registerHref}
          className="flex-1 min-w-0 py-2.5 px-3 rounded-xl text-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Załóż konto
        </Link>
      </div>
      <div className="px-3 pb-1 max-w-lg mx-auto">
        <Link
          to={exploreHref}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium rounded-lg transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ExploreIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {exploreLabel}
        </Link>
      </div>
    </nav>
  );
}
