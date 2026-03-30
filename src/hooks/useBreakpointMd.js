import { useState, useEffect } from "react";

/** true gdy viewport ≥ 768px (Tailwind md) */
export function useBreakpointMd() {
  const [match, setMatch] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const fn = () => setMatch(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return match;
}
