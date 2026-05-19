/** Płatność poza Helpfli — bez escrow i bez akceptacji zakończenia w systemie. */
export function isExternalOrderPayment(order) {
  return order?.paymentMethod === 'external' || order?.paymentPreference === 'external';
}

/** Płatność przez Helpfli (escrow). */
export function isSystemOrderPayment(order) {
  return !isExternalOrderPayment(order);
}

/** Klient musi jeszcze zaakceptować zakończenie zgłoszone przez wykonawcę. */
export function needsClientCompletionReview(order) {
  if (!order || order.status !== 'completed') return false;
  if (isExternalOrderPayment(order)) return false;
  return order.clientCompletionStatus === 'pending';
}

/** Czy klient może potwierdzić odbiór (po akceptacji i ewentualnej dopłacie). */
export function canClientConfirmReceipt(order) {
  if (!order || order.status !== 'completed') return false;
  if (isExternalOrderPayment(order)) return true;
  if (order.clientCompletionStatus === 'rejected') return false;
  if (order.clientCompletionStatus === 'pending') return false;
  if (
    order.completionType === 'with_payment' &&
    order.additionalPaymentStatus !== 'succeeded'
  ) {
    return false;
  }
  return (
    order.clientCompletionStatus === 'accepted' ||
    order.clientCompletionStatus == null
  );
}
