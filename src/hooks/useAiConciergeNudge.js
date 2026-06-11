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
 * - 5 s po wejściu (raz na załadowanie strony — jak badge Meta AI),
 * - zmiana strony (sekcji),
 * - przewinięcie ponad 50% strony (raz na stronę),
 * - 30 s bezczynności,
 * - proaktywnie: użytkownik porównuje wykonawców (≥3 profile + 60 s sesji).
 *
 * Per sesja (sessionStorage): trigger proaktywny, lista obejrzanych profili
 * i kropka-notyfikacja.
 * Per załadowanie strony (zmienne modułu): hint powitalny, licznik/odstępy
 * hintów i cisza po otwarciu asystenta — po odświeżeniu launcher znowu "żyje".
 */

const SS_KEYS = {
  lastHintText: "qs_ai_nudge_last_text",
  proactiveDone: "qs_ai_nudge_proactive_done",
  suggestionDot: "qs_ai_nudge_dot",
  profiles: "qs_ai_nudge_profiles",
  sessionStart: "qs_ai_nudge_session_start",
};

const ENTRY_HINT_DELAY_MS = 5000;
const ROUTE_HINT_DELAY_MS = 2500;
const IDLE_HINT_DELAY_MS = 30000;
const HINT_VISIBLE_MS = 4000;
const MIN_HINT_GAP_MS = 15000;
const MAX_HINTS_PER_PAGELOAD = 8;
const PROACTIVE_MIN_SESSION_MS = 60000;
const PROACTIVE_MIN_PROFILES = 3;

const HINT_ROTATION = [
  "Pomóc Ci?",
  "Znajdź wykonawcę",
  "Opisz problem",
  "Mam awarię",
  "Zapytaj AI",
];

// Stan per załadowanie strony (reset przy pełnym przeładowaniu).
let pageLoadState = {
  engaged: false,
  entryDone: false,
  hintCount: 0,
  lastHintAt: 0,
};

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
  if (pathname.startsWith("/services") || pathname.startsWith("/service/")) return "Opisz problem";
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
    if (pageLoadState.engaged) return false;
    if (pageLoadState.hintCount >= MAX_HINTS_PER_PAGELOAD) return false;
    if (Date.now() - pageLoadState.lastHintAt < MIN_HINT_GAP_MS) return false;
    // Użytkownik wypełnia formularz — nie przeszkadzamy.
    const ae = document.activeElement;
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) {
      return false;
    }
    return true;
  }, []);

  const showHint = useCallback((kind, text) => {
    setTeaser({ kind, text });
    ssSet(SS_KEYS.lastHintText, text);
    pageLoadState.hintCount += 1;
    pageLoadState.lastHintAt = Date.now();
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

  /** Użytkownik otworzył asystenta — cisza do następnego przeładowania, kropka znika. */
  const markEngaged = useCallback(() => {
    pageLoadState.engaged = true;
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

  // Hint powitalny — 5 s po załadowaniu strony.
  useEffect(() => {
    if (pageLoadState.entryDone) return undefined;
    entryTimer.current = setTimeout(() => {
      pageLoadState.entryDone = true;
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

    const scrollProgress = (target) => {
      // Okno lub wewnętrzny scrollowany kontener (częste na mobile).
      if (target === document || target === document.documentElement || target === window) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 200 ? window.scrollY / max : 0;
      }
      if (target instanceof Element) {
        const max = target.scrollHeight - target.clientHeight;
        return max > 200 ? target.scrollTop / max : 0;
      }
      return 0;
    };

    const onScroll = (event) => {
      armIdleTimer();
      if (scrollHintDone) return;
      if (scrollProgress(event.target) >= 0.5) {
        scrollHintDone = true;
        tryContextHint("scroll");
      }
    };

    // capture: łapie też scroll wewnątrz kontenerów, nie tylko okna.
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
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
        if (!enabledRef.current || pageLoadState.engaged) return;
        ssSet(SS_KEYS.proactiveDone, "1");
        showHint("proactive", "Porównujesz wykonawców? Wybiorę najlepszych.");
      }, wait);
    }

    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      [routeTimer, idleTimer, proactiveTimer].forEach(clearTimer);
    };
  }, [location.pathname, location.search, tryContextHint, showHint]);

  useEffect(() => () => clearTimer(hideTimer), []);

  return { teaser, suggestionDot, dismissTeaser, markEngaged };
}
