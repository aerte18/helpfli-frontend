import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useBreakpointMd } from "../../hooks/useBreakpointMd";

/**
 * Launcher Asystenta AI.
 * Mobile + mapa: wysuwany „tab” z prawej krawędzi (nie zasłania stosu przycisków).
 * Desktop / zwykłe strony: klasyczne okrągłe FAB.
 */
export default function AiFabLauncher({
  testId = "ai-fab",
  onClick,
  hidden = false,
  badge = null,
  variant = "client",
  label = "Asystent AI",
  className = "",
}) {
  const isMdUp = useBreakpointMd();
  const [edgeDock, setEdgeDock] = useState(false);
  const [guestCtaBar, setGuestCtaBar] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const activeEdgeDock = edgeDock || guestCtaBar;

  useEffect(() => {
    if (isMdUp) {
      setEdgeDock(false);
      setGuestCtaBar(false);
      setExpanded(false);
      return undefined;
    }

    const detectDockContext = () => {
      const onGuestBar = document.body.classList.contains("has-guest-mobile-cta");
      // Mobile: launcher działa jako chowany tab na wszystkich ekranach.
      setEdgeDock(true);
      setGuestCtaBar(onGuestBar);
      if (!onGuestBar) setExpanded(false);
    };

    detectDockContext();
    const observer = new MutationObserver(detectDockContext);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", detectDockContext);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", detectDockContext);
    };
  }, [isMdUp]);

  const scheduleCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), 3200);
  }, []);

  const expandDock = useCallback(() => {
    if (!activeEdgeDock) return;
    setExpanded(true);
    scheduleCollapse();
  }, [activeEdgeDock, scheduleCollapse]);

  useEffect(() => {
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!activeEdgeDock || isMdUp || !badge) return;
    setExpanded(true);
    scheduleCollapse();
  }, [badge, activeEdgeDock, isMdUp, scheduleCollapse]);

  const handleClick = () => {
    expandDock();
    onClick?.();
  };

  if (hidden) return null;

  const toneClass =
    variant === "provider"
      ? "bg-violet-600 text-white ring-1 ring-violet-500/30 hover:bg-violet-700"
      : "bg-indigo-600 text-white ring-1 ring-indigo-500/30 hover:bg-indigo-700";

  const edgeClass =
    activeEdgeDock && !isMdUp
      ? `qs-ai-fab-edge rounded-l-full rounded-r-none pr-2 pl-2.5 ${expanded ? "qs-ai-fab-edge--expanded" : ""}`
      : "right-3 rounded-full";

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerEnter={() => {
        setIsHovered(true);
        expandDock();
      }}
      onPointerLeave={() => setIsHovered(false)}
      onFocus={() => expandDock()}
      data-testid={testId}
      aria-label={label}
      title={label}
      className={`qs-ai-fab qs-tap-target fixed z-[55] flex items-center justify-center gap-2 shadow-lg transition-[transform,background-color,box-shadow,width,padding] duration-300 ease-out active:scale-[0.98] md:bottom-6 md:right-6 md:rounded-full ${toneClass} ${edgeClass} ${className} ${
        isMdUp && isHovered ? "md:h-14 md:w-auto md:px-4" : activeEdgeDock && !isMdUp ? "h-11 min-w-[2.75rem]" : "h-11 w-11"
      }`}
    >
      <span className="sr-only">{label}</span>
      {badge}
      <Sparkles className="h-5 w-5 shrink-0 text-white/95" aria-hidden />
      {activeEdgeDock && !isMdUp && expanded ? (
        <span className="max-w-[5.5rem] truncate text-[11px] font-semibold pr-0.5">{label}</span>
      ) : null}
      {isMdUp && isHovered ? (
        <span className="hidden md:inline text-sm font-semibold whitespace-nowrap">{label}</span>
      ) : null}
    </button>
  );
}
