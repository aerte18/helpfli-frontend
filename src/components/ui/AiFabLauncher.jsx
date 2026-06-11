import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useBreakpointMd } from "../../hooks/useBreakpointMd";

/**
 * Launcher Asystenta AI — 3 stany jak Meta AI w Messengerze:
 * - Idle:  sama okrągła ikonka ✨ na gradiencie,
 * - Hint:  badge "✨ Pomóc Ci?" wysuwa się i sam zwija (sterowane prop `teaser`),
 * - Dot:   mała kropka-notyfikacja, gdy AI ma sugestię (prop `dot`).
 *
 * Klik zawsze natychmiast otwiera asystenta. Desktop: hover rozwija badge.
 */
export default function AiFabLauncher({
  testId = "ai-fab",
  onClick,
  hidden = false,
  badge = null,
  dot = false,
  variant = "client",
  label = "Zapytaj AI",
  teaser = null,
  className = "",
}) {
  const isMdUp = useBreakpointMd();
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Tekst zostaje w DOM podczas zwijania, żeby animacja wyjścia była płynna.
  const lastTextRef = useRef(label);
  const teaserText = teaser?.text || null;
  const hoverText = isMdUp && isHovered ? label : null;
  const activeText = teaserText || hoverText;
  if (activeText) lastTextRef.current = activeText;
  const expanded = Boolean(activeText);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (hidden) return null;

  const toneClass = variant === "provider" ? "qs-ai-fab--provider" : "qs-ai-fab--client";

  return (
    <button
      type="button"
      onClick={() => onClick?.()}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      data-testid={testId}
      aria-label={teaserText || label}
      title={label}
      className={`qs-ai-fab qs-tap-target fixed z-[55] flex items-center overflow-visible rounded-full text-white md:bottom-6 md:right-6 ${toneClass} ${
        mounted ? "qs-ai-fab--in" : ""
      } ${expanded ? "qs-ai-fab--expanded" : ""} ${teaser ? "qs-ai-fab--teasing" : ""} ${className}`}
    >
      {badge}
      {dot && !expanded ? (
        <span
          className="absolute right-0.5 top-0.5 z-20 h-2.5 w-2.5 rounded-full bg-sky-400 ring-2 ring-white"
          aria-hidden
        />
      ) : null}
      <span className="qs-ai-fab__icon" aria-hidden>
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="qs-ai-fab__label" aria-hidden={!expanded}>
        {lastTextRef.current}
      </span>
    </button>
  );
}
