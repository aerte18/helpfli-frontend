import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Pop-up „Odbierz status Pierwszego Wykonawcy Helpfli".
 *
 * Treść jest jednym assetem PNG (grafika + nagłówki + lista zaszyte w obrazku),
 * a interakcję obsługują tylko dwa przezroczyste przyciski nałożone na obrazek:
 *   - X (zamknij)   – w prawym górnym rogu, nad narysowanym kółkiem,
 *   - „Dołącz teraz" – nad narysowanym CTA.
 *
 * Logika pokazywania (nieagresywna, ale realna):
 *  - po ~20 s w trakcie wizyty,
 *  - tylko raz na sesję przeglądarki (nie wyskakuje na każdej podstronie),
 *  - po zamknięciu (X / Esc / backdrop) wraca dopiero po 24 h,
 *  - po kliknięciu „Dołącz teraz" już nie wraca,
 *  - `?popup=founding` w URL wymusza pokaz natychmiast (1 s) i ignoruje blokady.
 *
 * Audience: niezalogowani LUB provider/company_owner bez aktywnego foundingProvider.
 */
const STORAGE_KEY = "helpfli.founding_popup.state.v6";
const SESSION_KEY = "helpfli.founding_popup.shown_this_session";
const DELAY_MS = 20000;
const FORCE_SHOW_DELAY_MS = 1000;
const REAPPEAR_AFTER_MS = 24 * 60 * 60 * 1000; // 24 h

// --- Geometria obrazka /img/founding-provider-popup.png ---
// Obrazek (1024 × 683) zawiera popup + zblurowane tło strony. Przycinamy do
// białej karty, żeby nie powstawał efekt „popup w popupie".
const IMG_W = 1024;
const IMG_H = 683;
const CARD_LEFT = 165;
const CARD_TOP = 60;
const CARD_W = 715;
const CARD_H = 535;

// Pozycje narysowanych elementów wewnątrz CAŁEGO obrazka (piksele).
const X_CENTER = { x: 820, y: 95 };
const X_SIZE = 38;
const JOIN_BTN_BOUNDS = { x: 268, y: 484, w: 168, h: 44 };

// Pozycja przycisku w % karty (jak ustawiany jest absolutny element wewnątrz kontenera).
const cardPct = (x, y, w, h) => ({
  left: `${((x - CARD_LEFT) / CARD_W) * 100}%`,
  top: `${((y - CARD_TOP) / CARD_H) * 100}%`,
  width: `${(w / CARD_W) * 100}%`,
  height: `${(h / CARD_H) * 100}%`,
});

const X_BTN_POS = cardPct(
  X_CENTER.x - X_SIZE / 2,
  X_CENTER.y - X_SIZE / 2,
  X_SIZE,
  X_SIZE
);
const JOIN_BTN_POS = cardPct(
  JOIN_BTN_BOUNDS.x,
  JOIN_BTN_BOUNDS.y,
  JOIN_BTN_BOUNDS.w,
  JOIN_BTN_BOUNDS.h
);

// Skalowanie obrazka wewnątrz kontenera-karty.
// Kontener ma rozmiar białej karty z obrazka (CARD_W × CARD_H proporcjonalnie).
// Cały obrazek jest skalowany tak, żeby ta sama karta wypełniała kontener.
const IMG_WIDTH_PCT = (IMG_W / CARD_W) * 100;
const IMG_OFFSET_LEFT_PCT = -(CARD_LEFT / CARD_W) * 100;
const IMG_OFFSET_TOP_PCT = -(CARD_TOP / CARD_H) * 100;

function isForcedFromUrl() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("popup") === "founding";
  } catch {
    return false;
  }
}

function hasActiveFoundingProvider(user) {
  if (!user) return false;
  if (user.foundingProviderEverActivated === true) return true;
  const fp = user.foundingProvider;
  if (fp === true) return true;
  if (fp && typeof fp === "object") {
    if (fp.active === true) return true;
    const exp = fp.expiresAt || user.foundingProviderExpiresAt;
    if (exp) {
      const t = Date.parse(exp);
      if (Number.isFinite(t) && t > Date.now()) return true;
    }
  }
  return false;
}

function readState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (raw === "1") return { dismissedAt: Date.now(), joined: false };
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export default function FoundingProviderPopup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const forced = useMemo(isForcedFromUrl, []);

  const eligible = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (forced) return true;

    // 1) Pokazany w tej sesji – nie powtarzaj na innych podstronach.
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") return false;
    } catch {
      /* brak sessionStorage – pomijamy */
    }

    // 2) Sprawdź historię: kliknięcie „Dołącz" = permanent; X/Esc = na 24 h.
    const state = readState();
    if (state) {
      if (state.joined === true) return false;
      if (
        Number.isFinite(state.dismissedAt) &&
        Date.now() - state.dismissedAt < REAPPEAR_AFTER_MS
      ) {
        return false;
      }
    }

    // 3) Audience.
    if (!user) return true;
    const role = user.role;
    if (role !== "provider" && role !== "company_owner") return false;
    if (hasActiveFoundingProvider(user)) return false;
    return true;
  }, [user, forced]);

  useEffect(() => {
    if (!eligible) return undefined;
    const delay = forced ? FORCE_SHOW_DELAY_MS : DELAY_MS;
    const t = setTimeout(() => {
      setOpen(true);
      if (!forced) {
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* noop */
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [eligible, forced]);

  const persistDismiss = useCallback(() => {
    if (forced) return;
    writeState({ dismissedAt: Date.now(), joined: false });
  }, [forced]);

  const persistJoined = useCallback(() => {
    if (forced) return;
    writeState({ dismissedAt: Date.now(), joined: true });
  }, [forced]);

  const handleClose = useCallback(() => {
    setClosing(true);
    persistDismiss();
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 180);
  }, [persistDismiss]);

  const handleJoin = useCallback(() => {
    persistJoined();
    setOpen(false);
    navigate("/register?role=provider&utm_source=popup&utm_campaign=founding_provider");
  }, [navigate, persistJoined]);

  // Esc + scroll lock
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Odbierz status Pierwszego Wykonawcy Helpfli"
      className={`fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 ${
        closing ? "qs-fadeOut" : "qs-fadeIn"
      }`}
    >
      {/* Tło — klik zamyka */}
      <button
        type="button"
        aria-label="Zamknij okno"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
      />

      {/* Karta popupu – cały obrazek + dwa przezroczyste przyciski. */}
      <div
        className={`relative w-full max-w-[760px] ${closing ? "qs-popOut" : "qs-popIn"}`}
      >
        <div
          className="relative w-full overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10"
          style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}
        >
          <img
            src="/img/founding-provider-popup.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute select-none"
            style={{
              width: `${IMG_WIDTH_PCT}%`,
              height: "auto",
              left: `${IMG_OFFSET_LEFT_PCT}%`,
              top: `${IMG_OFFSET_TOP_PCT}%`,
            }}
          />

          {/* Przezroczysty przycisk X – nałożony dokładnie na narysowany X. */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Zamknij"
            className="absolute z-10 cursor-pointer rounded-full transition-colors hover:bg-slate-900/5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{
              left: X_BTN_POS.left,
              top: X_BTN_POS.top,
              width: X_BTN_POS.width,
              height: X_BTN_POS.height,
            }}
          />

          {/* Przezroczysty przycisk „Dołącz teraz" – nałożony na narysowany CTA. */}
          <button
            type="button"
            onClick={handleJoin}
            aria-label="Dołącz teraz"
            className="absolute z-10 cursor-pointer rounded-xl transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            style={{
              left: JOIN_BTN_POS.left,
              top: JOIN_BTN_POS.top,
              width: JOIN_BTN_POS.width,
              height: JOIN_BTN_POS.height,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes qsFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qsFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes qsPopIn {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes qsPopOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(6px) scale(.98); }
        }
        .qs-fadeIn  { animation: qsFadeIn .18s ease-out both; }
        .qs-fadeOut { animation: qsFadeOut .18s ease-in both; }
        .qs-popIn   { animation: qsPopIn .22s cubic-bezier(.2,.7,.2,1) both; }
        .qs-popOut  { animation: qsPopOut .18s ease-in both; }
        @media (prefers-reduced-motion: reduce) {
          .qs-fadeIn, .qs-fadeOut, .qs-popIn, .qs-popOut { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
