import { useEffect } from "react";

/**
 * Blokuje przewijanie tła (np. szuflada filtrów).
 * Na desktopie: tylko overflow:hidden na html/body (kółko myszy wraca po zamknięciu).
 * Na mobile / touch: position:fixed + top (mniej „gumy” tła na iOS).
 */
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;

    const useFixedBody =
      typeof window !== "undefined" &&
      window.matchMedia &&
      (window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(max-width: 767.98px)").matches);

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
    };

    if (useFixedBody) {
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
    } else {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    }

    return () => {
      if (useFixedBody) {
        body.style.overflow = prev.bodyOverflow;
        body.style.position = prev.bodyPosition;
        body.style.top = prev.bodyTop;
        body.style.width = prev.bodyWidth;
      } else {
        html.style.overflow = prev.htmlOverflow;
        body.style.overflow = prev.bodyOverflow;
      }
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
