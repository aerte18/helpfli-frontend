import { useEffect, useState } from "react";
import { X, Shield, BarChart3, Megaphone, Settings2 } from "lucide-react";
import { setConsent } from "../../utils/consent";

const CATEGORIES = [
  {
    key: "necessary",
    icon: Shield,
    title: "Niezbędne",
    badge: "Zawsze aktywne",
    description:
      "Pliki konieczne do działania serwisu: sesja, logowanie (JWT), bezpieczeństwo (CSRF), koszyk i preferencje wybrane w kreatorze zlecenia. Bez nich Helpfli nie zadziała.",
    locked: true,
  },
  {
    key: "preferences",
    icon: Settings2,
    title: "Preferencje",
    description:
      "Zapamiętujemy Twój wybór języka, motywu (jasny/ciemny) oraz ostatnio użyte filtry wyszukiwania, żebyś nie musiał ustawiać ich od nowa przy każdej wizycie.",
  },
  {
    key: "analytics",
    icon: BarChart3,
    title: "Analityka",
    description:
      "Anonimowe statystyki użycia (Web Vitals, Sentry breadcrumbs) — pomagają nam wykrywać błędy i optymalizować wydajność. Nie identyfikujemy Cię na ich podstawie.",
  },
  {
    key: "marketing",
    icon: Megaphone,
    title: "Marketing",
    description:
      "Spersonalizowane oferty wykonawców, banery sponsorów dopasowane do Twojej kategorii oraz powiadomienia o nowościach (newsletter, push). Możesz je wyłączyć w każdej chwili.",
  },
];

export default function ConsentPreferencesModal({ open, onClose, onSaved, initial }) {
  const [values, setValues] = useState(() => ({
    preferences: !!initial?.preferences,
    analytics: !!initial?.analytics,
    marketing: !!initial?.marketing,
  }));

  useEffect(() => {
    if (!open) return;
    setValues({
      preferences: !!initial?.preferences,
      analytics: !!initial?.analytics,
      marketing: !!initial?.marketing,
    });
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (key) => {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setConsent(values);
    onSaved?.();
  };

  const handleAcceptAll = () => {
    const next = { preferences: true, analytics: true, marketing: true };
    setValues(next);
    setConsent(next);
    onSaved?.();
  };

  const handleRejectAll = () => {
    const next = { preferences: false, analytics: false, marketing: false };
    setValues(next);
    setConsent(next);
    onSaved?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-prefs-title"
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="consent-prefs-title" className="text-lg font-semibold text-slate-900">
              Ustawienia prywatności
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Zdecyduj, które kategorie cookie i danych chcesz dopuścić.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="-mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isOn = cat.locked ? true : !!values[cat.key];
              return (
                <li
                  key={cat.key}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-slate-200">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{cat.title}</h3>
                          {cat.badge && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isOn}
                          aria-label={`Włącz ${cat.title}`}
                          disabled={cat.locked}
                          onClick={() => !cat.locked && toggle(cat.key)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                            isOn ? "bg-indigo-600" : "bg-slate-300"
                          } ${cat.locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              isOn ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <button
              type="button"
              onClick={handleRejectAll}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tylko niezbędne
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Akceptuj wszystkie
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Zapisz wybór
          </button>
        </div>
      </div>
    </div>
  );
}
