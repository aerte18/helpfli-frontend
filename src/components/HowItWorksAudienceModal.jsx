import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { getHowItWorksMeta } from "../constants/howItWorksAudiences";

/**
 * Modal „Jak to działa” — osobna treść dla klienta i wykonawcy.
 * Otwierany z banerów promo (hotspoty) bez opuszczania landingu.
 */
export default function HowItWorksAudienceModal({ open, audience = "client", onClose }) {
  const navigate = useNavigate();
  const meta = getHowItWorksMeta(audience);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const scrollToLandingSection = () => {
    onClose?.();
    const el = document.getElementById("jak-to-dziala");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate("/#jak-to-dziala");
  };

  return (
    <div
      className="fixed inset-0 z-[1150] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-modal-title"
    >
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-lg max-h-[min(92vh,640px)] overflow-y-auto rounded-t-2xl sm:rounded-2xl border shadow-xl"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="sticky top-0 flex items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="min-w-0">
            <h2
              id="how-it-works-modal-title"
              className="text-lg font-bold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {meta.title}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
              {meta.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 hover:bg-slate-100 transition-colors"
            aria-label="Zamknij okno"
          >
            <X className="h-5 w-5 text-slate-600" aria-hidden />
          </button>
        </div>

        <ol className="px-5 py-4 space-y-3">
          {meta.steps.map((item) => (
            <li
              key={item.step}
              className="flex gap-3 rounded-xl border p-3.5"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                aria-hidden
              >
                {item.step}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {item.title}
                </h3>
                <p className="mt-0.5 text-sm leading-snug" style={{ color: "var(--muted-foreground)" }}>
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div
          className="sticky bottom-0 flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:flex-wrap"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <button
            type="button"
            onClick={() => {
              onClose?.();
              navigate(meta.registerPath);
            }}
            className="btn-helpfli-primary w-full sm:flex-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold"
          >
            {meta.registerLabel}
          </button>
          <button
            type="button"
            onClick={scrollToLandingSection}
            className="btn-helpfli-secondary w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-sm font-semibold"
          >
            Zobacz na stronie
          </button>
        </div>
      </div>
    </div>
  );
}
