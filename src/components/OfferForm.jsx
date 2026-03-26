import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useRef, useState } from "react";
import { getOfferHint, postOffer } from "../api/offers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./toast/ToastProvider";
import { useTelemetry } from "../hooks/useTelemetry";
import { Send, Sparkles, X, Info, ChevronDown, ChevronUp, ClipboardList, Wallet, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "../utils/errorMessages";

const OFFER_FORM_AI_KEY = "offerForm_showAi";

function useAuthToken() {
  try { return localStorage.getItem("token") || ""; } catch { return ""; }
}

function Badge({ type }) {
  if (!type) return null;
  const map = {
    optimal: { text: "Optymalna oferta", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    fair:    { text: "Uczciwa oferta",   cls: "bg-sky-100 text-sky-800 border-sky-200" },
    low:     { text: "Niska cena",       cls: "bg-amber-100 text-amber-800 border-amber-200" },
    high:    { text: "Wysoka cena",      cls: "bg-rose-100 text-rose-800 border-rose-200" },
  };
  const x = map[type] || map.fair;
  return <span className={`text-xs px-2 py-1 rounded-full border ${x.cls}`}>{x.text}</span>;
}

export default function OfferForm({
  orderId,
  service,
  city,
  onSent,
  isPriority = false,
  priorityDateTime = null,
  layout = "default",
  hideBandsError = false,
  onBandsErrorChange,
  orderPaymentPreference = null, // Preferencja płatności z zlecenia klienta
}) {
  const token = useAuthToken();
  const { user } = useAuth();
  const [bands, setBands] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // Metoda płatności: 'system' | 'external' | ''
  const [priceIncludes, setPriceIncludes] = useState([]); // Co zawiera cena: ['materials', 'labor', 'transport', 'other']
  const [priceIncludesOther, setPriceIncludesOther] = useState(""); // Inne - tekst
  const [isFinalPrice, setIsFinalPrice] = useState(true); // Czy cena jest ostateczna
  const [contactMethod, setContactMethod] = useState(""); // Sposób kontaktu: 'call_before', 'chat_only', 'no_contact'
  const [boost, setBoost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bandsError, setBandsError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // Błędy dla poszczególnych pól
  const [pricingAdvice, setPricingAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [orderDescription, setOrderDescription] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(() => {
    try { return localStorage.getItem(OFFER_FORM_AI_KEY) !== "false"; } catch { return true; }
  });
  const [aiSuggestionsCollapsed, setAiSuggestionsCollapsed] = useState(false);
  const { push: toast } = useToast();
  const { trackOfferFormStart, trackOfferStepView, trackOfferFormSubmit } = useTelemetry();
  const offerStepTracked = useRef({ 1: false, 2: false, 3: false });

  const setShowAiSuggestionsAndPersist = (v) => {
    setShowAiSuggestions(v);
    try { localStorage.setItem(OFFER_FORM_AI_KEY, v ? "true" : "false"); } catch (_) {}
  };

  // Provider nie może wybrać metody płatności - klient już wybrał przy tworzeniu zlecenia
  const canChoosePaymentMethod = false;

  const reloadBands = async () => {
    setLoading(true);
    setBandsError("");
    try {
      const b = await getOfferHint({ token, orderId });
      setBands(b);
      setAmount(String(b?.stats?.adjusted?.med ?? ""));
    } catch (e) {
      setBandsError(e.message || "Błąd pobierania widełek");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) reloadBands();
  }, [orderId, token]);

  // Pobierz sugestie AI dla zlecenia
  useEffect(() => {
    async function loadAiSuggestions() {
      if (!orderId || !token) return;
      
      setLoadingAiSuggestions(true);
      try {
        const API = import.meta.env.VITE_API_URL || '';
        const res = await fetch(apiUrl(`/api/offers/analyze-order?orderId=${orderId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAiSuggestions(data);
          // Automatycznie ustaw sugerowaną cenę jeśli pole jest puste
          if (!amount && data.pricing?.suggested) {
            setAmount(String(Math.round(data.pricing.suggested)));
          }
        }
      } catch (e) {
        console.error('Failed to load AI suggestions:', e);
      } finally {
        setLoadingAiSuggestions(false);
      }
    }
    if (orderId && token && user?.role === 'provider') {
      loadAiSuggestions();
    }
  }, [orderId, token, user]);

  useEffect(() => {
    onBandsErrorChange?.(bandsError || "");
  }, [bandsError, onBandsErrorChange]);

  // Analityka: start formularza oferty
  useEffect(() => {
    if (orderId && user?.role === 'provider') {
      trackOfferFormStart(orderId);
      if (!offerStepTracked.current[1]) {
        offerStepTracked.current[1] = true;
        trackOfferStepView(1, orderId);
      }
    }
  }, [orderId, user?.role]);


  // Funkcje pomocnicze do boostów
  const getBoostPriceText = () => {
    if (!user) return "(+5 zł)";
    
    // Sprawdź pakiet providera
    const isPro = user.providerTier === 'pro' || user.providerLevel === 'pro' || user.level === 'pro';
    const isStandard = user.providerTier === 'standard' || user.providerLevel === 'standard' || user.level === 'standard';
    
    if (isPro) {
      return "(GRATIS)";
    } else if (isStandard) {
      return "(+5 zł)";
    } else {
      return "(+5 zł)";
    }
  };

  const getBoostInfoText = () => {
    if (!user) return null;
    
    const isPro = user.providerTier === 'pro' || user.providerLevel === 'pro' || user.level === 'pro';
    const isStandard = user.providerTier === 'standard' || user.providerLevel === 'standard' || user.level === 'standard';
    
    if (isPro) {
      return "✅ W pakiecie PRO - boost bezpłatny";
    } else if (isStandard) {
      return "💳 W pakiecie STANDARD - boost płatny (5 zł)";
    } else {
      return "💳 W pakiecie FREE - boost płatny (5 zł)";
    }
  };

  const position = useMemo(() => {
    if (!bands || !amount) return null;
    const a = Number(amount);
    const adj = bands.stats.adjusted;
    const within = (x, lo, hi) => x >= lo && x <= hi;

    if (a < adj.min) return { pos: "below_min", badge: "low" };
    if (a >= adj.min && a < (adj.p25 ?? Math.round(adj.med*0.85))) return { pos: "low", badge: "low" };
    if (within(a, Math.round(adj.med*0.95), Math.round(adj.med*1.05))) return { pos: "optimal", badge: "optimal" };
    if (within(a, (adj.p25 ?? Math.round(adj.med*0.9)), (adj.p75 ?? Math.round(adj.med*1.1)))) return { pos: "fair", badge: "fair" };
    if (a > (adj.p75 ?? Math.round(adj.med*1.15)) && a <= adj.max) return { pos: "high", badge: "high" };
    if (a > adj.max) return { pos: "above_max", badge: "high" };
    return { pos: "fair", badge: "fair" };
  }, [bands, amount]);

  const priceHint = useMemo(() => {
    const adj = bands?.stats?.adjusted;
    if (!adj) return null;
    const lo = adj.p25 ?? Math.round(adj.med * 0.9);
    const hi = adj.p75 ?? Math.round(adj.med * 1.1);
    return {
      suggestedLo: lo,
      suggestedHi: hi,
      median: adj.med,
    };
  }, [bands]);

  // Walidacja formularza
  const validateForm = () => {
    const errors = {};
    
    // Walidacja kwoty
    if (!amount || amount.trim() === "") {
      errors.amount = "Kwota jest wymagana";
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        errors.amount = "Kwota musi być liczbą";
      } else if (amountNum <= 0) {
        errors.amount = "Kwota musi być większa od 0";
      } else if (amountNum > 1000000) {
        errors.amount = "Kwota nie może przekraczać 1 000 000 zł";
      }
    }
    
    // Walidacja wiadomości (opcjonalna, ale jeśli podana to min długość)
    if (message && message.trim().length > 0) {
      if (message.trim().length < 10) {
        errors.message = "Wiadomość musi mieć co najmniej 10 znaków";
      } else if (message.length > 1000) {
        errors.message = "Wiadomość nie może przekraczać 1000 znaków";
      }
    }
    
    // Walidacja terminu realizacji
    if (!completionDate) {
      errors.completionDate = "Wybierz termin realizacji";
    } else {
      const selectedDate = new Date(completionDate);
      const now = new Date();
      if (selectedDate < now) {
        errors.completionDate = "Termin realizacji nie może być w przeszłości";
      }
    }
    
    return errors;
  };

  async function onSubmit() {
    // Walidacja przed wysłaniem
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Proszę poprawić błędy w formularzu");
      // Przewiń do pierwszego błędu
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(`offer-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }
    
    setSending(true);
    setFormError("");
    setFieldErrors({});
    try {
      // Użyj terminu wybranego przez providera (może być inny niż termin klienta)
      const finalCompletionDate = completionDate;
      
      // Przygotuj informacje o cenie i kontakcie
      const priceInfo = {
        includes: priceIncludes,
        includesOther: priceIncludesOther || undefined,
        isFinal: isFinalPrice
      };
      
      const offer = await postOffer({
        token,
        payload: { 
          orderId, 
          amount: Number(amount), 
          message, 
          completionDate: finalCompletionDate,
          priceInfo, // Informacje o cenie
          contactMethod, // Sposób kontaktu
          // paymentMethod nie jest już potrzebne - klient już wybrał przy tworzeniu zlecenia
          boost 
        }
      });
      trackOfferFormSubmit(orderId, Number(amount));
      onSent?.(offer.offer);
      if (offer.pricingAdvice) {
        setPricingAdvice(offer.pricingAdvice);
      }
      setMessage("");
      setCompletionDate("");
      setBoost(false);
    } catch (e) {
      // Błędy limitu są obsługiwane przez backend i wysyłane jako powiadomienia
      setFormError(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Krok 1/3 - Asystent AI (opcjonalny, zwijalny) */}
      {orderId && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Krok 1/3 — Sprawdź sugestie AI (opcjonalne)</span>
            {!showAiSuggestions && (
              <button
                type="button"
                onClick={() => setShowAiSuggestionsAndPersist(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Pokaż sugestie AI
              </button>
            )}
          </div>
          {showAiSuggestions && (
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-900">Asystent AI</h3>
                <p className="text-xs text-indigo-700">Analiza zlecenia i sugestie</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAiSuggestionsCollapsed((c) => !c)}
                className="text-indigo-400 hover:text-indigo-600 p-1"
                aria-label={aiSuggestionsCollapsed ? "Rozwiń" : "Zwiń"}
              >
                {aiSuggestionsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setShowAiSuggestionsAndPersist(false)}
                className="text-indigo-400 hover:text-indigo-600 text-sm p-1"
                aria-label="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {!aiSuggestionsCollapsed && (
          loadingAiSuggestions ? (
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span>Analizuję zlecenie...</span>
            </div>
          ) : aiSuggestions ? (
            <div className="space-y-3 text-sm">
              {/* Podsumowanie zlecenia */}
              <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                <div className="font-medium text-indigo-900 mb-2 flex items-center gap-2"><ClipboardList className="w-4 h-4 shrink-0" aria-hidden /> Co klient podał:</div>
                <div className="space-y-1 text-indigo-800 text-xs">
                  <div><strong>Usługa:</strong> {aiSuggestions.orderSummary?.service || 'Nie podano'}</div>
                  <div><strong>Lokalizacja:</strong> {aiSuggestions.orderSummary?.location || 'Nie podano'}</div>
                  {aiSuggestions.orderSummary?.budget && (
                    <div><strong>Budżet:</strong> {typeof aiSuggestions.orderSummary.budget === 'object' 
                      ? `${aiSuggestions.orderSummary.budget.min || '?'}–${aiSuggestions.orderSummary.budget.max || '?'} zł`
                      : `${aiSuggestions.orderSummary.budget} zł`}</div>
                  )}
                  <div><strong>Pilność:</strong> {
                    aiSuggestions.orderSummary?.urgency === 'now' ? '⚡ Pilne' :
                    aiSuggestions.orderSummary?.urgency === 'today' ? '📅 Dzisiaj' :
                    aiSuggestions.orderSummary?.urgency === 'tomorrow' ? '📅 Jutro' :
                    aiSuggestions.orderSummary?.urgency === 'this_week' ? '📅 W tym tygodniu' :
                    '📅 Elastyczne'
                  }</div>
                  {aiSuggestions.orderSummary?.hasAttachments && (
                    <div><strong>Załączniki:</strong> 📎 Zdjęcia/filmy dostępne</div>
                  )}
                </div>
              </div>

              {/* Sugerowana cena */}
              {aiSuggestions.pricing && (
                <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                  <div className="font-medium text-indigo-900 mb-2 flex items-center gap-2"><Wallet className="w-4 h-4 shrink-0" aria-hidden /> Sugerowana cena:</div>
                  <div className="text-indigo-800 text-xs space-y-1">
                    <div className="text-base font-bold text-indigo-900">
                      {Math.round(aiSuggestions.pricing.suggested)} zł
                    </div>
                    <div className="text-xs text-indigo-600">
                      Zakres: {Math.round(aiSuggestions.pricing.range?.min || 0)}–{Math.round(aiSuggestions.pricing.range?.max || 0)} zł
                    </div>
                    {aiSuggestions.pricing.reasoning && (
                      <div className="text-xs text-indigo-600 italic mt-1">
                        {aiSuggestions.pricing.reasoning}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sugestie co dopisać */}
              {aiSuggestions.suggestions && (
                <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                  <div className="font-medium text-indigo-900 mb-2">✨ Co dopisać w ofercie:</div>
                  <div className="space-y-2 text-indigo-800 text-xs">
                    {aiSuggestions.suggestions.tips && aiSuggestions.suggestions.tips.length > 0 && (
                      <ul className="list-disc list-inside space-y-1">
                        {aiSuggestions.suggestions.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    )}
                    {aiSuggestions.suggestions.description && (
                      <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-100">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="font-medium">💡 Przykładowy opis:</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMessage(aiSuggestions.suggestions.description);
                                toast({ title: "Opis wypełniony", description: "Sugestia AI została wstawiona do opisu oferty.", variant: "success" });
                              }}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline shrink-0"
                            >
                              Użyj sugestii
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const text = aiSuggestions.suggestions.description;
                                setMessage((prev) => (prev ? prev + "\n\n" + text : text));
                                toast({ title: "Dodano do opisu", description: "Sugestia została dopisana do Twojego tekstu.", variant: "success" });
                              }}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline shrink-0"
                            >
                              Dodaj do mojego tekstu
                            </button>
                          </div>
                        </div>
                        <div className="text-xs italic">{aiSuggestions.suggestions.description}</div>
                      </div>
                    )}
                    {aiSuggestions.suggestions.timeline && (
                      <div className="mt-2">
                        <strong>⏱️ Sugerowany termin:</strong> {aiSuggestions.suggestions.timeline}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-indigo-600">
              Nie udało się pobrać sugestii AI. Możesz złożyć ofertę ręcznie.
            </div>
          )
          )}
        </div>
          )}
        </>
      )}

      {/* Błąd formularza (np. walidacja / wysyłka) */}
      {formError && (
        <div className="rounded-lg bg-red-50 text-red-800 border border-red-200 p-3 text-sm flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <div className="font-medium">Błąd</div>
            <div className="text-xs mt-1 opacity-80">{formError}</div>
          </div>
        </div>
      )}

      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Krok 2/3 — Cena i termin</div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="offer-price" className="text-sm font-medium text-slate-900">
            Cena (zł) <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="offer-price"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onFocus={() => {
                if (!offerStepTracked.current[2]) {
                  offerStepTracked.current[2] = true;
                  trackOfferStepView(2, orderId);
                }
              }}
              onChange={(e) => {
                setAmount(e.target.value);
                // Wyczyść błąd gdy użytkownik zacznie pisać
                if (fieldErrors.amount) {
                  setFieldErrors({ ...fieldErrors, amount: undefined });
                }
              }}
              placeholder="np. 150"
              required
              className={`w-full h-11 px-4 pr-16 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.amount 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-slate-300 focus:ring-indigo-500 focus:border-transparent'
              }`}
              aria-invalid={!!fieldErrors.amount}
              aria-describedby={fieldErrors.amount ? "offer-price-error" : undefined}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">PLN</span>
          </div>
          
          {/* Błąd walidacji ceny */}
          {fieldErrors.amount && (
            <p id="offer-price-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
              <span>⚠️</span>
              <span>{fieldErrors.amount}</span>
            </p>
          )}

          {/* Podpowiedź widełek / badge */}
          {!bandsError && priceHint && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                <div className="min-w-0">
                  Sugerowany zakres:{" "}
                  <span className="font-semibold text-slate-900">
                    {priceHint.suggestedLo}–{priceHint.suggestedHi} zł
                  </span>
                </div>
                <div className="shrink-0">{position?.badge ? <Badge type={position.badge} /> : null}</div>
              </div>
              <p className="text-xs text-slate-500">Oferty w tym zakresie są najczęściej akceptowane przez klientów.</p>
            </div>
          )}

          {/* Błąd pobierania widełek – pod polem ceny (można ukryć i pokazać jako osobną kartę w OrderDetails) */}
          {!hideBandsError && bandsError && (
            <div className="rounded-lg bg-red-50 text-red-900 border border-red-200 p-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div className="min-w-0">
                  <div className="font-medium">Nie udało się pobrać sugestii ceny</div>
                  <div className="text-xs mt-1 opacity-80">
                    Możesz podać cenę ręcznie lub spróbować ponownie.
                  </div>
                  <button
                    type="button"
                    onClick={reloadBands}
                    className="mt-2 inline-flex text-xs font-semibold underline"
                  >
                    Spróbuj ponownie
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Termin realizacji - provider może zaproponować inny termin */}
        <div className="space-y-2">
          <label htmlFor="offer-completion-date" className="text-sm font-medium text-slate-900">
            Termin realizacji <span className="text-red-600">*</span>
          </label>
          
          {/* Informacja o terminie klienta (jeśli istnieje) */}
          {(isPriority && priorityDateTime) && (
            <div className="mb-2 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <div className="text-xs font-medium text-blue-900 mb-1">
                📅 Termin wybrany przez klienta:
              </div>
              <div className="text-sm text-blue-800">
                {new Date(priorityDateTime).toLocaleString('pl-PL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Możesz zaproponować inny termin poniżej
              </div>
            </div>
          )}
          
          {/* Pole wyboru terminu - zawsze dostępne */}
          <input
            id="offer-completion-date"
            type="datetime-local"
            value={completionDate || (isPriority && priorityDateTime ? new Date(priorityDateTime).toISOString().slice(0, 16) : '')}
            onChange={(e) => {
              setCompletionDate(e.target.value);
              // Wyczyść błąd gdy użytkownik wybierze datę
              if (fieldErrors.completionDate) {
                setFieldErrors({ ...fieldErrors, completionDate: undefined });
              }
            }}
            min={new Date().toISOString().slice(0, 16)}
            required
            className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.completionDate 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-slate-300 focus:ring-indigo-500 focus:border-transparent'
            }`}
            aria-invalid={!!fieldErrors.completionDate}
            aria-describedby={fieldErrors.completionDate ? "offer-completion-date-error" : undefined}
          />
          {/* Błąd walidacji terminu */}
          {fieldErrors.completionDate && (
            <p id="offer-completion-date-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
              <span>⚠️</span>
              <span>{fieldErrors.completionDate}</span>
            </p>
          )}
          {!fieldErrors.completionDate && (
            <p className="text-xs text-slate-500">
              {isPriority && priorityDateTime
                ? "Możesz zaproponować inny termin niż wybrał klient (lub zostawić termin klienta)."
                : "Kiedy możesz zakończyć zlecenie? (data i godzina)"}
              {" "}np. dzisiaj 18:00, jutro po 16:00
            </p>
          )}
        </div>

        {/* Opcje dodatkowe (żeby nie przytłaczać) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span className="font-medium">Opcje dodatkowe (opcjonalne)</span>
            <span className="text-xs text-slate-600">{showAdvanced ? "Ukryj" : "Pokaż"}</span>
          </button>

          {showAdvanced && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-4">
              {/* Co zawiera cena */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">Co zawiera cena?</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceIncludes.includes("materials")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPriceIncludes([...priceIncludes, "materials"]);
                        } else {
                          setPriceIncludes(priceIncludes.filter((item) => item !== "materials"));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Materiały / części</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceIncludes.includes("labor")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPriceIncludes([...priceIncludes, "labor"]);
                        } else {
                          setPriceIncludes(priceIncludes.filter((item) => item !== "labor"));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Robocizna</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceIncludes.includes("transport")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPriceIncludes([...priceIncludes, "transport"]);
                        } else {
                          setPriceIncludes(priceIncludes.filter((item) => item !== "transport"));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Dojazd</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceIncludes.includes("other")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPriceIncludes([...priceIncludes, "other"]);
                        } else {
                          setPriceIncludes(priceIncludes.filter((item) => item !== "other"));
                          setPriceIncludesOther("");
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Inne</span>
                  </label>
                  {priceIncludes.includes("other") && (
                    <input
                      type="text"
                      value={priceIncludesOther}
                      onChange={(e) => setPriceIncludesOther(e.target.value)}
                      placeholder="np. gwarancja, sprzątanie po pracach..."
                      className="ml-6 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  )}
                </div>
              </div>

              {/* Czy cena jest ostateczna */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">Czy cena jest ostateczna?</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="isFinalPrice"
                      checked={isFinalPrice}
                      onChange={() => setIsFinalPrice(true)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">☑ Cena ostateczna</div>
                      <div className="text-xs text-slate-600">Cena nie ulegnie zmianie. Klienci bardziej ufają jasnym cenom.</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="isFinalPrice"
                      checked={!isFinalPrice}
                      onChange={() => setIsFinalPrice(false)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">☐ Możliwa korekta po diagnozie</div>
                      <div className="text-xs text-slate-600">Cena może się zmienić po zobaczeniu problemu na miejscu. Wyjaśnij w opisie, co może wpłynąć na zmianę.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sposób kontaktu */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">Sposób kontaktu / realizacji</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="call_before"
                      checked={contactMethod === "call_before"}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <span>📞</span>
                        <span>Zadzwonię przed przyjazdem</span>
                      </div>
                      <div className="text-xs text-slate-600">Skontaktuję się telefonicznie przed wizytą</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="chat_only"
                      checked={contactMethod === "chat_only"}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <span>💬</span>
                        <span>Kontakt tylko przez czat</span>
                      </div>
                      <div className="text-xs text-slate-600">Komunikacja wyłącznie przez aplikację</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="no_contact"
                      checked={contactMethod === "no_contact"}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <span>🚪</span>
                        <span>Przyjadę bez kontaktu (jeśli dostęp)</span>
                      </div>
                      <div className="text-xs text-slate-600">Przyjadę bezpośrednio, jeśli klient jest dostępny</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informacja o preferencjach płatności zlecenia + tooltip */}
        {orderPaymentPreference && (
          <div className={`p-4 border rounded-lg ${
            orderPaymentPreference === 'system' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="text-sm font-medium mb-2 flex items-center gap-2" style={{
              color: orderPaymentPreference === 'system' ? '#1e40af' : '#92400e'
            }}>
              Metoda płatności zlecenia:
              <span
                title="Helpfli Protect: pieniądze trafiają najpierw do depozytu, Ty dostajesz wypłatę po zakończeniu zlecenia. Klient ma gwarancję, Ty masz ochronę przed brakiem zapłaty."
                className="cursor-help"
              >
                <Info className="w-4 h-4 opacity-70" />
              </span>
            </div>
            {orderPaymentPreference === 'system' ? (
              <div className="text-sm flex items-center gap-2" style={{ color: '#1e3a8a' }}>
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden />
                <span><strong>Helpfli Protect</strong> — Płatność przez system Helpfli z gwarancją. Twoja oferta będzie rozliczana przez system escrow.</span>
              </div>
            ) : (
              <div className="text-sm flex items-center gap-2" style={{ color: '#78350f' }}>
                <span>💳</span>
                <span><strong>Płatność poza systemem</strong> — Rozliczenie bezpośrednio z klientem. Ryzyko nieopłacenia jest po obu stronach; Helpfli nie pomoże w razie sporu.</span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Krok 3/3 — Opis i wyślij</div>
        <div className="space-y-2">
          <label htmlFor="offer-description" className="text-sm font-medium text-slate-900">
            Opis oferty <span className="text-slate-500 text-xs font-normal">(opcjonalne)</span>
          </label>
          <textarea
            id="offer-description"
            value={message}
            onFocus={() => {
              if (!offerStepTracked.current[3]) {
                offerStepTracked.current[3] = true;
                trackOfferStepView(3, orderId);
              }
            }}
            onChange={(e) => {
              setMessage(e.target.value);
              // Wyczyść błąd gdy użytkownik zacznie pisać
              if (fieldErrors.message) {
                setFieldErrors({ ...fieldErrors, message: undefined });
              }
            }}
            placeholder="Opisz jak wykonasz zlecenie, doświadczenie, gwarancje..."
            rows={5}
            maxLength={1000}
            className={`w-full px-4 py-3 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
              fieldErrors.message 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-slate-300 focus:ring-indigo-500 focus:border-transparent'
            }`}
            aria-invalid={!!fieldErrors.message}
            aria-describedby={fieldErrors.message ? "offer-description-error" : undefined}
          />
          
          {/* Licznik znaków i błąd walidacji */}
          <div className="flex items-center justify-between">
            {fieldErrors.message ? (
              <p id="offer-description-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
                <span>⚠️</span>
                <span>{fieldErrors.message}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Pamiętaj o szczegółach: zakres prac, materiały, czas realizacji
              </p>
            )}
            <p className={`text-xs ${message.length > 900 ? 'text-amber-600' : 'text-slate-500'}`}>
              {message.length}/1000 znaków
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={sending || Object.keys(fieldErrors).length > 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-base font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm"
          aria-label="Wyślij ofertę do klienta"
        >
          {sending ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Wysyłam...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Wyślij ofertę do klienta
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-500">Złożenie oferty jest bezpłatne.</p>
      </div>
    </div>
  );
}






