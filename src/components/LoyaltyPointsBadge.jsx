import { useEffect, useState } from "react";

/**
 * Badge z punktami + tooltip.
 * Props:
 * - minToRedeem: minimalny próg użycia punktów (domyślnie 100)
 * - redeemValue: wartość 1 pkt w zł (domyślnie 0.10)
 * - className: dodatkowe klasy
 * - linkTo: dokąd prowadzi kliknięcie (domyślnie "/billing")
 */
export default function LoyaltyPointsBadge({
  minToRedeem = 100,
  redeemValue = 0.10,
  className = "",
  linkTo = "/billing",
}) {
  const [points, setPoints] = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function fetchPoints() {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPoints(data?.loyaltyPoints ?? 0);
    } catch {
      // pomijamy błędy – nie wyświetlamy badge
    }
  }

  useEffect(() => {
    fetchPoints();
    const id = setInterval(fetchPoints, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ukryj dla niezalogowanych
  if (!token || points === null) return null;

  const approxPLN = Math.round(points * redeemValue * 100) / 100;
  const missing = points < minToRedeem ? (minToRedeem - points) : 0;

  const tip = points < minToRedeem
    ? `Masz ${points} pkt (≈ ${approxPLN} zł). Brakuje ${missing} pkt do pierwszej zniżki.`
    : `Masz ${points} pkt (≈ ${approxPLN} zł rabatu). Możesz użyć przy podsumowaniu.`;

  const BadgeContent = (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium " +
        "bg-white/70 backdrop-blur hover:bg-white shadow-sm " + className
      }
      aria-label={tip}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 6.22 16.7l.91-5.32L3.27 7.62l5.34-.78L12 2z" />
      </svg>
      {points} pkt
    </span>
  );

  return (
    <div className="tooltip tooltip-bottom" data-tip={tip}>
      {linkTo ? (
        <a href={linkTo} className="no-underline">{BadgeContent}</a>
      ) : (
        BadgeContent
      )}
    </div>
  );
}


