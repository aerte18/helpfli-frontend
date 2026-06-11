import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Logika "AI Concierge" w stylu Meta AI / Messenger.
 *
 * Każdy hint to para { text, prompt }:
 * - text   → krótki tekst w białym dymku ("Znaleźć najlepszego wykonawcę?"),
 * - prompt → gotowe pytanie wysyłane/wstawiane do czatu po kliknięciu (follow-up),
 *   dzięki czemu rozmowa zaczyna się od razu w temacie podpowiedzi.
 *
 * Triggery hintów (nigdy częściej niż co MIN_HINT_GAP_MS):
 * - 5 s po wejściu (raz na załadowanie strony — jak badge Meta AI),
 * - zmiana strony (sekcji),
 * - przewinięcie ponad 50% strony (raz na stronę),
 * - 30 s bezczynności,
 * - proaktywnie (klient): porównywanie wykonawców (≥3 profile + 60 s sesji).
 */

const SS_KEYS = {
  lastHintText: "qs_ai_nudge_last_text",
  proactiveDone: "qs_ai_nudge_proactive_done",
  suggestionDot: "qs_ai_nudge_dot",
  profiles: "qs_ai_nudge_profiles",
  sessionStart: "qs_ai_nudge_session_start",
};

const ENTRY_HINT_DELAY_MS = 5000;
const ROUTE_HINT_DELAY_MS = 2000;
const IDLE_HINT_DELAY_MS = 30000;
const HINT_VISIBLE_MS = 4000;
const MIN_HINT_GAP_MS = 10000;
const MAX_HINTS_PER_PAGELOAD = 10;
const PROACTIVE_MIN_SESSION_MS = 60000;
const PROACTIVE_MIN_PROFILES = 3;

export const PROACTIVE_HINT = {
  text: "Porównujesz wykonawców? Wybiorę najlepszych.",
  prompt: "Porównuję kilku wykonawców. Pomóż mi wybrać najlepszego do mojego problemu.",
};

const HINT_ROTATION = {
  client: [
    { text: "Pomóc Ci?", prompt: "W czym możesz mi pomóc? Pokaż, co potrafisz." },
    { text: "Znaleźć najlepszego wykonawcę?", prompt: "Pomóż mi znaleźć najlepszego wykonawcę w mojej okolicy." },
    { text: "Opisz problem", prompt: "Pomóż mi opisać mój problem i dobrać odpowiednią usługę." },
    { text: "Mam awarię", prompt: "Mam awarię w domu. Pomóż ocenić, co się dzieje i co mogę zrobić." },
    { text: "Ile to kosztuje?", prompt: "Pomóż mi oszacować, ile może kosztować usługa, której potrzebuję." },
    { text: "Zapytaj AI", prompt: "" },
  ],
  provider: [
    { text: "Pomóc Ci?", prompt: "W czym możesz mi pomóc jako wykonawcy?" },
    { text: "Znaleźć najlepsze zlecenia?", prompt: "Pokaż najlepsze zlecenia dla mnie i posortuj je według szansy wygranej." },
    { text: "Pomogę wycenić ofertę", prompt: "Pomóż mi wycenić ofertę: uwzględnij zakres, dojazd, materiały i konkurencję." },
    { text: "Jak zdobyć więcej zleceń?", prompt: "Co mogę zrobić, żeby wygrywać więcej zleceń na Helpfli?" },
    { text: "Zapytaj AI", prompt: "" },
  ],
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

// Stan per załadowanie strony (reset przy pełnym przeładowaniu).
let pageLoadState = {
  engaged: false,
  entryDone: false,
  hintCount: 0,
  lastHintAt: 0,
};

/** Kontekstowy hint dla klienta; null = użyj rotacji losowej. */
function clientTeaserHint(pathname, search) {
  const haystack = `${pathname} ${search}`.toLowerCase();

  // Kategoria usługi ma najwyższy priorytet (z URL-a lub parametrów wyszukiwania).
  if (/hydraul/.test(haystack)) {
    return { text: "Masz problem z hydrauliką?", prompt: "Mam problem z hydrauliką. Pomóż ocenić, co się dzieje, i znaleźć najlepszego hydraulika w okolicy." };
  }
  if (/elektry/.test(haystack)) {
    return { text: "Potrzebujesz elektryka?", prompt: "Szukam dobrego elektryka. Pomóż mi opisać problem i wybrać najlepszego w okolicy." };
  }
  if (/agd|rtv|pralk|lodowk|lodówk|zmywark|piekarnik/.test(haystack)) {
    return { text: "Spróbujemy naprawić problem?", prompt: "Mam problem ze sprzętem AGD. Spróbujmy najpierw zdiagnozować usterkę, a jeśli się nie uda — znajdź fachowca." };
  }
  if (/sprzat|sprząt/.test(haystack)) {
    return { text: "Szukasz pomocy w sprzątaniu?", prompt: "Szukam pomocy w sprzątaniu. Pomóż dobrać zakres usługi i znaleźć sprawdzoną osobę w okolicy." };
  }
  if (/remont|malowan|glazur|tynk/.test(haystack)) {
    return { text: "Planujesz remont?", prompt: "Planuję remont. Pomóż mi opisać zakres prac, oszacować koszt i znaleźć dobrą ekipę." };
  }

  // Co klient właśnie robi.
  if (/^\/provider\/[^/]+$/.test(pathname)) {
    return { text: "Porównać z innymi wykonawcami?", prompt: "Oglądam profil wykonawcy. Pomóż mi porównać go z innymi i ocenić, czy to dobry wybór." };
  }
  if (pathname.startsWith("/providers") || pathname.startsWith("/nearby-providers")) {
    const params = new URLSearchParams(search);
    const query = params.get("service") || params.get("q") || "";
    return query
      ? { text: "Pomogę wybrać najlepszego", prompt: "Przeglądam wykonawców. Pomóż mi wybrać najlepszego: porównaj opinie, ceny i dostępność." }
      : { text: "Znaleźć najlepszego wykonawcę?", prompt: "Pomóż mi znaleźć najlepszego wykonawcę w mojej okolicy." };
  }
  if (pathname.startsWith("/my-orders") || pathname.startsWith("/orders/my")) {
    return { text: "Sprawdzić status zleceń?", prompt: "Pokaż moje zlecenia i podpowiedz, czy coś wymaga mojej reakcji." };
  }
  if (/^\/orders\/[^/]+/.test(pathname)) {
    return { text: "Pytanie do tego zlecenia?", prompt: "Mam pytanie dotyczące mojego zlecenia. Pomóż mi je ogarnąć." };
  }
  if (pathname.startsWith("/create-order")) {
    return { text: "Przygotuję opis zlecenia", prompt: "Pomóż mi opisać problem, zadaj najważniejsze pytania i przygotuj zlecenie dla wykonawcy." };
  }
  if (pathname.startsWith("/cennik")) {
    return { text: "Oszacować koszt usługi?", prompt: "Pomóż mi oszacować, ile może kosztować usługa, której potrzebuję." };
  }
  if (pathname.startsWith("/poradnik")) {
    return { text: "Pytanie do tego poradnika?", prompt: "Czytam poradnik na Helpfli. Mam pytanie dotyczące tego tematu." };
  }
  if (pathname.startsWith("/concierge")) {
    return { text: "Opisz problem", prompt: "" };
  }
  if (pathname.startsWith("/services") || pathname.startsWith("/service/")) {
    return { text: "Opisz problem", prompt: "Pomóż mi opisać mój problem i dobrać odpowiednią usługę." };
  }
  if (pathname === "/" || pathname.startsWith("/home")) {
    return { text: "Pomóc Ci?", prompt: "W czym możesz mi pomóc? Pokaż, co potrafisz." };
  }

  return null;
}

/** Kontekstowy hint dla wykonawcy; null = użyj rotacji losowej. */
function providerTeaserHint(pathname) {
  if (pathname.startsWith("/provider-home") || pathname.startsWith("/available-orders")) {
    return { text: "Znaleźć najlepsze zlecenia?", prompt: "Pokaż najlepsze zlecenia dla mnie i posortuj je według szansy wygranej." };
  }
  if (pathname.startsWith("/provider/quotes")) {
    return { text: "Pomogę wycenić ofertę", prompt: "Pomóż mi wycenić ofertę: uwzględnij zakres, dojazd, materiały i konkurencję." };
  }
  if (/^\/orders\/[^/]+/.test(pathname)) {
    return { text: "Pomóc przygotować ofertę?", prompt: "Pomóż mi przygotować dobrą ofertę do tego zlecenia: cena, zakres i pierwsza wiadomość do klienta." };
  }
  if (pathname.startsWith("/messages") || pathname.startsWith("/inbox")) {
    return { text: "Napiszę odpowiedź do klienta", prompt: "Napisz profesjonalną odpowiedź do klienta z pytaniami o zakres, termin i budżet." };
  }
  if (pathname.startsWith("/manage-services")) {
    return { text: "Podpowiem, jak ulepszyć profil", prompt: "Co mogę poprawić w moim profilu i usługach, żeby dostawać więcej zleceń?" };
  }
  if (pathname.startsWith("/account/subscriptions") || pathname.startsWith("/why-pro")) {
    return { text: "Pytanie o pakiety?", prompt: "Wyjaśnij różnice między pakietami Helpfli i podpowiedz, który najbardziej mi się opłaca." };
  }
  return null;
}

/** Kontekstowy hint; null = użyj rotacji losowej. */
export function contextTeaserHint(pathname = "", search = "", role = "client") {
  return role === "provider"
    ? providerTeaserHint(pathname)
    : clientTeaserHint(pathname, search);
}

function pickHint(pathname, search, role) {
  const contextual = contextTeaserHint(pathname, search, role);
  if (contextual) return contextual;
  const last = ssGet(SS_KEYS.lastHintText, "");
  const rotation = HINT_ROTATION[role] || HINT_ROTATION.client;
  const pool = rotation.filter((h) => h.text !== last);
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

export default function useAiConciergeNudge({ enabled = true, role = "client" } = {}) {
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

  const showHint = useCallback((kind, hint) => {
    setTeaser({ kind, text: hint.text, prompt: hint.prompt || "" });
    ssSet(SS_KEYS.lastHintText, hint.text);
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
      showHint(kind, pickHint(location.pathname, location.search, role));
    },
    [canHint, showHint, location.pathname, location.search, role]
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

  // Śledzenie odwiedzonych profili wykonawców (trigger proaktywny — tylko klient).
  useEffect(() => {
    if (role !== "client") return;
    const match = location.pathname.match(/^\/provider\/([^/]+)$/);
    const id = match?.[1];
    if (!id || ["sponsored", "quotes"].includes(id)) return;
    const viewed = readViewedProfiles();
    if (!viewed.includes(id)) {
      ssSet(SS_KEYS.profiles, JSON.stringify([...viewed, id].slice(-20)));
    }
  }, [location.pathname, role]);

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

    // Proactive: porównywanie wykonawców (tylko klient, raz na sesję).
    if (
      role === "client" &&
      ssGet(SS_KEYS.proactiveDone) !== "1" &&
      readViewedProfiles().length >= PROACTIVE_MIN_PROFILES
    ) {
      const elapsed = Date.now() - sessionStartRef.current;
      const wait = Math.max(2000, PROACTIVE_MIN_SESSION_MS - elapsed);
      proactiveTimer.current = setTimeout(() => {
        if (!enabledRef.current || pageLoadState.engaged) return;
        ssSet(SS_KEYS.proactiveDone, "1");
        showHint("proactive", PROACTIVE_HINT);
      }, wait);
    }

    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      [routeTimer, idleTimer, proactiveTimer].forEach(clearTimer);
    };
  }, [location.pathname, location.search, tryContextHint, showHint, role]);

  useEffect(() => () => clearTimer(hideTimer), []);

  return { teaser, suggestionDot, dismissTeaser, markEngaged };
}
