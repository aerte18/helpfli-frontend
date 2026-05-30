/**
 * Opakowanie przycisku z aria-label / title — bez popupów po tapnięciu.
 * Na mobile etykiety są widoczne w UI (chipy, podpisy), nie w osobnym okienku.
 */
export function MobileHintProvider({ children }) {
  return children;
}

export function useMobileHint() {
  return null;
}

export function MobileTapHint({
  label,
  description = "",
  hintOnly = false,
  as: Component = "button",
  onClick,
  children,
  className = "",
  ...rest
}) {
  const title = description ? `${label}. ${description}` : label;

  const handleClick = (e) => {
    if (!hintOnly) onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (hintOnly && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
    }
  };

  const common = {
    className,
    title,
    "aria-label": label,
    onClick: hintOnly ? undefined : handleClick,
    ...(hintOnly
      ? {
          role: "img",
          "aria-label": label,
        }
      : {}),
    ...rest,
  };

  if (hintOnly) {
    return <Component {...common}>{children}</Component>;
  }

  return <Component {...common}>{children}</Component>;
}
