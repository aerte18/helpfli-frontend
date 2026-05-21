import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

export function resolveOfferProviderId(offer) {
  const p = offer?.providerId;
  if (!p) return null;
  if (typeof p === "object") return String(p._id || p.id || "");
  return String(p);
}

function levelLabel(level) {
  if (level === "pro") return { text: "TOP", className: "bg-amber-100 text-amber-800 border-amber-200" };
  if (level === "standard") return { text: "STANDARD", className: "bg-blue-100 text-blue-700 border-blue-200" };
  return { text: "BASIC", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

/**
 * Wykonawca przy karcie oferty — klik w nazwę/avatar → pełny profil /provider/:id
 */
export default function OfferProviderLink({ offer, onQuickPreview, compact = false }) {
  const navigate = useNavigate();
  const providerId = resolveOfferProviderId(offer);
  const meta = offer?.providerMeta || {};
  const name = meta.name || "Wykonawca";
  const lvl = levelLabel(meta.level);

  const goProfile = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (providerId) navigate(`/provider/${providerId}`);
  };

  const avatarSize = compact ? "w-10 h-10" : "w-12 h-12";

  return (
    <div
      className={`flex items-center gap-3 shrink-0 max-w-[220px] sm:max-w-none ${
        compact ? "" : "rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
      }`}
    >
      <button
        type="button"
        onClick={goProfile}
        disabled={!providerId}
        className="shrink-0 rounded-full ring-2 ring-transparent hover:ring-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
        title="Zobacz profil wykonawcy"
      >
        {meta.avatar ? (
          <img
            src={meta.avatar}
            alt=""
            className={`${avatarSize} rounded-full object-cover bg-slate-200`}
          />
        ) : (
          <span
            className={`${avatarSize} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center`}
          >
            <User className="w-5 h-5" aria-hidden />
          </span>
        )}
      </button>
      <div className="min-w-0 text-left">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium mb-0.5">
          Wykonawca
        </p>
        <button
          type="button"
          onClick={goProfile}
          disabled={!providerId}
          className="font-semibold text-slate-900 hover:text-indigo-700 hover:underline text-sm truncate block max-w-[160px] sm:max-w-[200px] text-left disabled:cursor-default"
        >
          {name}
        </button>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          {meta.level && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${lvl.className}`}>
              {lvl.text}
            </span>
          )}
          {meta.ratingAvg != null && meta.ratingAvg > 0 && (
            <span className="text-xs text-slate-600">
              ⭐ {meta.ratingAvg}
              {meta.ratingCount ? ` (${meta.ratingCount})` : ""}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {providerId && (
            <button
              type="button"
              onClick={goProfile}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Profil wykonawcy →
            </button>
          )}
          {onQuickPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickPreview();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
            >
              Szybki podgląd
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
