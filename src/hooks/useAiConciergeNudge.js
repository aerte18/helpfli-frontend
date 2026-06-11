import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Logika "AI Concierge" w stylu Meta AI / Messenger.
 *
 * Stany launchera:
 * - Idle:      sama ikonka ✨ (domyślnie, przez większość czasu),
 * - Hint:      badge "✨ Pomóc Ci?" wysuwa się na 4 s i sam się zwija,
 * - Dot:       mała kropka, gdy AI ma niedoczytaną sugestię (proactive).
 *
 * Triggery hintów (nigdy częściej niż co MIN_HINT_GAP_MS):
 * - 5 s po wejściu na stronę (raz na sesję),
 * - zmiana strony (sekcji),
 * - przewinięcie ponad 50% strony (raz na stronę),
 * - 30 s bezczynności,
 * - proaktywnie: użytkownik porównuje wykonawców (≥3 profile + 60 s sesji).
 */

const SS_KEYS = {
  engaged: "qs_ai_nudge_engaged",
  entryDone: "qs_ai_nudge_entry_done",
  hintCount: "qs_ai_nudge_hint_count",
  lastHintText: "qs_ai_nudge_last_text",
  proactiveDone: "qs_ai_nudge_proactive_done",
  suggestionDot: "qs_ai_nudge_dot",
  profiles: "qs_ai_nudge_profiles",
  sessionStart: "qs_ai_nudge_session_start",
};

const ENTRY_HINT_DELAY_MS = 5000;
const ROUTE_HINT_DELAY_MS = 3000;
const IDLE_HINT_DELAY_MS = 30000;
const HINT_VISIBLE_MS = 4000;
const MIN_HINT_GAP_MS = 25000;
const MAX_HINTS_PER_SESSION = 4;
const PROACTIVE_MIN_SESSION_MS = 60000;
const PROACTIVE_MIN_PROFILES = 3;

const HINT_ROTATION = [
  "Pomóc Ci?",
  "Znajdź wykonawcę",
  "Opisz problem",
  "Mam awarię",
  "Zapytaj AI",
];

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

/** Kontekstowy tekst hintu; null = użyj rotacji losowej. */
export function contextTeaserText(pathname = "", search = "") {
  const haystack = `${pathname} ${search}`.toLowerCase();

  // Kategoria usługi ma najwyższy priorytet.
  if (/hydraul/.test(haystack)) return "Masz problem z hydrauliką?";
  if (/elektry/.test(haystack)) return "Potrzebujesz elektryka?";
  if (/agd|rtv|pralk|lodowk|lodówk|zmywark|piekarnik/.test(haystack)) {
    return "Spróbujemy naprawić problem?";
  }
  if (/sprzat|sprząt/.test(haystack)) return "Szukasz pomocy w sprzątaniu?";
  if (/remont|malowan|glazur|tynk/.test(haystack)) return "Planujesz remont?";

  // Kontekst sekcji.
  if (pathname.startsWith("/providers") || pathname.startsWith("/nearby-providers")) {
    return "Znajdź wykonawcę";
  }
  if (pathname.startsWith("/create-order")) return "Przygotuję opis zlecenia";
  if (pathname.startsWith("/concierge")) return "Opisz problem";
  if (pathname === "/" || pathname.startsWith("/home")) return "Pomóc Ci?";

  return null;
}

function pickHintText(pathname, search) {
  const contextual = contextTeaserText(pathname, search);
  if (contextual) return contextual;
  const last = ssGet(SS_KEYS.lastHintText, "");
  const pool = HINT_ROTATION.filter((t) => t !== last);
  return pool[Math.floor(Math.random() * pool.length)];
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
  const [suggestionDot, setSuggestionDot] = useState(ssGet(SS_KEYS.suggestionDot) === "1");

  const hideTimer = useRef(null);
  const entryTimer = useRef(null);
  const routeTimer = useRef(null);
  const idleTimer = useRef(null);
  const proactiveTimer = useRef(null);
  const lastHintAtRef = useRef(0);
  const firstLocationRef = useRef(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Start sesji (do triggera proaktywnego).
  const sessionStartRef = useRef(0);
  if (!sessionStartRef.current) {
    const existing = Number(ssGet(SS_KEYS.sessionStart, 0));
    sessionStartRef.current = existing > 0 ? existing : Date.now();
    if (!existing) ssSet(SS_KEYS.sessionStart, sessionStartRef.current);
  }

  const clearTimer = (ref) => {
    if (ref.current) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  };

  const canHint = useCallback(() => {
    if (!enabledRef.current) return false;
    if (ssGet(SS_KEYS.engaged) === "1") return false;
    if (Number(ssGet(SS_KEYS.hintCount, 0)) >= MAX_HINTS_PER_SESSION) return false;
    if (Date.now() - lastHintAtRef.current < MIN_HINT_GAP_MS) return false;
    return true;
  }, []);

  const showHint = useCallback((kind, text) => {
    setTeaser({ kind, text });
    ssSet(SS_KEYS.lastHintText, text);
    ssSet(SS_KEYS.hintCount, Number(ssGet(SS_KEYS.hintCount, 0)) + 1);
    lastHintAtRef.current = Date.now();
    clearTimer(hideTimer);
    hideTimer.current = setTimeout(() => {
      setTeaser(null);
      // Niedoczytana sugestia proaktywna → kropka jak w Messengerze.
      if (kind === "proactive") {
        ssSet(SS_KEYS.suggestionDot, "1");
        setSuggestionDot(true);
      }
    }, HINT_VISIBLE_MS);
  }, []);

  const tryContextHint = useCallback(
    (kind) => {
      if (!canHint()) return;
      showHint(kind, pickHintText(location.pathname, location.search));
    },
    [canHint, showHint, location.pathname, location.search]
  );

  /** Użytkownik otworzył asystenta — koniec hintów w tej sesji, kropka znika. */
  const markEngaged = useCallback(() => {
    ssSet(SS_KEYS.engaged, "1");
    ssSet(SS_KEYS.suggestionDot, "0");
    setSuggestionDot(false);
    [hideTimer, entryTimer, routeTimer, idleTimer, proactiveTimer].forEach(clearTimer);
    setTeaser(null);
  }, []);

  const dismissTeaser = useCallback(() => {
    clearTimer(hideTimer);
    setTeaser(null);
  }, []);

  // Śledzenie odwiedzonych profili wykonawców (trigger proaktywny).
  useEffect(() => {
    const match = location.pathname.match(/^\/provider\/([^/]+)$/);
    const id = match?.[1];
    if (!id || ["sponsored", "quotes"].includes(id)) return;
    const viewed = readViewedProfiles();
    if (!viewed.includes(id)) {
      ssSet(SS_KEYS.profiles, JSON.stringify([...viewed, id].slice(-20)));
    }
  }, [location.pathname]);

  // Hint powitalny — raz na sesję, 5 s po wejściu.
  useEffect(() => {
    if (ssGet(SS_KEYS.entryDone) === "1") return undefined;
    entryTimer.current = setTimeout(() => {
      ssSet(SS_KEYS.entryDone, "1");
      tryContextHint("entry");
    }, ENTRY_HINT_DELAY_MS);
    return () => clearTimer(entryTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Triggery zależne od strony: zmiana sekcji, scroll 50%, bezczynność, proactive.
  useEffect(() => {
    let scrollHintDone = false;

    // Zmiana sekcji (pomijamy pierwsze renderowanie — obsługuje je hint powitalny).
    if (firstLocationRef.current) {
      firstLocationRef.current = false;
    } else {
      setTeaser(null);
      routeTimer.current = setTimeout(() => tryContextHint("route"), ROUTE_HINT_DELAY_MS);
    }

    const armIdleTimer = () => {
      clearTimer(idleTimer);
      idleTimer.current = setTimeout(() => tryContextHint("idle"), IDLE_HINT_DELAY_MS);
    };

    const onActivity = () => armIdleTimer();

    const onScroll = () => {
      armIdleTimer();
      if (scrollHintDone) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max > 200 && window.scrollY / max >= 0.5) {
        scrollHintDone = true;
        tryContextHint("scroll");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    armIdleTimer();

    // Proactive: porównywanie wykonawców (raz na sesję, priorytet nad limitem przerwy).
    if (
      ssGet(SS_KEYS.proactiveDone) !== "1" &&
      readViewedProfiles().length >= PROACTIVE_MIN_PROFILES
    ) {
      const elapsed = Date.now() - sessionStartRef.current;
      const wait = Math.max(2000, PROACTIVE_MIN_SESSION_MS - elapsed);
      proactiveTimer.current = setTimeout(() => {
        if (!enabledRef.current || ssGet(SS_KEYS.engaged) === "1") return;
        ssSet(SS_KEYS.proactiveDone, "1");
        showHint("proactive", "Porównujesz wykonawców? Wybiorę najlepszych.");
      }, wait);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      [routeTimer, idleTimer, proactiveTimer].forEach(clearTimer);
    };
  }, [location.pathname, location.search, tryContextHint, showHint]);

  useEffect(() => () => clearTimer(hideTimer), []);

  return { teaser, suggestionDot, dismissTeaser, markEngaged };
}
