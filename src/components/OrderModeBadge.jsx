/** Etykiety trybu zlecenia na liście providera */
export default function OrderModeBadge({ orderMode, verifiedProvidersOnly, className = "" }) {
  if (orderMode !== "offers_only" && !verifiedProvidersOnly) return null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {orderMode === "offers_only" && (
        <span
          className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded-full text-xs font-medium inline-flex items-center gap-1"
          title="Klient zbiera oferty — rozliczenie za roboty poza Helpfli"
        >
          <span aria-hidden>📋</span>
          <span>Tylko oferty</span>
        </span>
      )}
      {verifiedProvidersOnly && (
        <span
          className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium inline-flex items-center gap-1"
          title="Oferty mogą składać tylko zweryfikowani wykonawcy"
        >
          <span aria-hidden>🛡</span>
          <span>Tylko zweryfikowani</span>
        </span>
      )}
    </span>
  );
}
