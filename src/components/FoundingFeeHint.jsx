/**
 * Informacja o zniżce prowizji (program Pierwszy wykonawca / PRO) przy podsumowaniu płatności.
 */
export default function FoundingFeeHint({
  foundingCommissionWaived = false,
  foundingExpiresAt = null,
  feeExplanation = null,
  platformFeeBeforeDiscount = null,
  platformFee = null,
  /** Widok klienta przy akceptacji oferty — wyjaśnia, że to benefit wykonawcy */
  forClient = false,
  className = '',
}) {
  if (!feeExplanation && !foundingCommissionWaived && !(platformFeeBeforeDiscount > platformFee)) {
    return null;
  }

  const expiresLabel = foundingExpiresAt
    ? new Date(foundingExpiresAt).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 ${className}`}
    >
      <p className="font-medium">
        {feeExplanation ||
          (foundingCommissionWaived
            ? `Pierwszy wykonawca Helpfli — 0% prowizji${expiresLabel ? ` do ${expiresLabel}` : ''}.`
            : 'Zniżka z programu Pierwszy wykonawca.')}
      </p>
      {forClient && foundingCommissionWaived && (
        <p className="text-xs text-amber-800 mt-1 leading-snug">
          To korzyść dzięki statusowi wykonawcy w programie „Pierwszy wykonawca” — niższa opłata
          platformy przy tym zleceniu, nie bonus na Twoje konto.
        </p>
      )}
      {platformFeeBeforeDiscount > 0 && platformFee === 0 && (
        <p className="text-xs text-amber-800 mt-1">
          Standardowa prowizja {platformFeeBeforeDiscount} zł — w tej transakcji nie pobieramy.
        </p>
      )}
    </div>
  );
}
