import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Logika "AI Concierge" dla launchera Asystenta AI:
 * - kontekstowy teaser zależny od przeglądanej kategorii,
 * - delikatna podpowiedź po chwili bezczynności na stronie,
 * - proaktywna podpowiedź, gdy użytkownik porównuje wykonawców.
 *
 * Teaser pokazuje się rzadko (limity per sesja) i znika sam — jak w Messengerze.
 */

const SS_KEYS = {
  engaged: "qs_ai_nudge_engaged",
  idleCount: "qs_ai_nudge_idle_count",
  proactiveDone: "qs_ai_nudge_proactive_done",
  profiles: "qs_ai_nudge_profiles",
  sessionStart: "qs_ai_nudge_session_start",
};

const IDLE_TEASER_DELAY_MS = 12000;
const TEASER_VISIBLE_MS = 5500;
const MAX_IDLE_TEASERS = 2;
const PROACTIVE_MIN_SESSION_MS = 60000;
const PROACTIVE_MIN_PROFILES = 3;

function ssGet(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function ssSet(key, value) {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    /* tryb prywatny — pomijamy */
  }
}

/** Kontekstowy tekst teasera na podstawie aktualnej trasy. */
export function contextTeaserText(pathname = "", search = "") {
  const haystack = `${pathname} ${search}`.toLowerCase();
  if (/hydraul/.test(haystack)) return "Masz problem z hydrauliką?";
  if (/elektry/.test(haystack)) return "Potrzebujesz elektryka?";
  if (/agd|rtv|pralk|lodowk|lodówk|zmywark|piekarnik/.test(haystack)) {
    return "Spróbujemy najpierw naprawić problem?";
  }
  if (/sprzat|sprząt/.test(haystack)) return "Szukasz pomocy w sprzątaniu?";
  if (/remont|malowan|glazur|tynk/.test(haystack)) return "Planujesz remont?";
  return "Pomóc Ci?";
}

function readViewedProfiles() {
  try {
    const parsed = JSON.parse(ssGet(SS_KEYS.profiles, "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function useAiConciergeNudge({ enabled = true } = {}) {
  const location = useLocation();
  const [teaser, setTeaser] = useState(null);
  const hideTimer = useRef(null);
  const idleTimer = useRef(null);
  const proactiveTimer = useRef(null);

  const sessionStart = useMemo(() => {
    const existing = Number(ssGet(SS_KEYS.sessionStart, 0));
    if (existing > 0) return existing;
    const now = Date.now();
    ssSet(SS_KEYS.sessionStart, now);
    return now;
  }, []);

  const clearTimers = useCallback(() => {
    [hideTimer, idleTimer, proactiveTimer].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, []);

  const dismissTeaser = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTeaser(null);
  }, []);

  const showTeaser = useCallback((next) => {
    setTeaser(next);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTeaser(null), TEASER_VISIBLE_MS);
  }, []);

  /** Użytkownik otworzył asystenta — koniec podpowiedzi w tej sesji. */
  const markEngaged = useCallback(() => {
    ssSet(SS_KEYS.engaged, "1");
    clearTimers();
    setTeaser(null);
  }, [clearTimers]);

  // Śledzenie odwiedzonych profili wykonawców (do podpowiedzi proaktywnej).
  useEffect(() => {
    const match = location.pathname.match(/^\/provider\/([^/]+)$/);
    const id = match?.[1];
    if (!id || ["sponsored", "quotes"].includes(id)) return;
    const viewed = readViewedProfiles();
    if (!viewed.includes(id)) {
      ssSet(SS_KEYS.profiles, JSON.stringify([...viewed, id].slice(-20)));
    }
  }, [location.pathname]);

  // Harmonogram teaserów dla bieżącej strony.
  useEffect(() => {
    clearTimers();
    setTeaser(null);
    if (!enabled || ssGet(SS_KEYS.engaged) === "1") return undefined;

    // Priorytet: proaktywna podpowiedź przy porównywaniu wykonawców.
    const proactiveDone = ssGet(SS_KEYS.proactiveDone) === "1";
    const profilesViewed = readViewedProfiles().length;
    if (!proactiveDone && profilesViewed >= PROACTIVE_MIN_PROFILES) {
      const elapsed = Date.now() - sessionStart;
      const wait = Math.max(1500, PROACTIVE_MIN_SESSION_MS - elapsed);
      proactiveTimer.current = setTimeout(() => {
        if (ssGet(SS_KEYS.engaged) === "1") return;
        ssSet(SS_KEYS.proactiveDone, "1");
        showTeaser({
          kind: "proactive",
          text: "Porównujesz wykonawców? Wybiorę najlepszych dla Ciebie.",
        });
      }, wait);
      return clearTimers;
    }

    // Teaser kontekstowy po chwili na stronie (limit na sesję).
    const idleCount = Number(ssGet(SS_KEYS.idleCount, 0));
    if (idleCount >= MAX_IDLE_TEASERS) return undefined;
    idleTimer.current = setTimeout(() => {
      if (ssGet(SS_KEYS.engaged) === "1") return;
      ssSet(SS_KEYS.idleCount, idleCount + 1);
      showTeaser({
        kind: "context",
        text: contextTeaserText(location.pathname, location.search),
      });
    }, IDLE_TEASER_DELAY_MS);

    return clearTimers;
  }, [enabled, location.pathname, location.search, sessionStart, showTeaser, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return { teaser, dismissTeaser, markEngaged };
}
