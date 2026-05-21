import { useId, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

/**
 * Podpowiedź przy hover (desktop) i kliknięciu (mobile).
 * `label` — widoczny tekst obok ikony; `children` — treść dymka.
 */
export default function LimitInfoTip({
  title,
  label = null,
  children,
  align = "left",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const closeTimer = useRef(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const toggle = () => setOpen((v) => !v);

  const alignClass =
    align === "right"
      ? "right-0"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "left-0";

  return (
    <span
      className={`relative inline-flex items-center gap-1 ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {label != null && label !== "" ? <span>{label}</span> : null}
      <button
        type="button"
        className="inline-flex shrink-0 rounded-full p-0.5 text-amber-700/80 hover:text-amber-900 hover:bg-amber-100/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        onFocus={show}
        onBlur={hide}
        title={title ? `Szczegóły: ${title}` : "Szczegóły"}
      >
        <HelpCircle className="w-3.5 h-3.5" aria-hidden />
      </button>
      {open && children && (
        <div
          id={id}
          role="tooltip"
          className={`absolute z-50 top-full mt-2 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs text-slate-700 shadow-lg ${alignClass}`}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {title && <p className="font-semibold text-slate-900 mb-1.5">{title}</p>}
          <div className="space-y-1 leading-relaxed">{children}</div>
        </div>
      )}
    </span>
  );
}
