import { useEffect, useMemo, useState } from "react";
import { getMySubscription, getMyPoints, redeemPoints, getBoostOptions } from "../api/subscriptions";
import { DollarSign, Clock, MessageSquare, X, Zap, CheckCircle2 } from "lucide-react";

export default function ProposalFeeModal({ open, onClose, order, onSubmitted }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [points, setPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [boostFeePLN, setBoostFeePLN] = useState(5);
  const [boostLabel, setBoostLabel] = useState("boost (24h)");
  const [freeRepliesLeft, setFreeRepliesLeft] = useState(null);
  
  // Pola formularza
  const [price, setPrice] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    // Reset formularza przy otwarciu
    setPrice("");
    setEstimatedTime("");
    setComment("");
    setError("");
    
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [sub, pts, boosts, freeLeftRes] = await Promise.all([
          getMySubscription().catch(() => null),
          getMyPoints().catch(() => ({ balance: 0 })),
          getBoostOptions().catch(() => ({ options: [] })),
          fetch('/api/provider-stats/free-replies-left', { headers: { Authorization: `Bearer ${token}` }}).then(r=>r.json()).catch(()=>({ freeRepliesLeft: null }))
        ]);
        setSubscription(sub);
        setPoints(pts?.balance || 0);
        if (typeof freeLeftRes?.freeRepliesLeft === 'number') setFreeRepliesLeft(freeLeftRes.freeRepliesLeft);
        // wybierz najtańszy boost jako opłatę za dodatkową odpowiedź
        const opts = boosts?.options || boosts || [];
        if (Array.isArray(opts) && opts.length) {
          const sorted = [...opts].sort((a, b) => (a.price || a.amount || 0) - (b.price || b.amount || 0));
          const cheapest = sorted[0];
          const raw = cheapest.price ?? cheapest.amount ?? 500; // grosze
          setBoostFeePLN(Math.round(raw) / 100);
          setBoostLabel(cheapest.label || cheapest.name || `${Math.round((cheapest.durationHours||24))}h`);
        }
      } catch (e) {
        setError(e.message || "Błąd pobierania danych płatności");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const isPro = useMemo(() => {
    const key = subscription?.plan?.key || subscription?.planKey;
    return key && key.toUpperCase().includes("PRO");
  }, [subscription]);

  // Opłata = najtańszy boost (jeśli nie PRO)
  const hasFreeReply = (typeof freeRepliesLeft === 'number' && freeRepliesLeft > 0);
  const feePLN = (isPro || hasFreeReply) ? 0 : (boostFeePLN || 5);

  const submitProposal = async (e) => {
    if (e) e.preventDefault();
    if (!order?._id && !order?.id) return;
    
    // Walidacja
    if (!price || parseFloat(price) <= 0) {
      setError("Podaj prawidłową cenę");
      return;
    }
    
    const orderId = order._id || order.id;
    const token = localStorage.getItem("token");
    setSubmitting(true);
    setError("");
    try {
      // Rozlicz punkty jeśli używamy
      if (feePLN > 0 && usePoints && points >= feePLN) {
        await redeemPoints(-feePLN, "proposal_fee");
      }

      const res = await fetch(`/api/orders/${orderId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          price: Math.round(parseFloat(price) * 100), // w groszach
          estimatedTime: estimatedTime || "",
          comment: comment || "Propozycja wysłana"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.limitReached) {
          throw new Error(`Przekroczono limit darmowych wycen (${data.limit}/miesiąc). Wykup pakiet PRO lub zapłać za boost.`);
        }
        throw new Error(data?.message || "Błąd składania oferty");
      }
      // Jeśli backend zwraca requireFee=true – pokaż płatność (gdy nie użyliśmy punktów)
      if (data.requireFee && !(usePoints && points >= feePLN)) {
        return goToCheckout();
      }
      onSubmitted?.(data);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goToCheckout = () => {
    if (!order?._id && !order?.id) return;
    const orderId = order._id || order.id;
    // Prosty redirect do checkoutu naszej aplikacji
    window.location.href = `/checkout?reason=proposal_fee&orderId=${encodeURIComponent(orderId)}&amount=${feePLN * 100}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-white overflow-y-auto">
      {/* Header - podobny do projektu zip */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 max-w-7xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-xl font-semibold text-slate-900">Helpfli</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Złóż ofertę</h1>
            <p className="text-slate-600">Wypełnij formularz, aby złożyć wycenę dla tego zlecenia</p>
          </div>

          {/* Content */}
          <form onSubmit={submitProposal} className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-slate-600 mt-2">Ładowanie danych...</p>
            </div>
          ) : (
            <>
              {/* Informacja o zleceniu */}
              {order && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm font-medium text-slate-900 mb-1">{order.service || "Zlecenie"}</div>
                  {order.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{order.description}</p>
                  )}
                  {order.location && (
                    <p className="text-xs text-slate-500 mt-1">📍 {order.location}</p>
                  )}
                </div>
              )}

              {/* Cena */}
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-600" />
                  Cena oferty <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="np. 200"
                    required
                    className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">zł</span>
                </div>
                <p className="text-xs text-slate-500">Podaj cenę za wykonanie usługi</p>
              </div>

              {/* Czas realizacji */}
              <div className="space-y-2">
                <label htmlFor="estimatedTime" className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Szacowany czas realizacji <span className="text-slate-400 font-normal">(opcjonalnie)</span>
                </label>
                <select
                  id="estimatedTime"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Wybierz termin</option>
                  <option value="asap">Jak najszybciej</option>
                  <option value="today">Dzisiaj</option>
                  <option value="tomorrow">Jutro</option>
                  <option value="this-week">W tym tygodniu</option>
                  <option value="next-week">W przyszłym tygodniu</option>
                  <option value="flexible">Elastycznie</option>
                </select>
              </div>

              {/* Komentarz */}
              <div className="space-y-2">
                <label htmlFor="comment" className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  Dodatkowe informacje <span className="text-slate-400 font-normal">(opcjonalnie)</span>
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Dodaj komentarz, szczegóły oferty lub pytania..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Informacja o opłacie */}
              {isPro ? (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-emerald-900">Pakiet PRO</div>
                    <p className="text-xs text-emerald-700 mt-1">Masz pakiet PRO – składanie wycen jest bezpłatne.</p>
                  </div>
                </div>
              ) : hasFreeReply ? (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-emerald-900">Darmowa wycena</div>
                    <p className="text-xs text-emerald-700 mt-1">Darmowa wycena dostępna – brak opłaty.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900">Opłata za złożenie wyceny</div>
                    <div className="text-lg font-semibold text-slate-900">{feePLN} zł</div>
                  </div>
                  <div className="text-xs text-slate-600">
                    Saldo punktów: <span className="font-medium">{points} pkt</span> (1 pkt = 1 zł)
                  </div>
                  {points >= feePLN ? (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={usePoints} 
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700">Użyj punktów, aby pokryć opłatę ({feePLN} pkt)</span>
                    </label>
                  ) : (
                    <div className="text-xs text-amber-600 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Masz za mało punktów, możesz zapłacić kartą.
                    </div>
                  )}
                </div>
              )}

              {/* Błąd */}
              {error && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !price || parseFloat(price) <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-base font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Wysyłam...
                  </>
                ) : isPro || hasFreeReply || (feePLN > 0 && usePoints && points >= feePLN) ? (
                  "Wyślij ofertę"
                ) : (
                  "Przejdź do płatności"
                )}
              </button>

              {!isPro && !hasFreeReply && feePLN > 0 && (!usePoints || points < feePLN) && (
                <button
                  type="button"
                  onClick={goToCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-base font-medium rounded-lg transition-colors"
                >
                  Przejdź do płatności
                </button>
              )}

              <p className="text-center text-sm text-slate-500">
                Wypełnij wszystkie wymagane pola, aby złożyć ofertę
              </p>
            </>
          )}
        </form>
        </div>
      </main>
    </div>
  );
}
