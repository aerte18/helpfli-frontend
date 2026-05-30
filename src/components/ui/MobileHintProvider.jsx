import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useBreakpointMd } from "../../hooks/useBreakpointMd";

const MobileHintCtx = createContext(null);

/**
 * Na mobile (< md): krótki snackbar u dołu po tapnięciu ikony bez etykiety.
 * Na desktop: bez snackbara (hover title wystarczy).
 */
export function MobileHintProvider({ children }) {
  const isMdUp = useBreakpointMd();
  const [hint, setHint] = useState(null);
  const timerRef = useRef(null);

  const showHint = useCallback(
    (label, description = "") => {
      if (isMdUp || !label) return;
      clearTimeout(timerRef.current);
      setHint({ label, description });
      timerRef.current = setTimeout(() => setHint(null), 2600);
    },
    [isMdUp]
  );

  const value = useMemo(() => ({ showHint, isMdUp }), [showHint, isMdUp]);

  return (
    <MobileHintCtx.Provider value={value}>
      {children}
      {hint && !isMdUp && (
        <div
          role="status"
          aria-live="polite"
          className="fixed z-[9998] left-1/2 -translate-x-1/2 pointer-events-none animate-in fade-in duration-200"
          style={{
            bottom: "calc(4.25rem + env(safe-area-inset-bottom, 0px) + var(--qs-vv-bottom-offset, 0px))",
            maxWidth: "min(20rem, calc(100vw - 1.5rem))",
          }}
        >
          <div className="rounded-xl bg-slate-900/95 text-white px-4 py-2.5 shadow-xl ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-sm font-semibold leading-snug">{hint.label}</p>
            {hint.description ? (
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{hint.description}</p>
            ) : null}
          </div>
        </div>
      )}
    </MobileHintCtx.Provider>
  );
}

export function useMobileHint() {
  return useContext(MobileHintCtx);
}

/**
 * Opakowuje przycisk / badge — na mobile tap pokazuje podpowiedź.
 * hintOnly: tylko podpowiedź, bez onClick (liczniki).
 */
export function MobileTapHint({
  label,
  description = "",
  hintOnly = false,
  as: Component = "button",
  onClick,
  children,
  className = "",
  ...rest
}) {
  const ctx = useMobileHint();
  const showHint = ctx?.showHint;

  const handleClick = (e) => {
    showHint?.(label, description);
    if (!hintOnly) onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (hintOnly && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      showHint?.(label, description);
    }
  };

  const common = {
    className,
    title: label,
    "aria-label": label,
    onClick: handleClick,
    ...(hintOnly
      ? {
          role: "button",
          tabIndex: 0,
          onKeyDown: handleKeyDown,
        }
      : {}),
    ...rest,
  };

  return <Component {...common}>{children}</Component>;
}
