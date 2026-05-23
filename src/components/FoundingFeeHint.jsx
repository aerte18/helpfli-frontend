/**
 * Krótka informacja o zniżce prowizji (Founding / PRO) przy podsumowaniu płatności.
 */
export default function FoundingFeeHint({
  foundingCommissionWaived = false,
  foundingExpiresAt = null,
  feeExplanation = null,
  platformFeeBeforeDiscount = null,
  platformFee = null,
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
            : 'Zastosowano zniżkę programu Founding Provider.')}
      </p>
      {platformFeeBeforeDiscount > 0 && platformFee === 0 && (
        <p className="text-xs text-amber-800 mt-1">
          Standardowa prowizja {platformFeeBeforeDiscount} zł — w tej transakcji nie pobieramy.
        </p>
      )}
    </div>
  );
}
