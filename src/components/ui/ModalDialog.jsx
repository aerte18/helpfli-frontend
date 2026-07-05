import { useEffect } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

/**
 * Accessible modal shell: dialog semantics, focus trap, Escape, scroll lock.
 */
export default function ModalDialog({
  open,
  onClose,
  titleId,
  describedById,
  overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",
  panelClassName = "",
  children,
  closeOnBackdrop = true,
}) {
  const panelRef = useFocusTrap(open);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      {...(titleId ? { "aria-labelledby": titleId } : {})}
      {...(describedById ? { "aria-describedby": describedById } : {})}
      className={overlayClassName}
      onClick={
        closeOnBackdrop
          ? (e) => {
              if (e.target === e.currentTarget) onClose?.();
            }
          : undefined
      }
    >
      <div ref={panelRef} className={panelClassName}>
        {children}
      </div>
    </div>
  );
}
