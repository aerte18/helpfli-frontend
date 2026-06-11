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
  text: "Trudny wybór? Dobiorę najlepszego.",
  prompt: "Przeglądam kilku wykonawców i nie wiem, kogo wybrać. Porównaj ich i poleć mi najlepszego do mojego problemu.",
};

const HINT_ROTATION = {
  client: [
    { text: "Opowiedz problem — resztę ogarnę", prompt: "Mam problem do rozwiązania. Pomóż mi go opisać i znaleźć najlepszą pomoc." },
    { text: "Znaleźć Ci najlepszą pomoc?", prompt: "Pomóż mi znaleźć najlepszego wykonawcę w mojej okolicy." },
    { text: "Nie wiesz od czego zacząć?", prompt: "Nie wiem, od czego zacząć. Zadaj mi pytania i pomóż dobrać właściwą usługę." },
    { text: "Pilna sprawa? Pomogę od razu", prompt: "Mam pilną sprawę w domu. Pomóż ocenić sytuację i znaleźć kogoś dostępnego jak najszybciej." },
    { text: "Ile to może kosztować?", prompt: "Pomóż mi oszacować, ile może kosztować usługa, której potrzebuję." },
    { text: "Potrzebujesz pomocy?", prompt: "W czym możesz mi pomóc? Pokaż, co potrafisz." },
  ],
  provider: [
    { text: "Chcesz więcej zleceń?", prompt: "Co mogę zrobić, żeby dostawać więcej zleceń i wygrywać częściej na Helpfli?" },
    { text: "Pokażę najlepsze okazje", prompt: "Pokaż najlepsze zlecenia dla mnie i posortuj je według szansy wygranej." },
    { text: "Wycenimy ofertę razem?", prompt: "Pomóż mi wycenić ofertę: uwzględnij zakres, dojazd, materiały i konkurencję." },
    { text: "Jak wygrać to zlecenie?", prompt: "Jak mogę zwiększyć szansę na wygranie zlecenia? Podpowiedz cenę, zakres i pierwszą wiadomość." },
    { text: "Podpowiem, co poprawić", prompt: "Przeanalizuj mój profil i oferty. Co mogę poprawić, żeby zarabiać więcej?" },
    { text: "Co robić teraz?", prompt: "Co powinienem teraz zrobić, żeby wygrać więcej zleceń?" },
  ],
};

/** Krótka etykieta usługi z URL (do personalizacji hintów). */
function serviceLabelFromContext(pathname, search) {
  const params = new URLSearchParams(search);
  const raw =
    params.get("service") ||
    params.get("q") ||
    params.get("category") ||
    pathname.match(/\/wykonawcy\/([^/]+)/)?.[1]?.replace(/-/g, " ") ||
    pathname.match(/\/service\/([^/]+)/)?.[1]?.replace(/-/g, " ") ||
    "";
  if (!raw) return "";
  const label = decodeURIComponent(raw).trim();
  return label.length > 28 ? "" : label;
}

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
  const serviceLabel = serviceLabelFromContext(pathname, search);

  // Kategorie usług — chwytliwe, jak concierge, nie suchy FAQ.
  if (/hydraul|ciek|kran|rura|kanaliz|wc\b|udrażn/.test(haystack)) {
    return {
      text: "Cieknie? Znajdę hydraulika",
      prompt: "Mam problem z hydrauliką. Pomóż ocenić sytuację i znaleźć sprawdzonego fachowca w okolicy.",
    };
  }
  if (/elektry|prąd|prad|gniazd|bezpiecznik|oświetl|oswietl/.test(haystack)) {
    return {
      text: "Problem z prądem? Pomogę",
      prompt: "Mam problem z instalacją elektryczną. Pomóż opisać usterkę i znaleźć dobrego elektryka.",
    };
  }
  if (/agd|rtv|pralk|lodowk|lodówk|zmywark|piekarnik|kuchenk|suszark/.test(haystack)) {
    return {
      text: "Naprawimy czy wymienimy?",
      prompt: "Mam problem ze sprzętem AGD. Pomóż zdiagnozować usterkę i powiedz, czy opłaca się naprawa.",
    };
  }
  if (/sprzat|sprząt|mycie|clean/.test(haystack)) {
    return {
      text: "Potrzebujesz pomocy w domu?",
      prompt: "Szukam pomocy ze sprzątaniem. Pomóż dobrać zakres i znaleźć zaufaną osobę w okolicy.",
    };
  }
  if (/remont|malowan|glazur|tynk|tapet|wykończen|wykonczen|budow/.test(haystack)) {
    return {
      text: "Plan remontu? Ogarnę to z Tobą",
      prompt: "Planuję remont. Pomóż opisać zakres, oszacować koszt i znaleźć dobrą ekipę.",
    };
  }
  if (/klimat|klima|ogrzew|piec|grzejnik/.test(haystack)) {
    return {
      text: "Za zimno albo za gorąco?",
      prompt: "Mam problem z ogrzewaniem lub klimatyzacją. Pomóż ocenić sytuację i znaleźć fachowca.",
    };
  }
  if (/transport|przeprowadz|mebl|montaż|montaz/.test(haystack)) {
    return {
      text: "Trzeba to przewieźć lub zamontować?",
      prompt: "Potrzebuję pomocy z transportem lub montażem. Pomóż dobrać wykonawcę i oszacować koszt.",
    };
  }

  // Co klient właśnie robi na platformie.
  if (/^\/provider\/[^/]+$/.test(pathname)) {
    return {
      text: "Dobry wybór? Sprawdzę za Ciebie",
      prompt: "Oglądam profil wykonawcy. Pomóż mi ocenić, czy to dobry wybór, i porównać z innymi.",
    };
  }
  if (pathname.startsWith("/providers") || pathname.startsWith("/nearby-providers")) {
    if (serviceLabel) {
      return {
        text: "Znaleźć Ci najlepszą pomoc?",
        prompt: `Szukam wykonawcy: ${serviceLabel}. Pomóż mi wybrać najlepszego — opinie, cena i dostępność.`,
      };
    }
    return {
      text: "Szukasz fachowca? Pomogę wybrać",
      prompt: "Przeglądam wykonawców i nie wiem, kogo wybrać. Pomóż mi znaleźć najlepszą pomoc w okolicy.",
    };
  }
  if (pathname.startsWith("/wykonawcy/")) {
    const city = pathname.split("/")[3]?.replace(/-/g, " ") || "okolicy";
    return {
      text: "Znaleźć fachowca w okolicy?",
      prompt: `Szukam sprawdzonego wykonawcy w ${city}. Pomóż mi wybrać najlepszego.`,
    };
  }
  if (pathname.startsWith("/my-orders") || pathname.startsWith("/orders/my")) {
    return {
      text: "Co wymaga Twojej uwagi?",
      prompt: "Przejrzyj moje zlecenia i powiedz, czy coś wymaga mojej reakcji albo pilnej decyzji.",
    };
  }
  if (pathname.includes("/sprawa")) {
    return {
      text: "Pomogę w tej sprawie",
      prompt: "Mam sprawę/spór dotyczący zlecenia. Pomóż mi zrozumieć sytuację i podpowiedz, co zrobić.",
    };
  }
  if (/^\/orders\/[^/]+/.test(pathname)) {
    return {
      text: "Ogarnąć to zlecenie?",
      prompt: "Mam pytanie lub wątpliwość dotyczącą tego zlecenia. Pomóż mi podjąć dobrą decyzję.",
    };
  }
  if (pathname.startsWith("/create-order")) {
    return {
      text: "Opisz problem — resztę ogarnę",
      prompt: "Chcę zlecić usługę. Zadaj mi najważniejsze pytania i pomóż przygotować dobre zlecenie.",
    };
  }
  if (pathname.startsWith("/checkout")) {
    return {
      text: "Masz wątpliwości przed płatnością?",
      prompt: "Jestem przy płatności i mam wątpliwości. Wyjaśnij mi, co się teraz dzieje i czy wszystko wygląda OK.",
    };
  }
  if (pathname.startsWith("/cennik")) {
    return {
      text: "Ile to może kosztować?",
      prompt: "Chcę wiedzieć, ile może kosztować usługa, której potrzebuję. Pomóż mi to oszacować.",
    };
  }
  if (pathname.startsWith("/poradnik")) {
    return {
      text: "Masz pytanie? Wyjaśnię",
      prompt: "Czytam poradnik i mam pytanie do tego tematu. Wyjaśnij mi to prosto i praktycznie.",
    };
  }
  if (pathname.startsWith("/poradniki")) {
    return {
      text: "Nie wiesz, od czego zacząć?",
      prompt: "Przeglądam poradniki i nie wiem, od czego zacząć. Pomóż mi dobrać właściwą usługę.",
    };
  }
  if (pathname.startsWith("/concierge")) {
    return {
      text: "Opowiedz — znajdę pomoc",
      prompt: "",
    };
  }
  if (pathname.startsWith("/services") || pathname.startsWith("/service/")) {
    if (serviceLabel) {
      return {
        text: "Potrzebujesz tej usługi?",
        prompt: `Interesuje mnie usługa: ${serviceLabel}. Pomóż opisać problem i znaleźć dobrego wykonawcę.`,
      };
    }
    return {
      text: "Nie wiesz, kogo wybrać?",
      prompt: "Przeglądam usługi i nie wiem, kogo wybrać. Pomóż mi dobrać właściwą pomoc.",
    };
  }
  if (pathname.startsWith("/account/subscriptions")) {
    return {
      text: "Pytanie o pakiet?",
      prompt: "Mam pytanie o pakiety i korzyści na Helpfli. Wyjaśnij, co mi się opłaca.",
    };
  }
  if (pathname.startsWith("/account")) {
    return {
      text: "Pomogę ogarnąć konto",
      prompt: "Mam pytanie o moje konto, zlecenia lub ustawienia na Helpfli.",
    };
  }
  if (pathname.startsWith("/notifications")) {
    return {
      text: "Co jest teraz pilne?",
      prompt: "Podsumuj moje powiadomienia i powiedz, co powinienem teraz zrobić w pierwszej kolejności.",
    };
  }
  if (pathname.startsWith("/help")) {
    return {
      text: "Nie znalazłeś odpowiedzi?",
      prompt: "Szukam pomocy w centrum pomocy. Opisz mój problem i podpowiedz, co powinienem zrobić.",
    };
  }
  if (pathname.startsWith("/rate-user")) {
    return {
      text: "Pomogę napisać opinię",
      prompt: "Chcę wystawić opinię wykonawcy. Pomóż mi napisać krótką, fair recenzję.",
    };
  }
  if (pathname === "/" || pathname.startsWith("/home")) {
    return {
      text: "Szukasz pomocy? Zacznijmy",
      prompt: "Szukam pomocy w domu lub okolicy. Pomóż mi opisać problem i znaleźć najlepszego wykonawcę.",
    };
  }

  return null;
}

function providerTeaserHint(pathname) {
  if (pathname.startsWith("/provider-home")) {
    return {
      text: "Mam dla Ciebie okazje",
      prompt: "Pokaż najlepsze zlecenia dla mnie teraz i posortuj je według szansy wygranej.",
    };
  }
  if (pathname.startsWith("/available-orders")) {
    return {
      text: "Szukasz zarobku? Znalazłem okazje",
      prompt: "Przeglądam dostępne zlecenia. Pokaż te z największą szansą wygranej i najlepszym zarobkiem.",
    };
  }
  if (pathname.startsWith("/provider/quotes")) {
    return {
      text: "Wycenimy ofertę razem?",
      prompt: "Pomóż mi wycenić ofertę: uwzględnij zakres, dojazd, materiały, czas pracy i konkurencję.",
    };
  }
  if (pathname.includes("/sprawa")) {
    return {
      text: "Pomogę w tej sprawie",
      prompt: "Mam sprawę dotyczącą zlecenia. Pomóż mi zrozumieć sytuację i podpowiedz, jak profesjonalnie odpowiedzieć.",
    };
  }
  if (/^\/orders\/[^/]+/.test(pathname)) {
    return {
      text: "Wygrywamy to zlecenie?",
      prompt: "Chcę wygrać to zlecenie. Podpowiedz dobrą cenę, zakres prac i pierwszą wiadomość do klienta.",
    };
  }
  if (pathname.startsWith("/messages") || pathname.startsWith("/inbox")) {
    return {
      text: "Napiszę wiadomość do klienta",
      prompt: "Napisz profesjonalną wiadomość do klienta — krótko, konkretnie, z pytaniami o zakres, termin i budżet.",
    };
  }
  if (pathname.startsWith("/manage-services")) {
    return {
      text: "Więcej zleceń? Podpowiem jak",
      prompt: "Co mogę poprawić w profilu i ofercie usług, żeby dostawać więcej zleceń?",
    };
  }
  if (pathname.startsWith("/kyc")) {
    return {
      text: "Pytanie o weryfikację?",
      prompt: "Mam pytanie o weryfikację konta wykonawcy. Wyjaśnij, co powinienem zrobić.",
    };
  }
  if (pathname.startsWith("/account/subscriptions") || pathname.startsWith("/why-pro")) {
    return {
      text: "Chcesz więcej zleceń?",
      prompt: "Wyjaśnij różnice między pakietami Helpfli i powiedz, który najbardziej zwiększy moje szanse.",
    };
  }
  if (pathname.startsWith("/account/wallet") || pathname.startsWith("/account/boosts")) {
    return {
      text: "Jak lepiej wykorzystać konto?",
      prompt: "Mam pytanie o portfel, boosty lub wydatki na Helpfli. Podpowiedz, co mi się opłaca.",
    };
  }
  if (pathname.startsWith("/account")) {
    return {
      text: "Pomogę ogarnąć konto",
      prompt: "Mam pytanie o konto wykonawcy, statystyki, ustawienia lub moje oferty.",
    };
  }
  if (pathname.startsWith("/notifications")) {
    return {
      text: "Co wymaga reakcji?",
      prompt: "Podsumuj moje powiadomienia i powiedz, na co powinienem zareagować w pierwszej kolejności.",
    };
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
