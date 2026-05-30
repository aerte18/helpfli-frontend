import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useBreakpointMd } from "../../hooks/useBreakpointMd";

/**
 * Minimalistyczny launcher Asystenta AI — stała pozycja, bez przesuwania.
 * variant: client (indigo) | provider (violet)
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
  const [isHovered, setIsHovered] = useState(false);

  if (hidden) return null;

  const toneClass =
    variant === "provider"
      ? "bg-violet-600 text-white ring-1 ring-violet-500/25 hover:bg-violet-700"
      : "bg-indigo-600 text-white ring-1 ring-indigo-500/25 hover:bg-indigo-700";

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-label={label}
      title={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`qs-ai-fab qs-tap-target fixed z-[50] relative flex items-center justify-center gap-2 rounded-full shadow-lg transition-[transform,background-color,box-shadow,width] duration-200 active:scale-95 md:bottom-6 md:right-6 ${toneClass} ${className} ${
        isMdUp && isHovered ? "md:h-14 md:w-auto md:px-4" : "h-11 w-11"
      }`}
    >
      <span className="sr-only">{label}</span>
      {badge}
      <Sparkles className="h-5 w-5 shrink-0 text-white/95" aria-hidden />
      {isMdUp && isHovered ? (
        <span className="hidden md:inline text-sm font-semibold whitespace-nowrap">{label}</span>
      ) : null}
    </button>
  );
}
