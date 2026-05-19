/** Etykieta trybu zlecenia na liście providera */
export default function OrderModeBadge({ orderMode, className = "" }) {
  if (orderMode !== "offers_only") return null;

  return (
    <span
      className={`px-2 py-0.5 bg-violet-100 text-violet-800 rounded-full text-xs font-medium inline-flex items-center gap-1 ${className}`}
      title="Klient zbiera oferty — rozliczenie za roboty poza Helpfli"
    >
      <span aria-hidden>📋</span>
      <span>Tylko oferty</span>
    </span>
  );
}
