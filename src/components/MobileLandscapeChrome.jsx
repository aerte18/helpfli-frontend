import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useLocation } from "react-router-dom";

const COMPACT_ROUTE = /^\/(home|provider-home|my-orders)(\/|$)/;
const LANDSCAPE_MQ = "(max-width: 1023px) and (orientation: landscape)";

/**
 * Mobile/tablet w poziomie: chowa tab bar, żeby mapa/lista miały więcej miejsca.
 * Pigułka „Menu” na dole tymczasowo przywraca nawigację (jak w mapach mobilnych).
 */
export default function MobileLandscapeChrome() {
  const { pathname } = useLocation();
  const [compact, setCompact] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const hideTimer = useRef(null);

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleHideNav = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setNavVisible(false), 4500);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(LANDSCAPE_MQ);

    const sync = () => {
      const immersive = document.body.classList.contains("qs-map-immersive");
      const onDiscovery = COMPACT_ROUTE.test(pathname);
      const active = mq.matches && onDiscovery && !immersive;
      setCompact(active);
      if (!active) {
        setNavVisible(false);
        clearHideTimer();
      }
      document.body.classList.toggle("qs-landscape-compact", active);
      document.body.classList.toggle(
        "qs-landscape-compact-nav-visible",
        active && navVisible
      );
    };

    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      observer.disconnect();
      clearHideTimer();
      document.body.classList.remove("qs-landscape-compact");
      document.body.classList.remove("qs-landscape-compact-nav-visible");
    };
  }, [pathname, navVisible]);

  useEffect(() => {
    if (!compact || !navVisible) return undefined;
    scheduleHideNav();
    return clearHideTimer;
  }, [compact, navVisible, scheduleHideNav]);

  const showNav = () => {
    setNavVisible(true);
    scheduleHideNav();
  };

  if (!compact || navVisible) return null;

  return (
    <button
      type="button"
      data-qs-landscape-nav-peek
      onClick={showNav}
      className="qs-landscape-nav-peek qs-tap-target md:hidden"
      aria-label="Pokaż menu nawigacji"
      title="Menu"
    >
      <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
      <span>Menu</span>
    </button>
  );
}
