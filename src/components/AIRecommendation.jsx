import { Star } from "lucide-react";
import OriginalLogoIcon from "./icons/OriginalLogoIcon";

export default function AIRecommendation({ providers = [] }) {
  if (!providers.length) return null;
  const top = [...providers]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.distanceKm ?? 999) - (b.distanceKm ?? 999))[0];

  return (
    <div className="max-w-6xl mx-auto px-4 mt-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <OriginalLogoIcon className="w-5 h-5" withBackground={true} />
          <div className="text-sm">
            <span className="font-medium">AI rekomendacja:</span>{" "}
            <span className="font-medium text-slate-800">{top.name}</span>{" "}
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {top.rating?.toFixed(1)}
            </span>{" "}
            • {top.distanceKm?.toFixed(1)} km – pasuje do Twoich filtrów.
          </div>
        </div>
      </div>
    </div>
  );
}