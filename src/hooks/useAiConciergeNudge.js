import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Logika "AI Concierge" — hinty kontekstowe + follow-up do czatu.
 *
 * Każdy hint: { text, prompt } — text w dymku, prompt po kliknięciu.
 *
 * Triggery (per strona / nawigacja):
 * - ~1,5 s po wejściu na nową stronę (SPA i pierwsze załadowanie),
 * - przewinięcie 40% strony,
 * - 15 s bezczynności,
 * - proaktywnie (klient): ≥3 profile wykonawców + 45 s sesji.
 */

const SS_KEYS = {
  lastHintText: "qs_ai_nudge_last_text",
  proactiveDone: "qs_ai_nudge_proactive_done",
  suggestionDot: "qs_ai_nudge_dot",
  profiles: "qs_ai_nudge_profiles",
  sessionStart: "qs_ai_nudge_session_start",
};

const ROUTE_HINT_DELAY_MS = 1500;
const IDLE_HINT_DELAY_MS = 15000;
const HINT_VISIBLE_MS = 8000;
const MIN_HINT_GAP_MS = 4000;
const MIN_HINT_GAP_ROUTE_MS = 2500;
const CHAT_COOLDOWN_MS = 15000;
const MAX_HINTS_PER_PAGELOAD = 40;
const PROACTIVE_MIN_SESSION_MS = 45000;
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
    /* tryb prywatny */
  }
}

let pageLoadState = {
  cooldownUntil: 0,
  hintCount: 0,
  lastHintAt: 0,
  lastRouteKey: "",
};

function routeKey(pathname, search, role) {
  return `${role}:${pathname}${search}`;
}

function clientTeaserHint(pathname, search) {
  const haystack = `${pathname} ${search}`.toLowerCase();

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
  if (pathname.startsWith("/wykonawcy/")) {
    return { text: "Znaleźć fachowca w okolicy?", prompt: "Szukam wykonawcy w mojej okolicy. Pomóż mi wybrać najlepszego." };
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
  if (pathname.startsWith("/account")) {
    return { text: "Pytanie o konto?", prompt: "Mam pytanie dotyczące mojego konta lub zleceń na Helpfli." };
  }
  if (pathname.startsWith("/notifications")) {
    return { text: "Co wymaga reakcji?", prompt: "Podsumuj moje powiadomienia i powiedz, co powinienem teraz zrobić." };
  }
  if (pathname === "/" || pathname.startsWith("/home")) {
    return { text: "Pomóc Ci?", prompt: "W czym możesz mi pomóc? Pokaż, co potrafisz." };
  }

  return null;
}

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
  if (pathname.startsWith("/account")) {
    return { text: "Pytanie o konto?", prompt: "Mam pytanie o moje konto wykonawcy, statystyki lub ustawienia." };
  }
  if (pathname.startsWith("/account/subscriptions") || pathname.startsWith("/why-pro")) {
    return { text: "Pytanie o pakiety?", prompt: "Wyjaśnij różnice między pakietami Helpfli i podpowiedz, który najbardziej mi się opłaca." };
  }
  return null;
}

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

function isTypingInForm() {
  const ae = document.activeElement;
  return ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable);
}

export default function useAiConciergeNudge({
  enabled = true,
  chatOpen = false,
  role = "client",
} = {}) {
  const location = useLocation();
  const [teaser, setTeaser] = useState(null);
  const [suggestionDot, setSuggestionDot] = useState(ssGet(SS_KEYS.suggestionDot) === "1");

  const hideTimer = useRef(null);
  const routeTimer = useRef(null);
  const idleTimer = useRef(null);
  const proactiveTimer = useRef(null);
  const resumeTimer = useRef(null);
  const enabledRef = useRef(enabled);
  const chatOpenRef = useRef(chatOpen);
  enabledRef.current = enabled;
  chatOpenRef.current = chatOpen;

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

  const canHint = useCallback((kind = "default") => {
    if (!enabledRef.current || chatOpenRef.current) return false;
    if (Date.now() < pageLoadState.cooldownUntil) return false;
    if (pageLoadState.hintCount >= MAX_HINTS_PER_PAGELOAD) return false;

    const gap = kind === "route" ? MIN_HINT_GAP_ROUTE_MS : MIN_HINT_GAP_MS;
    if (Date.now() - pageLoadState.lastHintAt < gap) return false;

    if (kind === "idle" && isTypingInForm()) return false;
    return true;
  }, []);

  const showHint = useCallback((kind, hint) => {
    if (!hint?.text) return;
    setTeaser({ kind, text: hint.text, prompt: hint.prompt || "" });
    ssSet(SS_KEYS.lastHintText, hint.text);
    pageLoadState.hintCount += 1;
    pageLoadState.lastHintAt = Date.now();
    clearTimer(hideTimer);
    hideTimer.current = setTimeout(() => {
      setTeaser(null);
      if (kind === "proactive") {
        ssSet(SS_KEYS.suggestionDot, "1");
        setSuggestionDot(true);
      }
    }, HINT_VISIBLE_MS);
  }, []);

  const tryContextHint = useCallback(
    (kind) => {
      if (!canHint(kind)) return false;
      showHint(kind, pickHint(location.pathname, location.search, role));
      return true;
    },
    [canHint, showHint, location.pathname, location.search, role]
  );

  const tryRouteHint = useCallback(() => {
    const currentRoute = routeKey(location.pathname, location.search, role);
    if (!enabledRef.current || chatOpenRef.current) return false;
    if (Date.now() < pageLoadState.cooldownUntil) return false;
    if (pageLoadState.hintCount >= MAX_HINTS_PER_PAGELOAD) return false;

    const isNewRoute = currentRoute !== pageLoadState.lastRouteKey;
    if (!isNewRoute && pageLoadState.lastHintAt > 0) return false;
    if (!isNewRoute && Date.now() - pageLoadState.lastHintAt < MIN_HINT_GAP_ROUTE_MS) return false;
    if (isNewRoute && Date.now() - pageLoadState.lastHintAt < 1200) return false;

    showHint("route", pickHint(location.pathname, location.search, role));
    pageLoadState.lastRouteKey = currentRoute;
    return true;
  }, [location.pathname, location.search, role, showHint]);

  /** Po otwarciu czatu — krótka przerwa, potem hinty wracają na kolejnych stronach. */
  const markEngaged = useCallback(() => {
    pageLoadState.cooldownUntil = Date.now() + CHAT_COOLDOWN_MS;
    ssSet(SS_KEYS.suggestionDot, "0");
    setSuggestionDot(false);
    [hideTimer, routeTimer, idleTimer, proactiveTimer, resumeTimer].forEach(clearTimer);
    setTeaser(null);
  }, []);

  const dismissTeaser = useCallback(() => {
    clearTimer(hideTimer);
    setTeaser(null);
  }, []);

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

  // Hint przy każdej stronie (w tym pierwszym wejściu i po remouncie widgetu).
  useEffect(() => {
    let scrollHintDone = false;

    setTeaser(null);
    clearTimer(routeTimer);
    clearTimer(idleTimer);
    clearTimer(proactiveTimer);

    routeTimer.current = setTimeout(() => {
      tryRouteHint();
    }, ROUTE_HINT_DELAY_MS);

    const armIdleTimer = () => {
      clearTimer(idleTimer);
      idleTimer.current = setTimeout(() => tryContextHint("idle"), IDLE_HINT_DELAY_MS);
    };

    const onActivity = () => armIdleTimer();

    const scrollProgress = (target) => {
      if (target === document || target === document.documentElement || target === window) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 160 ? window.scrollY / max : 0;
      }
      if (target instanceof Element) {
        const max = target.scrollHeight - target.clientHeight;
        return max > 160 ? target.scrollTop / max : 0;
      }
      return 0;
    };

    const onScroll = (event) => {
      armIdleTimer();
      if (scrollHintDone) return;
      if (scrollProgress(event.target) >= 0.4) {
        scrollHintDone = true;
        tryContextHint("scroll");
      }
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    armIdleTimer();

    if (
      role === "client" &&
      ssGet(SS_KEYS.proactiveDone) !== "1" &&
      readViewedProfiles().length >= PROACTIVE_MIN_PROFILES
    ) {
      const elapsed = Date.now() - sessionStartRef.current;
      const wait = Math.max(1500, PROACTIVE_MIN_SESSION_MS - elapsed);
      proactiveTimer.current = setTimeout(() => {
        if (!enabledRef.current || chatOpenRef.current) return;
        if (Date.now() < pageLoadState.cooldownUntil) return;
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
  }, [location.pathname, location.search, tryContextHint, tryRouteHint, showHint, role]);

  // Po zamknięciu czatu — hint kontekstowy na bieżącej stronie.
  useEffect(() => {
    if (chatOpen) {
      clearTimer(resumeTimer);
      setTeaser(null);
      return undefined;
    }

    clearTimer(resumeTimer);
    resumeTimer.current = setTimeout(() => {
      if (!enabledRef.current) return;
      pageLoadState.cooldownUntil = 0;
      pageLoadState.lastRouteKey = "";
      tryRouteHint();
    }, 4000);

    return () => clearTimer(resumeTimer);
  }, [chatOpen, enabled, tryRouteHint]);

  useEffect(() => () => clearTimer(hideTimer), []);

  return { teaser, suggestionDot, dismissTeaser, markEngaged };
}
