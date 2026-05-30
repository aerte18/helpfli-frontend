import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [edgeDock, setEdgeDock] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isMdUp) {
      setEdgeDock(false);
      setExpanded(false);
      return undefined;
    }

    const detectMapContext = () => {
      const onProviderHome = location.pathname === "/provider-home";
      const onClientHome = location.pathname === "/home";
      const onMapUi = Boolean(
        document.querySelector(".qs-provider-map-stack") ||
          document.querySelector(".qs-home-map-shell") ||
          document.querySelector("[data-qs-map-immersive-toggle]")
      );
      setEdgeDock(onProviderHome || onClientHome || onMapUi);
      if (!onProviderHome && !onClientHome && !onMapUi) setExpanded(false);
    };

    detectMapContext();
    const observer = new MutationObserver(detectMapContext);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", detectMapContext);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", detectMapContext);
    };
  }, [location.pathname, isMdUp]);

  useEffect(() => {
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  const scheduleCollapse = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), 3200);
  };

  const expandDock = () => {
    if (!edgeDock) return;
    setExpanded(true);
    scheduleCollapse();
  };

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
    edgeDock && !isMdUp
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
        isMdUp && isHovered ? "md:h-14 md:w-auto md:px-4" : edgeDock && !isMdUp ? "h-11 min-w-[2.75rem]" : "h-11 w-11"
      }`}
    >
      <span className="sr-only">{label}</span>
      {badge}
      <Sparkles className="h-5 w-5 shrink-0 text-white/95" aria-hidden />
      {edgeDock && !isMdUp && expanded ? (
        <span className="max-w-[5.5rem] truncate text-[11px] font-semibold pr-0.5">{label}</span>
      ) : null}
      {isMdUp && isHovered ? (
        <span className="hidden md:inline text-sm font-semibold whitespace-nowrap">{label}</span>
      ) : null}
    </button>
  );
}
