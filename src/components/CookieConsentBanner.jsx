import { useState } from "react";
import { getConsent, hasAnsweredConsent, setConsent } from "../utils/consent";

export default function CookieConsentBanner() {
  const [hidden, setHidden] = useState(hasAnsweredConsent());
  if (hidden) return null;

  const save = (next) => {
    setConsent(next);
    setHidden(true);
  };

  const current = getConsent();

  return (
    <div className="fixed bottom-3 left-3 right-3 z-[80] rounded-xl border border-slate-200 bg-white p-3 shadow-lg md:left-auto md:right-6 md:max-w-md">
      <p className="text-sm text-slate-700">
        Używamy cookies i analityki, aby poprawiać działanie platformy.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => save({ ...current, analytics: false, cookies: false })}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Odrzuć
        </button>
        <button
          type="button"
          onClick={() => save({ ...current, analytics: true, cookies: true })}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
        >
          Akceptuj
        </button>
      </div>
    </div>
  );
}
