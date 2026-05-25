import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, Settings } from "lucide-react";
import { acceptAllConsent, getConsent, hasAnsweredConsent, rejectAllConsent } from "../../utils/consent";
import ConsentPreferencesModal from "./ConsentPreferencesModal";

/**
 * RODO-compliant banner zgody na cookies.
 *
 * Standard: 3 równorzędne opcje (Akceptuj wszystkie / Tylko niezbędne / Dostosuj).
 * Wytyczne UODO + EROD: "odrzucenie" musi być tak samo łatwe jak "akceptacja".
 *
 * Banner pokazuje się tylko raz — do momentu zapisania decyzji.
 * Później można otworzyć modal z Footera ("Ustawienia prywatności").
 */
export default function ConsentBanner({ onAnswered }) {
  const [visible, setVisible] = useState(() => !hasAnsweredConsent());
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    const onOpenPrefs = () => {
      setPrefsOpen(true);
    };
    window.addEventListener("qs-open-privacy-settings", onOpenPrefs);
    return () => window.removeEventListener("qs-open-privacy-settings", onOpenPrefs);
  }, []);

  const finish = () => {
    setVisible(false);
    onAnswered?.();
  };

  const handleAcceptAll = () => {
    acceptAllConsent();
    finish();
  };

  const handleRejectAll = () => {
    rejectAllConsent();
    finish();
  };

  const handleSavedFromModal = () => {
    setPrefsOpen(false);
    finish();
  };

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-labelledby="consent-banner-title"
          aria-describedby="consent-banner-desc"
          className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-3 sm:px-4 sm:pb-4"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Cookie className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="consent-banner-title" className="text-base font-semibold text-slate-900">
                    Twoja prywatność
                  </h2>
                  <p id="consent-banner-desc" className="mt-1 text-sm leading-relaxed text-slate-600">
                    Używamy plików cookie i podobnych technologii, aby Helpfli działał poprawnie, mierzyć ruch
                    i ulepszać platformę. Pliki niezbędne włączone są zawsze. Pozostałe (analityka, marketing,
                    preferencje) wymagają Twojej zgody. Możesz ją zmienić w każdej chwili w stopce strony.{" "}
                    <Link
                      to="/prywatnosc"
                      className="font-medium text-indigo-600 underline-offset-2 hover:underline"
                    >
                      Polityka prywatności
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPrefsOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" aria-hidden />
                  Dostosuj
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tylko niezbędne
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Akceptuj wszystkie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConsentPreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        onSaved={handleSavedFromModal}
        initial={getConsent()}
      />
    </>
  );
}
