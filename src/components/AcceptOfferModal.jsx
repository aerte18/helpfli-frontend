import { useState, useEffect } from 'react';
import FoundingFeeHint from './FoundingFeeHint';
import ModalDialog from './ui/ModalDialog';
import { apiUrl } from '@/lib/apiUrl';

export default function AcceptOfferModal({ 
  isOpen, 
  onClose, 
  offer, 
  order = null, // Opcjonalnie: dane zlecenia (dla teleporad)
  onAccept, 
  isAccepting = false,
  loyaltyTier = null,        // np. { name, discount, prioritySupport }
  isFastTrack = false,       // czy zlecenie jest Fast-Track
  disableSystemPayment = false,
  systemDisabledReason = ""
}) {
  // Metoda płatności jest już wybrana przez klienta przy tworzeniu zlecenia
  const paymentPreference = order?.paymentPreference || 'system';
  const systemPaymentUnavailable =
    disableSystemPayment || offer?.providerMeta?.systemPaymentAvailable === false;
  const [paymentMethod, setPaymentMethod] = useState(''); // Metoda płatności (system | external)
  const [includeGuarantee, setIncludeGuarantee] = useState(paymentPreference === 'system'); // Czy doliczyć gwarancję
  const [requestInvoice, setRequestInvoice] = useState(!!order?.requestInvoice); // Chcę fakturę VAT
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    if (isOpen) {
      let initialPaymentMethod = paymentPreference === 'both' ? '' : paymentPreference;
      if (initialPaymentMethod === 'system' && systemPaymentUnavailable) {
        initialPaymentMethod = 'external';
      }
      setPaymentMethod(initialPaymentMethod);
      setIncludeGuarantee(initialPaymentMethod === 'system');
      setRequestInvoice(!!order?.requestInvoice);
      setQuote(null);
      setQuoteError('');
    }
  }, [isOpen, order?.requestInvoice, paymentPreference, systemPaymentUnavailable]);

  useEffect(() => {
    if (!isOpen || !offer?._id || !paymentMethod) {
      setQuote(null);
      setQuoteLoading(false);
      return undefined;
    }

    if (offer.__demo) {
      const demoBase = Number(offer.amount ?? offer.price ?? 0);
      const demoPlatformFee = Math.round(demoBase * 0.05);
      const demoGuaranteeFee = paymentMethod === 'system' && includeGuarantee
        ? Math.round(demoBase * 0.07)
        : 0;
      setQuote({
        paymentMethod,
        paymentDueNow: paymentMethod === 'external' ? Math.max(demoPlatformFee, 2) : demoBase + demoPlatformFee + demoGuaranteeFee,
        pricing: {
          baseAmount: demoBase,
          platformFee: demoPlatformFee,
          platformFeeBeforeDiscount: demoPlatformFee,
          commissionChargedPln: paymentMethod === 'external' ? Math.max(demoPlatformFee, 2) : 0,
          guaranteeFee: demoGuaranteeFee,
          total: demoBase + demoPlatformFee + demoGuaranteeFee,
          includeGuarantee: demoGuaranteeFee > 0,
        },
        feeMeta: { platformFeePercent: 5, platformFeeBeforeDiscount: demoPlatformFee },
      });
      setQuoteError('');
      setQuoteLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const loadQuote = async () => {
      setQuoteLoading(true);
      setQuoteError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiUrl(`/api/offers/${offer._id}/acceptance-quote`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            paymentMethod,
            includeGuarantee: paymentMethod === 'system' && includeGuarantee,
          }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Nie udało się obliczyć ceny');
        setQuote(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setQuote(null);
          setQuoteError(error.message || 'Nie udało się obliczyć ceny');
        }
      } finally {
        if (!controller.signal.aborted) setQuoteLoading(false);
      }
    };
    loadQuote();
    return () => controller.abort();
  }, [isOpen, offer?._id, offer?.__demo, paymentMethod, includeGuarantee]);
  
  // Teleporada - pola
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [consultationType, setConsultationType] = useState('video'); // 'video' | 'phone'
  const [consultationDuration, setConsultationDuration] = useState(30); // 30, 60, 90 minut

  if (!isOpen || !offer) return null;
  
  // Sprawdź czy to teleporada
  const isTeleconsultation = order && (
    (order.service && (
      order.service.toLowerCase().includes('teleporada') || 
      order.service.toLowerCase().includes('teleconsultation') ||
      order.service.toLowerCase().includes('konsultacja')
    )) ||
    order.isTeleconsultation
  );

  // Metoda płatności jest już ustalona przez klienta przy tworzeniu zlecenia
  // Nie ma potrzeby zmiany - klient wybrał już "Helpfli Protect" lub "Płatność poza systemem"

  // Kwoty zawsze pochodzą z serwerowego quote; frontend nie nalicza prowizji samodzielnie.
  const pricing = quote?.pricing || null;
  const baseAmount = Number(pricing?.baseAmount ?? offer.amount ?? offer.price ?? 0);
  const effectiveIncludeGuarantee = Boolean(pricing?.includeGuarantee);
  const guaranteeFee = Number(pricing?.guaranteeFee || 0);
  const platformFee = Number(pricing?.platformFee || 0);
  const basePlatformFee = Number(
    quote?.feeMeta?.platformFeeBeforeDiscount ?? pricing?.platformFeeBeforeDiscount ?? platformFee
  );
  const platformFeePercent = Number(quote?.feeMeta?.platformFeePercent || 0);
  const providerMeta = offer?.providerMeta || {};
  const foundingWaived = quote?.feeMeta?.foundingDiscountApplied === true;
  const tierDiscountAmount = foundingWaived ? 0 : Math.max(0, basePlatformFee - platformFee);
  const displayFeePercent = baseAmount > 0 && basePlatformFee > 0
    ? Math.round((basePlatformFee / baseAmount) * 100)
    : platformFeePercent;
  const platformFeeBeforeFounding = basePlatformFee;
  const commissionChargedPln = Number(pricing?.commissionChargedPln || 0);
  const totalAmount = Number(pricing?.total || 0);
  const payableNow = Number(quote?.paymentDueNow ?? 0);

  const handleAccept = () => {
    if (!paymentMethod || !quote || quoteLoading) return;
    // Walidacja dla teleporad
    if (isTeleconsultation) {
      if (!scheduledDate || !scheduledTime) {
        alert('Wybierz termin konsultacji');
        return;
      }
    }
    
    const acceptData = {
      offerId: offer._id,
      paymentMethod,
      includeGuarantee: effectiveIncludeGuarantee,
      requestInvoice,
      totalAmount: payableNow,
      breakdown: {
        ...pricing,
        payableNow,
      },
    };
    
    // Dodaj dane teleporady jeśli to teleporada
    if (isTeleconsultation) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      acceptData.scheduledDateTime = scheduledDateTime.toISOString();
      acceptData.consultationType = consultationType;
      acceptData.consultationDuration = consultationDuration;
    }
    
    onAccept(acceptData);
  };

  return (
    <ModalDialog
      open={isOpen}
      onClose={onClose}
      titleId="accept-offer-title"
      panelClassName="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
    >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="accept-offer-title" className="text-xl font-semibold">Akceptuj ofertę</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Zamknij"
            >
              ×
            </button>
          </div>

          {/* Oferta */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Cena wykonawcy:</span>
              <span className="text-lg font-semibold">{baseAmount} zł</span>
            </div>
            {offer.message && (
              <p className="text-sm text-gray-600 mt-2">"{offer.message}"</p>
            )}
          </div>

          {/* Metoda płatności */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Metoda płatności</h3>
            {order?.paymentPreference === 'system' && (
              <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
                <div className="font-medium">🛡️ Preferencja klienta: Helpfli Protect</div>
                <div>Klient wybrał płatność przez system Helpfli z gwarancją.</div>
              </div>
            )}
            {order?.paymentPreference === 'external' && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <div className="font-medium">💳 Preferencja klienta: Płatność poza systemem</div>
                <div>Klient wybrał rozliczenie bezpośrednio z wykonawcą (bez gwarancji Helpfli).</div>
              </div>
            )}
            {order?.paymentPreference === 'both' && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <div className="font-medium">Wybierz sposób rozliczenia</div>
                <div>Przed akceptacją zdecyduj, czy chcesz ochronę Helpfli, czy płatność bezpośrednią.</div>
              </div>
            )}
            <div className="space-y-3">
              <label className={`flex flex-col gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                systemPaymentUnavailable ? "opacity-60 cursor-not-allowed" : ""
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="system"
                    checked={paymentMethod === 'system'}
                    onChange={(e) => !systemPaymentUnavailable && setPaymentMethod(e.target.value)}
                    className="mt-1"
                    disabled={systemPaymentUnavailable}
                  />
                  <div className="flex-1">
                    <div className="font-medium">Płatność przez Helpfli</div>
                    <div className="text-sm text-gray-600">
                      Bezpieczna płatność z Gwarancją Helpfli
                    </div>
                    {systemPaymentUnavailable && (
                      <div className="mt-1 text-xs text-amber-700">
                        {systemDisabledReason || providerMeta.systemPaymentUnavailableReason || "Ten wykonawca nie ma jeszcze aktywowanych wypłat Stripe. Wybierz płatność poza systemem."}
                      </div>
                    )}
                  </div>
                </div>

                {paymentMethod === 'system' && (
                  <label className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeGuarantee}
                      onChange={(e) => setIncludeGuarantee(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        🛡️ Gwarancja Helpfli
                        <span className="text-sm text-gray-500">(+{guaranteeFee} zł)</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Ochrona transakcji, wsparcie w sporach, możliwość zwrotu
                      </div>
                    </div>
                  </label>
                )}
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="external"
                  checked={paymentMethod === 'external'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Płatność poza systemem</div>
                  <div className="text-sm text-gray-600">
                    Bezpośrednio z wykonawcą (bez gwarancji)
                  </div>
                  {order?.paymentPreference === 'system' && systemPaymentUnavailable && (
                    <div className="mt-1 text-xs text-amber-700">Możesz bezpiecznie zmienić wcześniejszą preferencję na rozliczenie bezpośrednie.</div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Opcja faktury VAT */}
          {paymentMethod === 'system' && (
            <div className="mb-6">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={requestInvoice}
                  onChange={(e) => setRequestInvoice(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    📄 Chcę fakturę VAT
                  </div>
                  <div className="text-sm text-gray-600">
                    Faktura od wykonawcy — załączysz PDF po rozliczeniu zlecenia opłaconego przez Helpfli
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Podsumowanie kosztów */}
          {!paymentMethod && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Wybierz sposób płatności, aby zobaczyć ostateczną cenę.
            </div>
          )}
          {quoteLoading && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600" role="status">
              Obliczamy ostateczną cenę…
            </div>
          )}
          {quoteError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {quoteError}
            </div>
          )}
          {quote && !quoteLoading && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-3">Podsumowanie kosztów</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cena wykonawcy:</span>
                <span>{baseAmount} zł</span>
              </div>
              {paymentMethod === 'external' && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Rozliczenie z wykonawcą:</span>
                  <span>bezpośrednio poza Helpfli</span>
                </div>
              )}
              {basePlatformFee > 0 && (
                <div className="flex justify-between">
                  <span>Prowizja platformy{displayFeePercent > 0 ? ` (${displayFeePercent}%)` : ''}:</span>
                  <span className={foundingWaived ? 'line-through text-slate-400' : ''}>
                    +{basePlatformFee} zł
                  </span>
                </div>
              )}
              {foundingWaived && basePlatformFee > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Prowizja (Pierwszy wykonawca):</span>
                  <span>0 zł</span>
                </div>
              )}
              {tierDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Rabat platformy:</span>
                  <span>-{tierDiscountAmount} zł</span>
                </div>
              )}
              {guaranteeFee > 0 && (
                <div className="flex justify-between">
                  <span>Gwarancja Helpfli (7%):</span>
                  <span>+{guaranteeFee} zł</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>{paymentMethod === 'external' ? 'Do zapłaty teraz (prowizja):' : 'Do zapłaty:'}</span>
                <span>{payableNow} zł</span>
              </div>
              {paymentMethod === 'external' && platformFee > 0 && commissionChargedPln > platformFee && (
                <p className="text-xs text-slate-600 mt-2 leading-snug">
                  Prowizja z oferty to {platformFee} zł, ale płatność online ma minimum 2 zł (wymaganie operatora płatności) — pobierzemy {commissionChargedPln} zł.
                </p>
              )}
            </div>
            {(foundingWaived || providerMeta.foundingProviderActive) && (
              <FoundingFeeHint
                className="mt-3"
                forClient
                foundingCommissionWaived={foundingWaived}
                foundingExpiresAt={providerMeta.foundingExpiresAt}
                platformFeeBeforeDiscount={platformFeeBeforeFounding}
                platformFee={platformFee}
              />
            )}
            </div>
          )}

          {/* Informacja o poziomie lojalności */}
          {loyaltyTier && tierDiscountAmount > 0 && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              <div className="font-medium">
                {loyaltyTier.icon || '💎'} Twój poziom: {loyaltyTier.name}
              </div>
              <div>Rabat serwerowy został uwzględniony w podsumowaniu.</div>
            </div>
          )}

          {/* Teleporada - wybór terminu i typu połączenia */}
          {isTeleconsultation && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                📞 Teleporada - Ustawienia konsultacji
              </h3>
              
              <div className="space-y-4">
                {/* Wybór terminu */}
                <div>
                  <label className="block text-sm font-medium mb-2">Termin konsultacji *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                {/* Typ połączenia */}
                <div>
                  <label className="block text-sm font-medium mb-2">Typ połączenia *</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input
                        type="radio"
                        name="consultationType"
                        value="video"
                        checked={consultationType === 'video'}
                        onChange={(e) => setConsultationType(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">📹 Połączenie video przez stronę</div>
                        <div className="text-sm text-gray-600">Konsultacja przez kamerę w przeglądarce</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input
                        type="radio"
                        name="consultationType"
                        value="phone"
                        checked={consultationType === 'phone'}
                        onChange={(e) => setConsultationType(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">📞 Połączenie telefoniczne</div>
                        <div className="text-sm text-gray-600">Konsultacja przez telefon (poza stroną)</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Czas trwania */}
                <div>
                  <label className="block text-sm font-medium mb-2">Czas trwania konsultacji</label>
                  <select
                    value={consultationDuration}
                    onChange={(e) => setConsultationDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value={30}>30 minut</option>
                    <option value={60}>60 minut (1 godzina)</option>
                    <option value={90}>90 minut (1.5 godziny)</option>
                    <option value={120}>120 minut (2 godziny)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Informacja o pilnym zleceniu */}
          {isFastTrack && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <div className="font-medium">⚡ Pilne zlecenie</div>
              <div>Zlecenie ma priorytet w systemie – powiadomimy najlepszych wykonawców jako pierwszych. Zalecamy doliczyć 10% więcej za szybką reakcję.</div>
            </div>
          )}

          {/* Informacje o gwarancji */}
          {paymentMethod === 'system' && includeGuarantee && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-green-600">🛡️</span>
                <div className="text-sm text-green-800">
                  <div className="font-medium">Gwarancja Helpfli aktywna</div>
                  <div>Twoja transakcja będzie chroniona przez nasz system</div>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'external' && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">⚠️</span>
                <div className="text-sm text-amber-800">
                  <div className="font-medium">Płatność poza systemem</div>
                  <div>Brak gwarancji Helpfli - rozliczasz się bezpośrednio z wykonawcą</div>
                </div>
              </div>
            </div>
          )}

          {/* Przyciski */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isAccepting}
            >
              Anuluj
            </button>
            <button
              onClick={handleAccept}
              disabled={isAccepting || quoteLoading || !quote || !paymentMethod}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isAccepting
                ? 'Akceptuję...'
                : !paymentMethod
                  ? 'Wybierz płatność'
                  : quoteLoading
                    ? 'Obliczam cenę...'
                : paymentMethod === 'external'
                  ? payableNow > 0
                    ? `Akceptuj i opłać prowizję (${payableNow} zł)`
                    : 'Akceptuj ofertę'
                  : `Akceptuj i zapłać teraz (${payableNow} zł)`}
            </button>
          </div>
        </div>
    </ModalDialog>
  );
}





