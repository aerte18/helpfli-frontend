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
 * Logika pokazywania (umiarkowana):
 *  - po ~15 s od pierwszego wejścia w sesji,
 *  - max raz na sesję przeglądarki (nie na każdej podstronie),
 *  - po zamknięciu (X / Esc / backdrop) — przerwa 48 h,
 *  - po „Dołącz teraz" — już nie wraca,
 *  - `?popup=founding` wymusza pokaz po 1 s.
 *
 * Audience: tylko niezalogowani goście.
 */
const STORAGE_KEY = "helpfli.founding_popup.state.v8";
const SESSION_KEY = "helpfli.founding_popup.shown_this_session";
const DELAY_MS = 15000;
const FORCE_SHOW_DELAY_MS = 1000;
const REAPPEAR_AFTER_MS = 48 * 60 * 60 * 1000;

// --- Geometria obrazka /img/founding-provider-popup-card.png ---
// Już przycięty asset (685 × 565), zawiera tylko białą kartę popupu.
const CARD_W = 685;
const CARD_H = 565;

// Pozycje narysowanych elementów wewnątrz obrazka karty (piksele, oryginalne 1:1).
const X_CENTER = { x: 630, y: 43 };
const X_SIZE = 44;
const JOIN_BTN_BOUNDS = { x: 33, y: 428, w: 250, h: 50 };

// Pozycje w % karty (potem przeskalują się ze zmianą rozmiaru modalu).
const cardPct = (x, y, w, h) => ({
  left: `${(x / CARD_W) * 100}%`,
  top: `${(y / CARD_H) * 100}%`,
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

function isForcedFromUrl() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("popup") === "founding";
  } catch {
    return false;
  }
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
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const forced = useMemo(isForcedFromUrl, []);

  const eligible = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (forced) return true;

    if (loading) return false;
    if (user) return false;

    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") return false;
    } catch {
      /* brak sessionStorage */
    }

    const state = readState();
    if (state?.joined === true) return false;
    if (
      Number.isFinite(state?.dismissedAt) &&
      Date.now() - state.dismissedAt < REAPPEAR_AFTER_MS
    ) {
      return false;
    }

    return true;
  }, [user, loading, forced]);

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

      {/* Karta popupu – cały obrazek + dwa przezroczyste przyciski.
          Obrazek jest już przycięty do białej karty, więc używamy go 1:1. */}
      <div
        className={`relative w-full max-w-[640px] ${closing ? "qs-popOut" : "qs-popIn"}`}
      >
        <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-900/10">
          <img
            src="/img/founding-provider-popup-card.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="block w-full h-auto select-none"
          />

          {/* Przezroczysty przycisk X – nałożony dokładnie na narysowany X. */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Zamknij"
            className="absolute z-10 cursor-pointer rounded-full transition-colors hover:bg-slate-900/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
