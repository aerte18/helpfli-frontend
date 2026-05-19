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
    <div className="mt-3 ml-12 max-w-md space-y-2">
      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        Polecani wykonawcy
      </div>
      {providers.slice(0, 3).map((provider, idx) => {
        const id = provider.providerId || provider.id || provider._id;
        const badge = planBadge(provider);
        return (
          <div
            key={id || idx}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-200 transition-colors"
          >
            <div className="flex gap-3">
              <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                {(provider.name || "W").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-sm text-slate-900 truncate">{provider.name}</span>
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {provider.rating > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      {provider.rating.toFixed(1)}
                    </span>
                  )}
                  {provider.distanceKm > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {provider.distanceKm.toFixed(1)} km
                    </span>
                  )}
                  {provider.matchScore != null && (
                    <span className="text-indigo-700 font-semibold">{provider.matchScore}% dopas.</span>
                  )}
                </div>
                {provider.matchLabel && (
                  <p className="mt-1 text-[11px] text-indigo-800 line-clamp-2">{provider.matchLabel}</p>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSelect?.(provider)}
                className="flex-1 min-w-[100px] rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Profil
              </button>
              {onCreateOrder && (
                <button
                  type="button"
                  onClick={() => onCreateOrder(provider)}
                  className="flex-1 min-w-[100px] rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
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
