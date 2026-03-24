import { useEffect } from "react";

/**
 * Blokuje przewijanie strony (np. przy otwartej szufladzie).
 * Używa position:fixed + przywrócenie scrolla — lepsze na iOS niż sam overflow:hidden.
 */
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    const prevTouchAction = body.style.touchAction;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.touchAction = "none";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      body.style.touchAction = prevTouchAction;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
