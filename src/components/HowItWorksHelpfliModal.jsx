import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { HOW_IT_WORKS_MODAL_CONTENT } from "../constants/howItWorksModalContent";
import { useFocusTrap } from "../hooks/useFocusTrap";

function AudienceToggle({ audience, onChange }) {
  return (
    <div
      className="inline-flex rounded-xl border p-1"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
      role="tablist"
      aria-label="Wybierz perspektywę"
    >
      <button
        type="button"
        role="tab"
        aria-selected={audience === "client"}
        onClick={() => onChange("client")}
        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition sm:text-sm ${
          audience === "client" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Szukam pomocy
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={audience === "provider"}
        onClick={() => onChange("provider")}
        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition sm:text-sm ${
          audience === "provider" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Jestem wykonawcą
      </button>
    </div>
  );
}

/**
 * Globalny modal: Jak działa + Dlaczego warto + CTA (osobna treść dla klienta i wykonawcy).
 */
export default function HowItWorksHelpfliModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useFocusTrap(open);
  const [audience, setAudience] = useState("client");

  const content = HOW_IT_WORKS_MODAL_CONTENT[audience];

  useEffect(() => {
    const onOpen = (e) => {
      setAudience(e.detail?.audience === "provider" ? "provider" : "client");
      setOpen(true);
    };
    window.addEventListener("qs-open-how-it-works", onOpen);
    return () => window.removeEventListener("qs-open-how-it-works", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const goDetails = () => {
    setOpen(false);
    const el = document.getElementById("platforma-szczegoly");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate("/#platforma-szczegoly");
  };

  return (
    <div
      className="fixed inset-0 z-[1150] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-helpfli-title"
    >
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div
        ref={panelRef}
        className="relative z-10 flex w-full max-h-[min(94vh,900px)] max-w-4xl flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div
          className="flex shrink-0 flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0 flex-1 pr-2">
            <h2
              id="how-it-works-helpfli-title"
              className="text-xl font-bold leading-tight md:text-2xl"
              style={{ color: "var(--foreground)" }}
            >
              Jak działa Helpfli?
            </h2>
            <p className="mt-1 text-sm md:text-base" style={{ color: "var(--muted-foreground)" }}>
              {content.subtitle}
            </p>
            <div className="mt-3">
              <AudienceToggle audience={audience} onChange={setAudience} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 shrink-0 rounded-full p-2 transition-colors hover:bg-slate-100 sm:static"
            aria-label="Zamknij okno"
          >
            <X className="h-5 w-5 text-slate-600" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6" key={audience}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {content.steps.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  className="rounded-[16px] border p-3.5 transition-shadow hover:shadow-md"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      {item.step}
                    </span>
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "oklch(0.94 0.04 264 / 0.65)" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} aria-hidden />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {item.desc}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold md:text-xl" style={{ color: "var(--foreground)" }}>
              Dlaczego warto?
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
              {content.whySubtitle}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {content.benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.value}
                    className="flex gap-3 rounded-[16px] border p-4"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "oklch(0.65 0.08 264)" }}
                    >
                      <Icon className="h-5 w-5 text-white" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {item.value}
                      </h4>
                      <p className="mt-0.5 text-xs sm:text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div
            className="mt-8 rounded-[18px] border px-5 py-6 text-center"
            style={{
              borderColor: "var(--border)",
              backgroundImage:
                "linear-gradient(135deg, oklch(0.97 0.03 264 / 0.9), oklch(0.96 0.05 290 / 0.45))",
            }}
          >
            <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              Gotowy, aby rozpocząć?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--muted-foreground)" }}>
              {content.ctaText}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to={content.registerPath}
                onClick={() => setOpen(false)}
                className="btn-helpfli-primary inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                {content.registerLabel}
              </Link>
              <button
                type="button"
                onClick={goDetails}
                className="btn-helpfli-secondary inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                Dowiedz się więcej
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
