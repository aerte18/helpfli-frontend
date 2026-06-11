import { useEffect, useState } from "react";
import { Sparkles, X, Wrench, Home, Zap, Camera, PenLine, Send, ShieldCheck } from "lucide-react";

/**
 * Bottom sheet "Asystent Helpfli" (styl Uber / Meta AI) — pierwszy ekran po
 * kliknięciu dymka ✨ na mobile. Jeden klik w kafelek lub wpisanie tekstu
 * przenosi użytkownika prosto do rozmowy z AI (istniejący czat, bez zmian).
 */

const QUICK_ACTIONS = [
  {
    icon: Wrench,
    label: "Naprawa / awaria",
    value: "Mam awarię w domu. Pomóż ocenić, co się dzieje, czy to pilne i co mogę zrobić.",
    tone: "bg-sky-50 text-sky-600",
  },
  {
    icon: Home,
    label: "Znajdź wykonawcę",
    value: "Szukam sprawdzonego wykonawcy w mojej okolicy. Pomóż dobrać najlepszych.",
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Zap,
    label: "Potrzebuję pomocy teraz",
    value: "Potrzebuję pomocy natychmiast. Znajdź dostępnych fachowców, którzy mogą zająć się tym jak najszybciej.",
    tone: "bg-amber-50 text-amber-600",
  },
  {
    icon: Camera,
    label: "Wyślij zdjęcie",
    value: "Chcę pokazać problem na zdjęciu.",
    tone: "bg-violet-50 text-violet-600",
  },
  {
    icon: PenLine,
    label: "Przygotuj opis zlecenia",
    value: "Pomóż mi opisać problem, zadaj najważniejsze pytania i przygotuj zlecenie dla wykonawcy.",
    tone: "bg-indigo-50 text-indigo-600",
  },
];

const CLOSE_ANIM_MS = 200;

export default function AiQuickSheet({ open, onClose, onStart }) {
  const [closing, setClosing] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setClosing(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose?.();
    }, CLOSE_ANIM_MS);
  };

  const startWith = (value) => {
    const seed = (value || "").trim();
    setText("");
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onStart?.(seed);
    }, CLOSE_ANIM_MS);
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Asystent Helpfli">
      <button
        type="button"
        aria-label="Zamknij"
        onClick={handleClose}
        className={`absolute inset-0 bg-slate-900/45 qs-ai-sheet-backdrop ${closing ? "qs-ai-sheet-backdrop--out" : ""}`}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white shadow-2xl qs-ai-sheet-panel ${
          closing ? "qs-ai-sheet-panel--out" : ""
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200" aria-hidden />

        <div className="flex items-start justify-between px-5 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
              <Sparkles className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <div className="text-base font-semibold text-slate-900">Asystent Helpfli</div>
              <p className="text-xs leading-snug text-slate-500">
                Opisz problem, a pomogę znaleźć rozwiązanie albo wykonawcę.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="qs-tap-target -mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Zamknij asystenta"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 px-5 pt-4">
          {QUICK_ACTIONS.map(({ icon: Icon, label, value, tone }) => (
            <button
              key={label}
              type="button"
              onClick={() => startWith(value)}
              className="flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 active:scale-[0.97]"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-slate-800">{label}</span>
            </button>
          ))}
        </div>

        <form
          className="flex items-center gap-2 px-5 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) startWith(text);
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Opisz, z czym potrzebujesz pomocy…"
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="qs-tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            aria-label="Wyślij"
          >
            <Send className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-[11px] font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Bezpiecznie przez Helpfli
        </div>
      </div>
    </div>
  );
}
