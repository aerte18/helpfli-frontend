import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Pop-up „Odbierz status Pierwszego Wykonawcy Helpfli".
 *
 * Czysty popup z prawdziwym UI:
 *  - po lewej: tytuł, lista benefitów, CTA „Dołącz teraz" → /register?role=provider
 *  - po prawej: ilustracja /img/founding-provider-illustration.png
 *  - X w prawym górnym rogu zamyka popup (z zapisem w localStorage)
 *  - klik poza popupem / Esc też zamyka
 *
 * Audience: niezalogowani LUB provider/company_owner bez aktywnego foundingProvider.
 * Pojawia się po ~25 s (lub natychmiast z `?popup=founding`).
 */
const STORAGE_KEY = "helpfli.founding_popup.dismissed.v4";
const DELAY_MS = 25000;
const FORCE_SHOW_DELAY_MS = 1000;

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

const BENEFITS = [
  { icon: "⭐", title: "Wyższa widoczność", text: "Pierwsze miejsca w wynikach Helpfli przez 6 miesięcy." },
  { icon: "💰", title: "0% prowizji", text: "Bez prowizji od pierwszych zleceń — wszystko zostaje u Ciebie." },
  { icon: "🏆", title: "Specjalna odznaka", text: "Złoty badge „Pierwszy Wykonawca Helpfli” w profilu." }
];

export default function FoundingProviderPopup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const forced = useMemo(isForcedFromUrl, []);

  const eligible = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (forced) return true;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return false;
    } catch {
      /* brak localStorage – pokaż mimo wszystko */
    }
    if (!user) return true;
    const role = user.role;
    if (role !== "provider" && role !== "company_owner") return false;
    if (hasActiveFoundingProvider(user)) return false;
    return true;
  }, [user, forced]);

  useEffect(() => {
    if (!eligible) return undefined;
    const delay = forced ? FORCE_SHOW_DELAY_MS : DELAY_MS;
    const t = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(t);
  }, [eligible, forced]);

  const persistDismiss = useCallback(() => {
    if (forced) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
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
    persistDismiss();
    setOpen(false);
    navigate("/register?role=provider&utm_source=popup&utm_campaign=founding_provider");
  }, [navigate, persistDismiss]);

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
      aria-labelledby="founding-popup-title"
      className={`fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 ${
        closing ? "qs-fadeOut" : "qs-fadeIn"
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Zamknij okno"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
      />

      {/* Karta popupu */}
      <div
        className={`relative w-full max-w-[760px] ${closing ? "qs-popOut" : "qs-popIn"}`}
      >
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
          {/* X – zamknij */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Zamknij"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white hover:shadow flex items-center justify-center text-slate-600 hover:text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Lewa kolumna — treść */}
            <div className="flex-1 p-6 sm:p-8 md:p-10">
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider">
                <span aria-hidden>🏆</span>
                Limitowana oferta
              </div>

              <h2
                id="founding-popup-title"
                className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2"
              >
                Odbierz status<br />
                <span className="text-indigo-600">Pierwszego Wykonawcy</span><br />
                Helpfli
              </h2>

              <p className="text-sm sm:text-base text-slate-600 mb-5">
                Dołącz do grona pierwszych specjalistów Helpfli i przejmij prowadzenie na starcie.
              </p>

              <ul className="space-y-3 mb-6">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-base" aria-hidden>
                      {b.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{b.title}</div>
                      <div className="text-xs sm:text-sm text-slate-600">{b.text}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleJoin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-600/20 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Dołącz teraz
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <div className="mt-3 text-xs text-slate-400">
                Bez zobowiązań · Rejestracja zajmuje minutę
              </div>
            </div>

            {/* Prawa kolumna — ilustracja */}
            <div className="hidden md:flex md:w-[280px] lg:w-[320px] shrink-0 bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 items-end justify-center p-6 relative">
              <img
                src="/img/founding-provider-illustration.png"
                alt="Pierwszy wykonawca Helpfli"
                className="max-h-[340px] w-auto object-contain drop-shadow-xl"
                draggable={false}
              />
              {/* Dekoracyjna gwiazdka */}
              <div className="absolute top-4 right-4 text-5xl rotate-12 opacity-30 select-none" aria-hidden>
                ⭐
              </div>
            </div>
          </div>
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
