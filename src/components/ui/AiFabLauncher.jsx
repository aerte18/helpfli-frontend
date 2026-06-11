import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useBreakpointMd } from "../../hooks/useBreakpointMd";

/**
 * Launcher Asystenta AI — stany jak Meta AI w Messengerze:
 * - Idle:  okrągła ikonka ✨ (56 px) na gradiencie — nigdy się nie rozciąga,
 * - Hint:  osobny biały dymek "✨ Pomóc Ci?" nad ikoną (slide-in z prawej,
 *          fade-out + slide przy znikaniu) — sterowane prop `teaser`,
 * - Dot:   fioletowa kropka-notyfikacja, gdy AI ma sugestię (prop `dot`),
 * - Puls:  jeden subtelny puls po wejściu na stronę, bez powtarzania.
 *
 * Klik zawsze natychmiast otwiera asystenta. Desktop: hover pokazuje dymek.
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
  const [helloPulse, setHelloPulse] = useState(false);

  const teaserText = teaser?.text || null;
  const hoverText = isMdUp && isHovered ? label : null;
  const activeText = teaserText || hoverText;

  // Dymek zostaje w DOM na czas animacji wyjścia (fade-out + slide).
  const [shownText, setShownText] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef(null);

  useEffect(() => {
    if (activeText) {
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current);
        leaveTimer.current = null;
      }
      setShownText(activeText);
      setLeaving(false);
    } else {
      setLeaving(true);
      leaveTimer.current = setTimeout(() => {
        setShownText(null);
        setLeaving(false);
      }, 220);
    }
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, [activeText]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    // Jeden subtelny puls po wejściu — potem już się nie powtarza.
    const pulseOn = setTimeout(() => setHelloPulse(true), 1200);
    const pulseOff = setTimeout(() => setHelloPulse(false), 3000);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(pulseOn);
      clearTimeout(pulseOff);
    };
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
      className={`qs-ai-fab qs-tap-target fixed z-[55] flex items-center justify-center overflow-visible rounded-full text-white md:bottom-6 md:right-6 ${toneClass} ${
        mounted ? "qs-ai-fab--in" : ""
      } ${helloPulse && !shownText ? "qs-ai-fab--hello" : ""} ${className}`}
    >
      {badge}
      {dot && !shownText ? (
        <span
          className="absolute right-1 top-1 z-20 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-white"
          aria-hidden
        />
      ) : null}
      <Sparkles className="h-6 w-6" aria-hidden />
      {shownText ? (
        <span className={`qs-ai-hint ${leaving ? "qs-ai-hint--out" : ""}`} aria-hidden={leaving}>
          <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
          {shownText}
        </span>
      ) : null}
    </button>
  );
}
