import { useEffect, useRef, useState } from "react";
import { useBreakpointMd } from "../../hooks/useBreakpointMd";

/**
 * Gwiazdki AI w stylu Meta AI / Gemini — duża czteroramienna + mała u góry.
 * Rysowane krzywymi, dzięki czemu wyglądają miękko i premium.
 */
export function AiSparkleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M10 6c.7 4.8 2.4 6.5 7.2 7.2-4.8.7-6.5 2.4-7.2 7.2-.7-4.8-2.4-6.5-7.2-7.2 4.8-.7 6.5-2.4 7.2-7.2z" />
      <path d="M18.3 2c.36 2.45 1.25 3.34 3.7 3.7-2.45.36-3.34 1.25-3.7 3.7-.36-2.45-1.25-3.34-3.7-3.7 2.45-.36 3.34-1.25 3.7-3.7z" />
    </svg>
  );
}

/**
 * Launcher Asystenta AI — stany jak Meta AI w Messengerze:
 * - Idle:   okrągła ikonka ✨ (56 px) na gradiencie — nigdy się nie rozciąga,
 * - Hint:   osobny biały dymek "✨ Pomóc Ci?" nad ikoną (slide-in z prawej),
 * - Alert:  fioletowa kropka + mocniejsza poświata kółka, gdy AI ma sugestię,
 * - Puls:   podwójny, miękki pierścień raz po wejściu na stronę.
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
    // Jeden podwójny puls po wejściu — potem już się nie powtarza.
    const pulseOn = setTimeout(() => setHelloPulse(true), 1200);
    const pulseOff = setTimeout(() => setHelloPulse(false), 3400);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(pulseOn);
      clearTimeout(pulseOff);
    };
  }, []);

  if (hidden) return null;

  const toneClass = variant === "provider" ? "qs-ai-fab--provider" : "qs-ai-fab--client";
  const alert = dot && !shownText;

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
      } ${helloPulse && !shownText ? "qs-ai-fab--hello" : ""} ${
        alert ? "qs-ai-fab--alert" : ""
      } ${className}`}
    >
      {badge}
      {alert ? (
        <span
          className="qs-ai-dot absolute right-0.5 top-0.5 z-20 h-3.5 w-3.5 rounded-full bg-violet-500 ring-[2.5px] ring-white"
          aria-hidden
        />
      ) : null}
      <AiSparkleIcon className="h-7 w-7" />
      {shownText ? (
        <span className={`qs-ai-hint ${leaving ? "qs-ai-hint--out" : ""}`} aria-hidden={leaving}>
          <AiSparkleIcon className="h-4 w-4 shrink-0 text-violet-600" />
          {shownText}
        </span>
      ) : null}
    </button>
  );
}
