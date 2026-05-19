import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/apiUrl';
import { canClientConfirmReceipt, needsClientCompletionReview } from '../utils/orderCompletion';

/**
 * Klient po zakończeniu zlecenia przez wykonawcę (płatność Helpfli):
 * akceptacja bez uwag / z uwagami / dopłata (płaci klient) lub spór.
 */
export default function ClientCompletionReview({
  order,
  orderId,
  protectionTools = false,
  onAcceptCompletion,
  onConfirmReceipt,
  onReportDispute,
  isLoadingAccept = false,
  isLoadingConfirmReceipt = false,
  isLoadingReportDispute = false,
  toast,
  getErrorMessage,
  sectionId = 'client-completion-review',
}) {
  if (!order || order.status !== 'completed') return null;

  const isExternal =
    order.paymentMethod === 'external' || order.paymentPreference === 'external';
  if (isExternal) return null;

  const pending = needsClientCompletionReview(order);
  const canConfirm = canClientConfirmReceipt(order);
  const type = order.completionType || 'simple';
  const addonPaid = order.additionalPaymentStatus === 'succeeded';
  const addonProcessing = order.additionalPaymentStatus === 'processing';
  const rejected = order.clientCompletionStatus === 'rejected';

  const payAdditional = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/payments/create-additional-intent'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, methodHint: 'card' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Nie udało się utworzyć płatności dopłaty');
      window.location.href = `/checkout/${encodeURIComponent(orderId)}?pi=${encodeURIComponent(data.paymentIntentId)}&cs=${encodeURIComponent(data.clientSecret)}`;
    } catch (error) {
      console.error('pay additional:', error);
      toast?.({
        title: 'Błąd płatności dopłaty',
        description: getErrorMessage?.(error) || error.message,
        variant: 'error',
      });
    }
  };

  const baseAmount =
    order.acceptedOffer?.amount || order.acceptedOffer?.price || order.budget || 0;
  const addonAmount = Number(order.additionalAmount || 0);

  return (
    <CompletionPanel id={sectionId}>
      <h3 className="font-semibold text-emerald-900 mb-2">Wykonawca zakończył zlecenie</h3>
      <p className="text-xs text-slate-600 mb-3">
        Wykonawca nie płaci w systemie — Ty jako klient decydujesz o akceptacji
        {type === 'with_payment' ? ' i ewentualnej dopłacie' : ''}.
      </p>

      <SummaryBox>
        {type === 'simple' && (
          <p className="text-sm text-emerald-800">Wykonawca: zlecenie wykonane zgodnie z umową (bez uwag).</p>
        )}
        {type === 'with_notes' && order.completionNotes && (
          <CompletionNotes notes={order.completionNotes} />
        )}
        {type === 'with_payment' && (
          <AddonSummary order={order} baseAmount={baseAmount} addonAmount={addonAmount} />
        )}
      </SummaryBox>

      {rejected && (
        <p className="mb-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
          Odrzuciłeś to zakończenie — sprawa jest w toku. Potwierdzenie odbioru po rozstrzygnięciu sporu.
        </p>
      )}

      {pending && !rejected && (
        <div className="space-y-2">
          {type === 'simple' && (
            <button
              type="button"
              onClick={() => onAcceptCompletion?.()}
              disabled={isLoadingAccept}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoadingAccept ? <LoadingLabel text="Zapisywanie…" /> : 'Akceptuję — wykonanie bez uwag'}
            </button>
          )}

          {type === 'with_notes' && (
            <button
              type="button"
              onClick={() => onAcceptCompletion?.()}
              disabled={isLoadingAccept}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoadingAccept ? <LoadingLabel text="Zapisywanie…" /> : 'Akceptuję z uwagami wykonawcy'}
            </button>
          )}

          {type === 'with_payment' && (
            <>
              <button
                type="button"
                onClick={payAdditional}
                disabled={addonProcessing}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Akceptuję dopłatę i przechodzę do płatności
              </button>
              <p className="text-xs text-center text-amber-800">
                Do zapłaty teraz: <strong>{addonAmount} zł</strong> (tylko dopłata; płatność po stronie klienta).
              </p>
            </>
          )}

          {protectionTools && (
            <button
              type="button"
              onClick={onReportDispute}
              disabled={isLoadingReportDispute}
              className="w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-900 hover:bg-orange-100 disabled:opacity-50"
            >
              {isLoadingReportDispute ? (
                <LoadingLabel text="Zgłaszanie…" />
              ) : type === 'with_payment' ? (
                'Nie akceptuję dopłaty — zgłoś spór'
              ) : type === 'with_notes' ? (
                'Nie zgadzam się z uwagami — zgłoś spór'
              ) : (
                'Nie akceptuję zakończenia — zgłoś spór'
              )}
            </button>
          )}
        </div>
      )}

      {!pending && type === 'with_payment' && !addonPaid && !rejected && (
        <PayAddonAgain payAdditional={payAdditional} addonProcessing={addonProcessing} />
      )}

      {addonPaid && !rejected && (
        <p className="mt-3 text-sm font-medium text-emerald-800">✓ Dopłata opłacona.</p>
      )}

      {canConfirm && onConfirmReceipt && (
        <button
          type="button"
          onClick={onConfirmReceipt}
          disabled={isLoadingConfirmReceipt}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isLoadingConfirmReceipt && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoadingConfirmReceipt ? 'Potwierdzanie…' : 'Potwierdź odbiór i domknij rozliczenie'}
        </button>
      )}
    </CompletionPanel>
  );
}

function CompletionPanel({ children, id }) {
  return (
    <div id={id} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
      {children}
    </div>
  );
}

function SummaryBox({ children }) {
  return <div className="p-3 bg-white rounded border border-emerald-200 mb-3">{children}</div>;
}

function CompletionNotes({ notes }) {
  return (
    <div>
      <p className="text-xs font-medium text-emerald-900 mb-1">Uwagi wykonawcy:</p>
      <p className="text-sm text-emerald-800 whitespace-pre-wrap">{notes}</p>
    </div>
  );
}

function AddonSummary({ order, baseAmount, addonAmount }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-amber-900">Wykonawca żąda dopłaty</p>
      {order.paymentReason && (
        <p className="text-amber-800">
          <span className="font-medium">Uzasadnienie: </span>
          {order.paymentReason}
        </p>
      )}
      <AddonTotals baseAmount={baseAmount} addonAmount={addonAmount} />
    </div>
  );
}

function AddonTotals({ baseAmount, addonAmount }) {
  return (
    <div className="pt-2 border-t border-amber-200 space-y-1 text-amber-800">
      <div className="flex justify-between">
        <span>Kwota z oferty (już w escrow):</span>
        <span>{baseAmount} zł</span>
      </div>
      <div className="flex justify-between font-semibold text-amber-900 pt-1 border-t border-amber-200">
        <span>Dopłata do zapłaty:</span>
        <span>{addonAmount} zł</span>
      </div>
    </div>
  );
}

function PayAddonAgain({ payAdditional, addonProcessing }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-amber-900">Opłać dopłatę, aby przejść dalej.</p>
      <button
        type="button"
        onClick={payAdditional}
        disabled={addonProcessing}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {addonProcessing ? 'Płatność w toku…' : 'Opłać dopłatę'}
      </button>
    </div>
  );
}

function LoadingLabel({ text }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </span>
  );
}
