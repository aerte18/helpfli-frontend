import { useState } from 'react';
import { Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import { apiUrl } from '@/lib/apiUrl';
import { canClientConfirmReceipt, needsClientCompletionReview, isExternalOrderPayment } from '../utils/orderCompletion';
import ClientCompletionOptionsGuide from './ClientCompletionOptionsGuide';

const PROBLEM_PRESETS = [
  { id: 'not_done', label: 'Usługa nie została wykonana', reason: 'Usługa nie została wykonana lub wykonana w niewystarczającym zakresie.' },
  { id: 'partial', label: 'Wykonanie częściowe / niezgodne', reason: 'Wykonanie jest częściowe lub niezgodne z ustaleniami — proszę o rozstrzygnięcie.' },
  { id: 'quality', label: 'Niska jakość / wady', reason: 'Jakość wykonania nie odpowiada ustaleniom — proszę o weryfikację i ewentualny zwrot.' },
  {
    id: 'surcharge',
    label: 'Nieuzasadniona dopłata',
    reason: 'Nie akceptuję dopłaty — kwota lub zakres prac nie były uzgodnione z góry. Proszę o rozstrzygnięcie.',
  },
];

/**
 * Klient po zakończeniu zlecenia przez wykonawcę (płatność Helpfli / escrow):
 * akceptacja, własne uwagi, spór, dopłata.
 */
export default function ClientCompletionReview({
  order,
  orderId,
  protectionTools = false,
  onAcceptCompletion,
  onConfirmReceipt,
  onReportDispute,
  onGoChat,
  isLoadingAccept = false,
  isLoadingConfirmReceipt = false,
  isLoadingReportDispute = false,
  toast,
  getErrorMessage,
  sectionId = 'client-completion-review',
}) {
  const [clientNotes, setClientNotes] = useState('');

  if (!order || order.status !== 'completed') return null;

  const isExternal = isExternalOrderPayment(order);
  if (isExternal) return null;

  const pending = needsClientCompletionReview(order);
  const canConfirm = canClientConfirmReceipt(order);
  const type = order.completionType || 'simple';
  const addonPaid = order.additionalPaymentStatus === 'succeeded';
  const addonProcessing = order.additionalPaymentStatus === 'processing';
  const rejected = order.clientCompletionStatus === 'rejected';
  const hasProviderNotes = type === 'with_notes' && order.completionNotes;

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

  const handleAccept = () => {
    const trimmed = clientNotes.trim();
    onAcceptCompletion?.(trimmed ? { clientNotes: trimmed } : undefined);
  };

  const handleDisputeWithPreset = (reason) => {
    const combined = [reason, clientNotes.trim()].filter(Boolean).join('\n\nUwagi klienta: ');
    onReportDispute?.(combined || reason);
  };

  const baseAmount =
    order.acceptedOffer?.amount || order.acceptedOffer?.price || order.budget || 0;
  const addonAmount = Number(order.additionalAmount || 0);

  const disputePresets =
    type === 'with_payment'
      ? PROBLEM_PRESETS
      : PROBLEM_PRESETS.filter((p) => p.id !== 'surcharge');

  return (
    <CompletionPanel id={sectionId}>
      <h3 className="font-semibold text-emerald-900 mb-2">Wykonawca zakończył zlecenie</h3>
      <p className="text-xs text-slate-600 mb-3">
        Poniżej widzisz podsumowanie od wykonawcy. Ty decydujesz, czy to akceptujesz — dopłatę (jeśli jest)
        opłaca wyłącznie klient. Środki z oferty są w escrow do czasu Twojego potwierdzenia odbioru.
      </p>

      <SummaryBox>
        {type === 'simple' && (
          <p className="text-sm text-emerald-800">Wykonawca: zlecenie wykonane zgodnie z umową (bez dodatkowych uwag).</p>
        )}
        {hasProviderNotes && <CompletionNotes label="Uwagi wykonawcy" notes={order.completionNotes} />}
        {type === 'with_payment' && (
          <AddonSummary order={order} baseAmount={baseAmount} addonAmount={addonAmount} />
        )}
      </SummaryBox>

      {order.clientCompletionNotes && !pending && (
        <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs font-medium text-slate-700 mb-1">Twoje uwagi (zapisane przy akceptacji):</p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{order.clientCompletionNotes}</p>
        </div>
      )}

      {rejected && (
        <p className="mb-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
          Odrzuciłeś to zakończenie — sprawa jest w toku. Potwierdzenie odbioru możliwe po rozstrzygnięciu sporu.
        </p>
      )}

      {pending && !rejected && (
        <>
          <ClientCompletionOptionsGuide order={order} protectionTools={protectionTools} />
          <div className="mb-3">
            <label htmlFor="client-completion-notes" className="block text-xs font-semibold text-slate-800 mb-1">
              Twoje uwagi dla wykonawcy (opcjonalnie)
            </label>
            <textarea
              id="client-completion-notes"
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Np. drobne uwagi przy odbiorze, ustalenia ustne, co wymaga poprawy…"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Przy problemie z realizacją nie akceptuj — użyj „Zgłoś spór” (Helpfli Protect) lub napisz na czacie.
            </p>
          </div>

          <div className="space-y-2">
            {type === 'simple' && (
              <button
                type="button"
                onClick={handleAccept}
                disabled={isLoadingAccept}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoadingAccept ? <LoadingLabel text="Zapisywanie…" /> : 'Akceptuję — wykonanie zgodne z umową'}
              </button>
            )}

            {type === 'with_notes' && (
              <button
                type="button"
                onClick={handleAccept}
                disabled={isLoadingAccept}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoadingAccept ? (
                  <LoadingLabel text="Zapisywanie…" />
                ) : (
                  'Akceptuję zakończenie (wraz z uwagami wykonawcy)'
                )}
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
                  Do zapłaty teraz: <strong>{addonAmount} zł</strong> (tylko dopłata).
                </p>
              </>
            )}

            {protectionTools ? (
              <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-3 space-y-2">
                <p className="text-xs font-semibold text-orange-950 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Problem z realizacją?
                </p>
                <p className="text-[11px] text-orange-900 leading-snug">
                  Nie klikaj akceptacji, jeśli usługa nie została wykonana lub jest niezgodna. Zgłoś spór — środki
                  pozostaną w escrow do rozstrzygnięcia (mediacja, ugoda lub zwrot).
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {disputePresets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isLoadingReportDispute}
                      onClick={() => handleDisputeWithPreset(p.reason)}
                      className="rounded-full border border-orange-300 bg-white px-2.5 py-1 text-[11px] font-medium text-orange-900 hover:bg-orange-100 disabled:opacity-50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleDisputeWithPreset(clientNotes.trim() || 'Spór dotyczący zakończenia zlecenia przez wykonawcę.')}
                  disabled={isLoadingReportDispute}
                  className="w-full rounded-lg border border-orange-400 bg-white px-4 py-2.5 text-sm font-semibold text-orange-900 hover:bg-orange-100 disabled:opacity-50"
                >
                  {isLoadingReportDispute ? (
                    <LoadingLabel text="Zgłaszanie…" />
                  ) : type === 'with_payment' ? (
                    'Nie akceptuję dopłaty — zgłoś spór'
                  ) : (
                    'Zgłoś spór (ochrona Helpfli)'
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                <span className="font-semibold">Bez ochrony Helpfli</span> — zwrotu ani sporu przez platformę nie
                złożysz. Ustal sprawę z wykonawcą na czacie
                {onGoChat && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={onGoChat}
                      className="font-semibold text-amber-950 underline hover:no-underline"
                    >
                      Otwórz czat
                    </button>
                  </>
                )}
                . Nie potwierdzaj odbioru, jeśli usługa nie została wykonana.
              </div>
            )}
          </div>
        </>
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
          {isLoadingConfirmReceipt ? 'Potwierdzanie…' : 'Potwierdź odbiór i zwolnij środki wykonawcy'}
        </button>
      )}
    </CompletionPanel>
  );
}

/** Panel dla klienta przy płatności poza Helpfli — bez escrow / sporu w platformie */
export function ClientExternalCompletionPanel({
  order,
  onConfirmReceipt,
  onGoChat,
  isLoadingConfirmReceipt = false,
  sectionId = 'client-confirm-receipt',
}) {
  const [showProblemHelp, setShowProblemHelp] = useState(false);

  if (!order || order.status !== 'completed') return null;
  if (!isExternalOrderPayment(order)) return null;

  return (
    <div id={sectionId} className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <div>
        <h3 className="font-semibold text-blue-900">Potwierdzenie odbioru (płatność poza Helpfli)</h3>
        <p className="text-sm text-blue-800 mt-1">
          Rozliczenie było poza systemem — Helpfli nie przechowuje Twojej płatności i nie może jej zwrócić.
          Potwierdź odbiór tylko jeśli usługa została wykonana zgodnie z ustaleniami.
        </p>
      </div>

      {order.completionNotes && (
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs font-medium text-slate-700 mb-1">Uwagi wykonawcy:</p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{order.completionNotes}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowProblemHelp((v) => !v)}
        className="text-sm font-medium text-amber-900 hover:text-amber-950 flex items-center gap-1.5"
      >
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {showProblemHelp ? 'Ukryj pomoc' : 'Usługa nie wykonana lub mam problem — co robić?'}
      </button>

      {showProblemHelp && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 space-y-2">
          <p>
            <strong>Nie potwierdzaj odbioru</strong>, jeśli praca nie została wykonana. Skontaktuj się z wykonawcą
            {onGoChat && (
              <>
                {' '}
                (<button type="button" onClick={onGoChat} className="font-semibold underline inline-flex items-center gap-0.5">
                  <MessageSquare className="h-3.5 w-3.5" /> czat
                </button>
                )
              </>
            )}{' '}
            i ustal zwrot lub poprawki bezpośrednio.
          </p>
          <p>
            Przy płatności kartą/przelewem poza Helpfli ewentualny chargeback lub roszczenie prowadzisz poza platformą
            (bank, umowa z wykonawcą).
          </p>
          <p className="text-xs text-amber-800">
            W przyszłości przy rozliczeniu przez Helpfli (escrow) spór i zwrot można zgłosić w aplikacji.
          </p>
        </div>
      )}

      {onConfirmReceipt && (
        <button
          type="button"
          onClick={onConfirmReceipt}
          disabled={isLoadingConfirmReceipt}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoadingConfirmReceipt && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoadingConfirmReceipt ? 'Przetwarzanie…' : 'Potwierdzam — usługa wykonana zgodnie z ustaleniami'}
        </button>
      )}
    </div>
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

function CompletionNotes({ notes, label = 'Uwagi' }) {
  return (
    <div>
      <p className="text-xs font-medium text-emerald-900 mb-1">{label}:</p>
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
