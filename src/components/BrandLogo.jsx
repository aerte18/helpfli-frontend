import { useId } from "react";

function HelpfliPinIcon({ className, gradientId }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
      <path
        d="M24 8C18.48 8 14 12.48 14 18C14 25.5 24 38 24 38C24 38 34 25.5 34 18C34 12.48 29.52 8 24 8Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="24" cy="15.5" r="3.5" fill="#2563EB" />
      <path
        d="M24 20C21 20 18.5 22 18.5 24.5V27H29.5V24.5C29.5 22 27 20 24 20Z"
        fill="#2563EB"
      />
    </svg>
  );
}

export default function BrandLogo({
  size = "md", // 'sm' | 'md' | 'lg'
  showTextOn = "sm", // breakpoint: 'xs' | 'sm' | 'md' | 'lg'
  className = "",
}) {
  const gradientId = useId();

  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg" },
    md: { icon: "h-7 w-7", text: "text-xl" },
    lg: { icon: "h-8 w-8", text: "text-2xl" },
  }[size];

  const showTextClass =
    showTextOn === "xs"
      ? ""
      : showTextOn === "sm"
        ? "hidden sm:inline"
        : showTextOn === "md"
          ? "hidden md:inline"
          : "hidden lg:inline";

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Helpfli">
      <HelpfliPinIcon className={sizes.icon} gradientId={gradientId} />
      {showTextOn !== "xs" && (
        <span className={`${showTextClass} font-bold tracking-tight ${sizes.text}`}>
          <span className="text-blue-600 dark:text-blue-400">Help</span>
          <span className="text-slate-800 dark:text-slate-200">fli</span>
        </span>
      )}
      {showTextOn === "xs" && (
        <span className={`font-bold tracking-tight ${sizes.text}`}>
          <span className="text-blue-600 dark:text-blue-400">Help</span>
          <span className="text-slate-800 dark:text-slate-200">fli</span>
        </span>
      )}
    </div>
  );
}