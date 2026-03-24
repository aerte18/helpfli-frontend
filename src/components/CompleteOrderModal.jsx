import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CompleteOrderModal({ isOpen, onClose, onComplete, order }) {
  // Sprawdź czy płatność jest zewnętrzna (poza Helpfli)
  const isExternalPayment = order?.paymentMethod === 'external' || order?.paymentPreference === 'external';
  
  const [completionType, setCompletionType] = useState('simple'); // 'simple' | 'with_notes' | 'with_payment'
  const [notes, setNotes] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [paymentReason, setPaymentReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Keyboard: Esc zamyka modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const newErrors = {};
    
    if (completionType === 'with_notes' && !notes.trim()) {
      newErrors.notes = 'Proszę dodać uwagi dotyczące zakończenia zlecenia.';
    }

    if (completionType === 'with_payment') {
      const amount = parseFloat(additionalAmount);
      if (!amount || amount <= 0) {
        newErrors.additionalAmount = 'Proszę podać poprawną kwotę dopłaty.';
      }
      if (!paymentReason.trim()) {
        newErrors.paymentReason = 'Proszę podać uzasadnienie dopłaty.';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    setSubmitting(true);
    try {
      const completionData = {
        completionType,
        ...(completionType === 'with_notes' && { completionNotes: notes }),
        ...(completionType === 'with_payment' && {
          additionalAmount: parseFloat(additionalAmount),
          paymentReason: paymentReason.trim()
        })
      };

      await onComplete(completionData);
      // Reset form
      setCompletionType('simple');
      setNotes('');
      setAdditionalAmount('');
      setPaymentReason('');
    } catch (error) {
      console.error('Błąd zakończenia zlecenia:', error);
      alert(error.message || 'Nie udało się zakończyć zlecenia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Zamknij przy kliknięciu w tło
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-order-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="complete-order-title" className="text-2xl font-bold text-slate-900">Zakończ zlecenie</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informacja o zleceniu */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Informacje o zleceniu</h3>
            <div className="space-y-1 text-sm text-slate-700">
              <div><span className="font-medium">Usługa:</span> {order?.service || 'Nie podano'}</div>
              <div><span className="font-medium">Kwota:</span> {order?.acceptedOffer?.amount || order?.acceptedOffer?.price || order?.budget || 'Nie podano'} zł</div>
            </div>
          </div>

          {/* Wybór typu zakończenia */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Jak chcesz zakończyć zlecenie?</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="completionType"
                  value="simple"
                  checked={completionType === 'simple'}
                  onChange={(e) => setCompletionType(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">✓ Bez uwag</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Zlecenie zostało wykonane zgodnie z umową. Klient otrzyma powiadomienie i będzie mógł potwierdzić odbiór.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="completionType"
                  value="with_notes"
                  checked={completionType === 'with_notes'}
                  onChange={(e) => setCompletionType(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">📝 Z uwagami</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Dodaj uwagi dotyczące wykonania zlecenia (np. zmiany, dodatkowe prace, informacje dla klienta).
                  </div>
                    {completionType === 'with_notes' && (
                    <div className="mt-3">
                      <textarea
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          if (errors.notes) setErrors({ ...errors, notes: undefined });
                        }}
                        placeholder="Wpisz swoje uwagi dotyczące zakończenia zlecenia..."
                        className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          errors.notes 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-slate-300 focus:ring-indigo-500'
                        }`}
                        rows={4}
                        aria-invalid={!!errors.notes}
                        aria-describedby={errors.notes ? "notes-error" : undefined}
                      />
                      {errors.notes && (
                        <p id="notes-error" className="mt-1 text-sm text-red-600" role="alert">
                          {errors.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </label>

              {!isExternalPayment && (
                <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="completionType"
                    value="with_payment"
                    checked={completionType === 'with_payment'}
                    onChange={(e) => setCompletionType(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">💰 Z dopłatą</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Jeśli wykonano dodatkowe prace poza zakresem umowy, możesz poprosić o dopłatę. Klient będzie mógł zaakceptować lub wszcząć spór.
                    </div>
                    {completionType === 'with_payment' && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Kwota dopłaty (zł)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={additionalAmount}
                          onChange={(e) => {
                            setAdditionalAmount(e.target.value);
                            if (errors.additionalAmount) setErrors({ ...errors, additionalAmount: undefined });
                          }}
                          placeholder="0.00"
                          className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            errors.additionalAmount 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-slate-300 focus:ring-indigo-500'
                          }`}
                          aria-invalid={!!errors.additionalAmount}
                          aria-describedby={errors.additionalAmount ? "amount-error" : undefined}
                        />
                        {errors.additionalAmount && (
                          <p id="amount-error" className="mt-1 text-sm text-red-600" role="alert">
                            {errors.additionalAmount}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Uzasadnienie dopłaty
                        </label>
                        <textarea
                          value={paymentReason}
                          onChange={(e) => {
                            setPaymentReason(e.target.value);
                            if (errors.paymentReason) setErrors({ ...errors, paymentReason: undefined });
                          }}
                          placeholder="Opisz dlaczego potrzebna jest dopłata (np. dodatkowe prace, materiały, zmiany w zakresie)..."
                          className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            errors.paymentReason 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-slate-300 focus:ring-indigo-500'
                          }`}
                          rows={3}
                          aria-invalid={!!errors.paymentReason}
                          aria-describedby={errors.paymentReason ? "reason-error" : undefined}
                        />
                        {errors.paymentReason && (
                          <p id="reason-error" className="mt-1 text-sm text-red-600" role="alert">
                            {errors.paymentReason}
                          </p>
                        )}
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                          ⚠️ Klient będzie mógł zaakceptować dopłatę, zapłacić i zakończyć zlecenie, lub wszcząć spór jeśli nie zgadza się z dopłatą.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </label>
              )}
              {isExternalPayment && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ Rozliczenie poza systemem Helpfli - opcja dopłaty nie jest dostępna. Płatność odbywa się bezpośrednio między Tobą a klientem.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Podsumowanie */}
          {completionType === 'with_payment' && additionalAmount && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h4 className="font-semibold text-indigo-900 mb-2">Podsumowanie</h4>
              <div className="space-y-1 text-sm text-indigo-800">
                <div className="flex justify-between">
                  <span>Kwota bazowa:</span>
                  <span className="font-medium">{order?.acceptedOffer?.amount || order?.acceptedOffer?.price || order?.budget || 0} zł</span>
                </div>
                <div className="flex justify-between">
                  <span>Dopłata:</span>
                  <span className="font-medium">+{parseFloat(additionalAmount) || 0} zł</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-200 font-semibold">
                  <span>Łącznie:</span>
                  <span>{(parseFloat(order?.acceptedOffer?.amount || order?.acceptedOffer?.price || order?.budget || 0) + parseFloat(additionalAmount || 0)).toFixed(2)} zł</span>
                </div>
              </div>
            </div>
          )}

          {/* Gwarancja Helpfli */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">🛡️ Gwarancja Helpfli</h4>
            <p className="text-xs text-slate-700">
              Po zakończeniu zlecenia klient otrzyma powiadomienie i będzie mógł potwierdzić odbiór. 
              W przypadku problemów klient może wszcząć spór, który zostanie rozpatrzony przez Helpfli w ciągu 24h.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (completionType === 'with_notes' && !notes.trim()) || (completionType === 'with_payment' && (!additionalAmount || !paymentReason.trim()))}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Zapisywanie...' : 'Zakończ zlecenie'}
          </button>
        </div>
      </div>
    </div>
  );
}

