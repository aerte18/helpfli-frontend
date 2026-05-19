import { Rocket, Pin, ShieldCheck } from "lucide-react";

const DEFAULT_PRICES = { fastTrack: 19, highlight: 9, verifiedOnly: 29 };

/**
 * Opcjonalne płatne boosty przy wystawieniu zlecenia offers_only (krok 2).
 */
export default function OffersOnlyListingAddons({
  fastTrack,
  onFastTrackChange,
  highlight,
  onHighlightChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  prices = DEFAULT_PRICES,
  fastTrackIncludedInPro = false,
}) {
  const total =
    (fastTrack && !fastTrackIncludedInPro ? prices.fastTrack : 0) +
    (highlight ? prices.highlight : 0) +
    (verifiedOnly ? prices.verifiedOnly : 0);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
      <p className="text-sm font-semibold text-amber-950">Zwiększ widoczność (opcjonalnie)</p>
      <p className="text-xs text-amber-900/90">
        Wystawienie zlecenia jest darmowe. Płacisz tylko za dodatki, które wybierzesz.
        Pakiet PRO klienta: Fast Track gratis.
      </p>

      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-white/70 border border-amber-100">
        <input
          type="checkbox"
          className="mt-1"
          checked={fastTrack}
          onChange={(e) => onFastTrackChange(e.target.checked)}
        />
        <div className="flex-1 text-sm">
          <div className="font-medium text-amber-950 flex items-center gap-2">
            <Rocket className="w-4 h-4" aria-hidden />
            Fast Track
            <span className="text-xs font-normal text-amber-800">
              {fastTrackIncludedInPro ? "w pakiecie PRO" : `${prices.fastTrack} zł`}
            </span>
          </div>
          <p className="text-xs text-amber-900/80 mt-0.5">Więcej wykonawców zobaczy zlecenie na liście.</p>
        </div>
      </label>

      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-white/70 border border-amber-100">
        <input
          type="checkbox"
          className="mt-1"
          checked={highlight}
          onChange={(e) => onHighlightChange(e.target.checked)}
        />
        <div className="flex-1 text-sm">
          <div className="font-medium text-amber-950 flex items-center gap-2">
            <Pin className="w-4 h-4" aria-hidden />
            Wyróżnij na liście
            <span className="text-xs font-normal text-amber-800">{prices.highlight} zł</span>
          </div>
          <p className="text-xs text-amber-900/80 mt-0.5">Zlecenie wyżej przez 7 dni.</p>
        </div>
      </label>

      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-white/70 border border-amber-100">
        <input
          type="checkbox"
          className="mt-1"
          checked={verifiedOnly}
          onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
        />
        <div className="flex-1 text-sm">
          <div className="font-medium text-amber-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" aria-hidden />
            Tylko zweryfikowani wykonawcy
            <span className="text-xs font-normal text-amber-800">{prices.verifiedOnly} zł</span>
          </div>
          <p className="text-xs text-amber-900/80 mt-0.5">
            Oferty tylko od wykonawców ze zweryfikowanym profilem.
          </p>
        </div>
      </label>

      {total > 0 && (
        <p className="text-sm font-medium text-amber-950 pt-1 border-t border-amber-200">
          Razem za dodatki: {total} zł (płatność po utworzeniu zlecenia)
        </p>
      )}
    </div>
  );
}

