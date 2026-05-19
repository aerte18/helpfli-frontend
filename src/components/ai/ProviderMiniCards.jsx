import React from "react";
import { Star, MapPin } from "lucide-react";

function planBadge(provider) {
  const rawLevel = String(provider.level || provider.providerTier || "").toLowerCase();
  if (provider.isPro || rawLevel.includes("pro") || rawLevel.includes("premium")) {
    return { label: "PRO", className: "bg-purple-100 text-purple-700 border-purple-200" };
  }
  if (provider.verified) {
    return { label: "Zweryfikowany", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
  return null;
}

export default function ProviderMiniCards({ providers = [], onSelect, onCreateOrder }) {
  if (!providers?.length) return null;

  return (
    <div className="mt-2 ml-11 max-w-lg space-y-1.5">
      <p className="text-[11px] text-slate-500">Wykonawcy w okolicy</p>
      {providers.slice(0, 3).map((provider, idx) => {
        const id = provider.providerId || provider.id || provider._id;
        const badge = planBadge(provider);
        return (
          <div
            key={id || idx}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-xs hover:border-indigo-200 transition-colors"
          >
            <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-slate-900 truncate">{provider.name}</span>
              {badge && (
                <span className={`text-[9px] font-bold px-1 py-0 rounded border ${badge.className}`}>
                  {badge.label}
                </span>
              )}
              {provider.rating > 0 && (
                <span className="inline-flex items-center gap-0.5 text-slate-500">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  {provider.rating.toFixed(1)}
                </span>
              )}
              {provider.distanceKm > 0 && (
                <span className="inline-flex items-center gap-0.5 text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {provider.distanceKm.toFixed(1)} km
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onSelect?.(provider)}
                className="text-indigo-600 font-medium hover:underline"
              >
                Profil
              </button>
              {onCreateOrder && (
                <button
                  type="button"
                  onClick={() => onCreateOrder(provider)}
                  className="text-slate-600 hover:text-indigo-700 hover:underline"
                >
                  Zlecenie
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
