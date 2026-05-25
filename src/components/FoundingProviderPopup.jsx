import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Award, CheckCircle2, Crown, TrendingUp, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Pop-up „Odbierz status Pierwszego Wykonawcy Helpfli”.
 *
 * UX:
 *  - Nieagresywny: pojawia się po 25 s (w przedziale 20–30 s).
 *  - Nie pokazuje się, gdy:
 *      * użytkownik jest już wykonawcą / company_owner,
 *      * został zamknięty / klikany („Dołącz”) – pamiętane w localStorage (per-wersja).
 *  - Klik w X / poza modalem / Esc => zamknięcie (zliczone jako „dismiss”).
 *  - Klik „Dołącz teraz” => przekierowanie do /register?role=provider.
 */
const STORAGE_KEY = "helpfli.founding_popup.dismissed.v1";
const DELAY_MS = 25000;

const BENEFITS = [
  "0% prowizji przez 60 dni",
  "Większa widoczność i więcej zleceń",
  "Status Pierwszego Wykonawcy i darmowe wyróżnienia",
];

const SIDE_CARDS = [
  { icon: TrendingUp, label: "Więcej zleceń" },
  { icon: Award, label: "Lepsza widoczność" },
  { icon: Crown, label: "Specjalne wyróżnienia" },
];

export default function FoundingProviderPopup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const eligible = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return false;
    } catch (_) {
      // brak localStorage – pokaż mimo wszystko
    }
    const role = user?.role;
    if (role === "provider" || role === "company_owner") return false;
    if (user?.foundingProvider || user?.foundingProviderEverActivated) return false;
    return true;
  }, [user]);

  useEffect(() => {
    if (!eligible) return undefined;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [eligible]);

  const persistDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {
      /* noop */
    }
  }, []);

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
      aria-labelledby="founding-popup-title"
      className={`fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 ${
        closing ? "qs-fadeOut" : "qs-fadeIn"
      }`}
    >
      <button
        type="button"
        aria-label="Zamknij okno"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
      />

      <div
        className={`relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 ${
          closing ? "qs-popOut" : "qs-popIn"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative p-6 sm:p-8 md:p-10">
            <div className="flex items-center gap-2 text-indigo-600">
              <img
                src="/img/helpfli-icon-180.jpg"
                alt=""
                className="h-7 w-7 rounded-md object-cover"
                draggable={false}
              />
              <span className="text-base font-bold tracking-tight">Helpfli</span>
            </div>

            <h2
              id="founding-popup-title"
              className="mt-5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-[28px]"
            >
              Odbierz status{" "}
              <span className="text-indigo-600">Pierwszego</span>
              <br className="hidden sm:block" /> Wykonawcy Helpfli
            </h2>

            <p className="mt-3 text-sm text-slate-600 sm:text-[15px]">
              Dołącz do grona zaufanych specjalistów i zyskaj przewagę na starcie.
            </p>

            <ul className="mt-5 space-y-2.5">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14px] text-slate-800 sm:text-[15px]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleJoin}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-[15px] font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-[0.99] sm:w-auto sm:min-w-[240px]"
            >
              Dołącz teraz
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>

            <p className="mt-4 text-[12px] leading-snug text-slate-500">
              Oferta tylko dla pierwszych wykonawców.
              <br />
              Liczba miejsc ograniczona.
            </p>
          </div>

          {/* Prawa kolumna – wizualna (gradient + odznaka + 3 mini-kafle) */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-50 via-indigo-100/70 to-white md:block">
            <div
              className="absolute -right-12 -top-10 h-56 w-56 rounded-full bg-indigo-200/60 blur-2xl"
              aria-hidden
            />
            <div
              className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl"
              aria-hidden
            />

            {/* Odznaka „PIERWSZY WYKONAWCA” */}
            <div className="relative mx-auto mt-12 flex h-48 w-48 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-white/70 shadow-inner" aria-hidden />
              <div className="relative flex h-40 w-40 flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl ring-4 ring-white">
                <Crown className="h-9 w-9 text-amber-300" aria-hidden />
                <div className="mt-1.5 text-center text-[10px] font-bold tracking-wider">
                  PIERWSZY
                  <br />
                  WYKONAWCA
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 w-[88%] -translate-x-1/2 rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-900/5">
              <ul className="space-y-2">
                {SIDE_CARDS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-[13px] font-medium text-slate-800">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Lokalne keyframes (bez modyfikowania globalnego CSS) */}
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
