import { useId } from "react";
import { Link } from "react-router-dom";

function HelpfliPinIcon({ className, gradientId }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
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

export default function Logo({
  className = "h-7 w-7",
  showText = true,
  textColor = "text-white",
  clickable = true,
}) {
  const gradientId = useId();

  const logoContent = (
    <div className="flex items-center gap-2">
      <HelpfliPinIcon className={className} gradientId={gradientId} />
      {showText && (
        <span className={`font-bold text-xl tracking-tight ${textColor}`}>
          <span className="text-blue-600 dark:text-blue-400">Help</span>
          <span className="text-slate-800 dark:text-slate-200">fli</span>
        </span>
      )}
    </div>
  );

  if (!clickable) return logoContent;

  return (
    <Link to="/" className="hover:opacity-80 transition-opacity" aria-label="Home">
      {logoContent}
    </Link>
  );
}