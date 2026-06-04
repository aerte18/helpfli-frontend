import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Po przejściu na inną stronę (np. link ze stopki: Kontakt, O nas)
 * przewija widok na górę zamiast zostawiać pozycję scrolla z poprzedniej strony.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, "");
      const scrollToHash = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: "start", behavior: "auto" });
          return;
        }
        scrollWindowToTop();
      };
      requestAnimationFrame(() => requestAnimationFrame(scrollToHash));
      return;
    }

    const run = () => scrollWindowToTop();
    run();
    requestAnimationFrame(run);
  }, [pathname, hash]);

  return null;
}
