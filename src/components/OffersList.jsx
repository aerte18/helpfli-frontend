import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Clock, Star } from "lucide-react";
import { getOffersOfOrder, acceptOffer, boostOffer } from "../api/offers";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import ProviderPreview from "./ProviderPreview";
import AcceptOfferModal from "./AcceptOfferModal";
import { getProviderTrustBadges } from "../utils/providerTrustBadges";

function useAuthToken(){ try{ return localStorage.getItem("token") || ""; }catch{ return ""; } }

function Badge({ b }) {
  if (!b) return null;
  const map = {
    optimal: "bg-emerald-100 text-emerald-800 border-emerald-200",
    fair:    "bg-sky-100 text-sky-800 border-sky-200",
    low:     "bg-amber-100 text-amber-800 border-amber-200",
    high:    "bg-rose-100 text-rose-800 border-rose-200",
  };
  const textMap = {
    optimal: "Optymalna oferta",
    fair: "Uczciwa oferta",
    low: "Niska cena",
    high: "Wysoka cena",
  };
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[b]}`}>{textMap[b]}</span>;
}

export default function OffersList({ orderId, recommendedOfferId, topOfferIds = [], aiReasoning }) {
  const token = useAuthToken();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState("");
  const [showTopModal, setShowTopModal] = useState(false);

  // UI state: sort & filters
  const [sortBy, setSortBy] = useState("smart_default");
  const [filterBadge, setFilterBadge] = useState("all");
  const [filterAI, setFilterAI] = useState("all"); // 'all' | 'ai_top'
  const [maxPrice, setMaxPrice] = useState("");
  const [query, setQuery] = useState("");
  const [filterByTerm, setFilterByTerm] = useState("all"); // 'all' | 'my_term' | 'other_terms'
  const [providerPreview, setProviderPreview] = useState({ open:false, providerId:null, offer: null });
  const [acceptingId, setAcceptingId] = useState(null);
  const [info, setInfo] = useState("");
  const [acceptModal, setAcceptModal] = useState({ isOpen: false, offer: null, order: null });
  const [forceExternalPayment, setForceExternalPayment] = useState(false);
  const [stripeBlockReason, setStripeBlockReason] = useState("");
  const [orderData, setOrderData] = useState(null);

  // Dev: przykładowe oferty dla orderId demo-* (produkcja: API)
  const DEMO_OFFERS = {
    "demo-order-1": [],
    "demo-order-2": [
      {
        _id: "demo-offer-1",
        amount: 180,
        price: 180,
        message: "Wymienię gniazdko na nowe, bezpieczne. Dojazd wliczony w cenę.",
        status: "submitted",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        providerId: "demo-provider-1",
        providerMeta: {
          name: "Wykonawca A",
          ratingAvg: 4.8,
          ratingCount: 24,
          level: "pro",
          badges: ["verified", "top_ai"]
        },
        pricing: {
          badge: "optimal"
        },
        __demo: true
      },
      {
        _id: "demo-offer-2",
        amount: 150,
        price: 150,
        message: "Szybka wymiana gniazdka. Materiały w cenie.",
        status: "submitted",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
        providerId: "demo-provider-2",
        providerMeta: {
          name: "Piotr Nowak",
          ratingAvg: 4.5,
          ratingCount: 12,
          level: "standard",
          badges: ["verified"]
        },
        pricing: {
          badge: "fair"
        },
        __demo: true
      },
      {
        _id: "demo-offer-3",
        amount: 220,
        price: 220,
        message: "Profesjonalna wymiana z gwarancją. Dojazd + materiały premium.",
        status: "submitted",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        providerId: "demo-provider-3",
        providerMeta: {
          name: "Marek Wiśniewski",
          ratingAvg: 4.9,
          ratingCount: 45,
          level: "pro",
          badges: ["verified", "top_ai"]
        },
        pricing: {
          badge: "high"
        },
        hasGuarantee: true,
        __demo: true
      }
    ],
    "demo-order-3": []
  };

  useEffect(() => {
    async function load() {
      try {
        const isDemo = orderId?.startsWith("demo-");

        if (isDemo && import.meta.env.DEV) {
          setOffers(DEMO_OFFERS[orderId] || []);
          // Ustaw też przykładowe dane zlecenia (minimalne, pod UI)
          setOrderData({
            _id: orderId,
            status: orderId === "demo-order-3" ? "accepted" : (orderId === "demo-order-2" ? "collecting_offers" : "open"),
            service: orderId === "demo-order-3" ? "Złota rączka" : (orderId === "demo-order-2" ? "Elektryk" : "Hydraulik"),
            description:
              orderId === "demo-order-3"
                ? "Montaż karnisza w sypialni + drobne poprawki mocowań."
                : (orderId === "demo-order-2"
                  ? "Iskrzy gniazdko w salonie. Proszę o diagnozę i wymianę."
                  : "Kran w kuchni przecieka. Potrzebuję szybkiej naprawy."),
            location: { city: orderId === "demo-order-3" ? "Gdańsk" : (orderId === "demo-order-2" ? "Kraków" : "Warszawa") },
            __demo: true
          });
          return;
        }

        if (isDemo && !import.meta.env.DEV) {
          setOffers([]);
          setOrderData(null);
          setError("To zlecenie nie jest dostępne.");
          return;
        }

        const data = await getOffersOfOrder({ token, orderId });
        setOffers(data);
        
        // Pobierz dane zlecenia dla teleporad
        if (orderId) {
          try {
            const orderRes = await fetch(apiUrl(`/api/orders/${orderId}`), {
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
            if (orderRes.ok) {
              const orderJson = await orderRes.json();
              setOrderData(orderJson);
            }
          } catch (e) {
            console.warn('Nie udało się pobrać danych zlecenia:', e);
          }
        }
      } catch (e) {
        setError(e.message || "Błąd pobierania ofert");
      }
    }
    if (orderId) load();
  }, [orderId, token]);

  // Socket.IO - live updates
  useEffect(() => {
    if (!socket || !orderId) return;
    
    socket.emit("joinOrderRoom", orderId);

    function onNewOffer(payload) {
      // Najprościej: odśwież listę
      (async () => {
        try {
          const data = await getOffersOfOrder({ token, orderId });
          setOffers(data);
        } catch (e) {
          console.error("Błąd odświeżania po nowej ofercie:", e);
        }
      })();
    }
    
    function onAccepted(payload) {
      (async () => {
        try {
          const data = await getOffersOfOrder({ token, orderId });
          setOffers(data);
          setInfo("Oferta została zaakceptowana (live) ✅");
        } catch (e) {
          console.error("Błąd odświeżania po akceptacji:", e);
        }
      })();
    }

    socket.on("offer:new", onNewOffer);
    socket.on("offer:accepted", onAccepted);

    // Listener dla aktualizacji badge'ów
    function onBadgeUpdate(payload) {
      // gdy provider dostanie/straci TOP AI, odśwież listę
      (async () => {
        try {
          const data = await getOffersOfOrder({ token, orderId });
          setOffers(data);
        } catch (e) {
          console.error("Błąd odświeżania po aktualizacji badge:", e);
        }
      })();
    }
    socket.on("provider:badgeUpdate", onBadgeUpdate);

    return () => {
      socket.emit("leaveOrderRoom", orderId);
      socket.off("offer:new", onNewOffer);
      socket.off("offer:accepted", onAccepted);
      socket.off("provider:badgeUpdate", onBadgeUpdate);
    };
  }, [socket, orderId, token]);

  const view = useMemo(() => {
    let arr = [...offers];
    if (filterAI === "ai_top" && Array.isArray(topOfferIds) && topOfferIds.length > 0) {
      const idSet = new Set(topOfferIds.map(String));
      arr = arr.filter(o => idSet.has(String(o._id || o.id)));
      arr.sort((a, b) => topOfferIds.indexOf(String(a._id || a.id)) - topOfferIds.indexOf(String(b._id || b.id)));
    }
    if (filterBadge !== "all") arr = arr.filter(o => (o.pricing?.badge || "") === filterBadge);
    if (maxPrice) { const mp = Number(maxPrice); if (!isNaN(mp)) arr = arr.filter(o => Number(o.amount) <= mp); }
    if (query.trim()) { const q = query.trim().toLowerCase(); arr = arr.filter(o => (o.message || "").toLowerCase().includes(q)); }
    const badgeRank = (b) => ({ optimal:1, fair:2, low:3, high:4 }[b] || 9);
    
    // Funkcja pomocnicza do obliczania różnicy terminu od terminu klienta
    const getTermDiff = (offer) => {
      if (!orderData?.priorityDateTime || !offer.completionDate) return Infinity;
      const clientTerm = new Date(orderData.priorityDateTime).getTime();
      const offerTerm = new Date(offer.completionDate).getTime();
      return Math.abs(offerTerm - clientTerm);
    };
    
    if (sortBy === "smart_default") {
      arr.sort((a,b) => {
        // 1) boostowane oferty na górze
        const aBoosted = a.boostUntil && new Date(a.boostUntil) > new Date();
        const bBoosted = b.boostUntil && new Date(b.boostUntil) > new Date();
        if (aBoosted !== bBoosted) return bBoosted - aBoosted;
        
        // 2) najbliższy termin do terminu klienta (jeśli klient wybrał termin)
        if (orderData?.priorityDateTime) {
          const aTermDiff = getTermDiff(a);
          const bTermDiff = getTermDiff(b);
          if (aTermDiff !== bTermDiff) return aTermDiff - bTermDiff;
        }
        
        // 3) lepszy badge
        const br = badgeRank(a.pricing?.badge) - badgeRank(b.pricing?.badge);
        if (br !== 0) return br;
        // 4) wyższy rating
        const ar = a.providerMeta?.ratingAvg ?? 0;
        const brt = b.providerMeta?.ratingAvg ?? 0;
        if (brt !== ar) return brt - ar;
        // 5) niższa cena
        return (a.amount - b.amount);
      });
    }
    else if (sortBy === "price_asc") arr.sort((a,b) => a.amount - b.amount);
    else if (sortBy === "price_desc") arr.sort((a,b) => b.amount - a.amount);
    else if (sortBy === "rating_desc") {
      arr.sort((a,b) => {
        const ar = a.providerMeta?.ratingAvg ?? 0;
        const br = b.providerMeta?.ratingAvg ?? 0;
        if (br !== ar) return br - ar;
        // tie-break: badge → cena
        const badgeRank = (x) => ({ optimal:1, fair:2, low:3, high:4 }[x] || 9);
        return (badgeRank(a.pricing?.badge) - badgeRank(b.pricing?.badge)) || (a.amount - b.amount);
      });
    }
    else if (sortBy === "term_asc") {
      // Sortuj według terminu - najbliższy do terminu klienta
      arr.sort((a,b) => {
        if (!orderData?.priorityDateTime) {
          // Jeśli klient nie wybrał terminu, sortuj po dacie realizacji
          const aDate = a.completionDate ? new Date(a.completionDate).getTime() : Infinity;
          const bDate = b.completionDate ? new Date(b.completionDate).getTime() : Infinity;
          return aDate - bDate;
        }
        const aTermDiff = getTermDiff(a);
        const bTermDiff = getTermDiff(b);
        return aTermDiff - bTermDiff;
      });
    }
    else arr.sort((a,b) => (badgeRank(a.pricing?.badge) - badgeRank(b.pricing?.badge)) || (a.amount - b.amount));
    return arr;
  }, [offers, sortBy, filterBadge, filterAI, topOfferIds, maxPrice, query, filterByTerm, orderData]);

  async function onAccept(offerId) {
    // Znajdź ofertę i otwórz modal
    const offer = offers.find(o => o._id === offerId);
    if (offer) {
      setAcceptModal({ isOpen: true, offer, order: orderData });
    }
  }

  async function handleAcceptOffer(acceptData) {
    try {
      setAcceptingId(acceptData.offerId);
      setInfo("");
      
      // Wyślij dane akceptacji do backendu
      const res = await fetch(apiUrl(`/api/offers/${acceptData.offerId}/accept`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: acceptData.paymentMethod,
          includeGuarantee: acceptData.includeGuarantee,
          totalAmount: acceptData.totalAmount,
          breakdown: acceptData.breakdown,
          // Teleporada - dane konsultacji
          scheduledDateTime: acceptData.scheduledDateTime,
          consultationType: acceptData.consultationType,
          consultationDuration: acceptData.consultationDuration
        })
      });

      const acceptResult = await res.json();

      if (!res.ok) {
        const message = acceptResult.message || "Błąd akceptacji oferty";

        // Jeśli backend zwraca informację o braku aktywnych wypłat Stripe u wykonawcy,
        // zablokuj płatność systemową w modalu i pokaż powód.
        if (message.includes("nie ma jeszcze aktywowanych wypłat Stripe")) {
          setForceExternalPayment(true);
          setStripeBlockReason(message);
        }

        throw new Error(message);
      }

      setInfo("Oferta zaakceptowana ✅");
      setAcceptModal({ isOpen: false, offer: null });
      
      // Odśwież listę
      const updatedOffers = await getOffersOfOrder({ token, orderId });
      setOffers(updatedOffers);

      const pm =
        acceptResult.paymentMethod ||
        acceptData.paymentMethod ||
        "system";
      
      // Płatność w systemie → checkout (trasa pod PrivateRoute, nie tylko provider)
      if (pm === "system") {
        navigate(`/checkout/${orderId}`, { replace: true });
      } else if (pm === "external" && acceptResult.breakdown?.platformFee > 0) {
        // Płatność poza systemem, ale klient musi opłacić prowizję platformy w systemie
        try {
          const commissionRes = await fetch(apiUrl(`/api/payments/create-commission-intent`), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId }),
          });
          const commissionData = await commissionRes.json();
          if (!commissionRes.ok) {
            throw new Error(commissionData.message || "Błąd tworzenia płatności za prowizję");
          }

          const pi = encodeURIComponent(commissionData.paymentIntentId);
          const cs = encodeURIComponent(commissionData.clientSecret);
          const price = encodeURIComponent(acceptResult.breakdown.platformFee);

          // Przekieruj do wspólnej strony Stripe Checkout dla prowizji
          window.location.href = `/checkout?pi=${pi}&cs=${cs}&type=commission&orderId=${orderId}&price=${price}`;
        } catch (e) {
          // Jeśli coś pójdzie nie tak, pokaż błąd, ale oferta pozostaje zaakceptowana
          setError(e.message || "Błąd inicjowania płatności prowizji");
        }
      } else if (pm === "external") {
        navigate(`/orders/${orderId}?tab=details`, { replace: true });
      }
    } catch (e) {
      setError(e.message || "Błąd akceptacji oferty");
    } finally {
      setAcceptingId(null);
    }
  }

  if (error) return <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 p-2 text-sm">{error}</div>;

  const hasManyOffers = offers.length >= 5;
  const showAIShortlist = hasManyOffers && Array.isArray(topOfferIds) && topOfferIds.length > 0;
  const topOffersForModal = topOfferIds.length ? offers.filter(o => topOfferIds.includes(String(o._id || o.id))) : [];

  return (
    <div className="space-y-4">
      {/* Banner: wiele ofert – rekomendacja AI */}
      {showAIShortlist && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-semibold text-indigo-900">Masz {offers.length} ofert – zobacz TOP 3 rekomendowane przez AI</div>
                <div className="text-sm text-indigo-700 mt-0.5">{aiReasoning ? `${aiReasoning.substring(0, 120)}…` : 'Na podstawie ceny, ocen i opisu.'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTopModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Pokaż TOP 3 w oknie
              </button>
              <button
                type="button"
                onClick={() => { setFilterAI(filterAI === 'ai_top' ? 'all' : 'ai_top'); setShowTopModal(false); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${filterAI === 'ai_top' ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                {filterAI === 'ai_top' ? 'Pokaż wszystkie' : 'Pokaż tylko TOP 3'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtry - bardziej profesjonalne */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sortuj</label>
            <select 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              value={sortBy} 
              onChange={(e)=>setSortBy(e.target.value)}
            >
              <option value="smart_default">Domyślne (termin → optimal → rating → cena)</option>
              <option value="term_asc">Najbliższy termin</option>
              <option value="badge_then_price_asc">Najlepsze dopasowanie (badge → cena)</option>
              <option value="price_asc">Cena rosnąco</option>
              <option value="price_desc">Cena malejąco</option>
              <option value="rating_desc">Ocena wykonawcy</option>
            </select>
          </div>
          {orderData?.priorityDateTime && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Termin</label>
              <select 
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                value={filterByTerm} 
                onChange={(e)=>setFilterByTerm(e.target.value)}
              >
                <option value="all">Wszystkie</option>
                <option value="my_term">Z moim terminem</option>
                <option value="other_terms">Inne terminy</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Badge</label>
            <select 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              value={filterBadge} 
              onChange={(e)=>setFilterBadge(e.target.value)}
            >
              <option value="all">Wszystkie</option>
              <option value="optimal">Optymalna</option>
              <option value="fair">Uczciwa</option>
              <option value="low">Niska</option>
              <option value="high">Wysoka</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Maks. cena (PLN)</label>
            <input 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              type="number" 
              value={maxPrice} 
              onChange={(e)=>setMaxPrice(e.target.value)} 
              placeholder="np. 500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Szukaj</label>
            <input 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              placeholder="np. 'faktura'" 
              value={query} 
              onChange={(e)=>setQuery(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {info && (
        <div className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 text-sm flex items-center gap-2">
          <span>✓</span>
          <span>{info}</span>
        </div>
      )}

      {view.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <div className="text-slate-500 text-sm">Brak ofert spełniających filtry.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {view.map((o) => {
            const isHighlighted = (o.highlightedUntil && new Date(o.highlightedUntil) > new Date()) || (o.boostUntil && new Date(o.boostUntil) > new Date());
            return (
            <div 
              key={o._id} 
              className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                isHighlighted
                  ? 'border-yellow-400 border-2 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg shadow-yellow-200' 
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Lewa strona - główne info (MVP: Uber-style) */}
                <div className="flex-1 min-w-0">
                  {/* MVP: Cena (użyj price jeśli dostępne, fallback do amount) */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl font-bold text-slate-900">
                      {o.price || o.amount} zł
                    </div>
                    <Badge b={o.pricing?.badge} />
                    {recommendedOfferId && String(o._id) === String(recommendedOfferId) && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                        🤖 AI poleca
                      </span>
                    )}
                    {isHighlighted && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-2 border-yellow-600 shadow-sm animate-pulse">
                        <Star className="w-3.5 h-3.5 shrink-0 fill-current" aria-hidden />
                        WYRÓŻNIONA
                      </span>
                    )}
                    {/* MVP: Gwarancja badge */}
                    {o.hasGuarantee && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden />
                        Gwarancja
                      </span>
                    )}
                  </div>
                  
                  {/* MVP: ETA (Estimated Time of Arrival) */}
                  {o.etaMinutes && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        Przyjedzie za: {o.etaMinutes} min
                      </span>
                      {o.etaRange && (
                        <span className="text-xs text-slate-500">
                          ({o.etaRange.min}-{o.etaRange.max} min)
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Informacje o cenie - co zawiera */}
                  {o.priceInfo && (
                    <div className="mb-2 space-y-1">
                      {o.priceInfo.includes && o.priceInfo.includes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-600 font-medium">Cena zawiera:</span>
                          {o.priceInfo.includes.includes('materials') && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Materiały</span>
                          )}
                          {o.priceInfo.includes.includes('labor') && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">Robocizna</span>
                          )}
                          {o.priceInfo.includes.includes('transport') && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">Dojazd</span>
                          )}
                          {o.priceInfo.includes.includes('other') && o.priceInfo.includesOther && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">{o.priceInfo.includesOther}</span>
                          )}
                        </div>
                      )}
                      {o.priceInfo.isFinal !== undefined && (
                        <div className="text-xs">
                          {o.priceInfo.isFinal ? (
                            <span className="text-emerald-700 font-medium">☑ Cena ostateczna</span>
                          ) : (
                            <span className="text-amber-700 font-medium">☐ Możliwa korekta po diagnozie</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Sposób kontaktu */}
                  {o.contactMethod && (
                    <div className="mb-2 text-xs text-slate-600">
                      {o.contactMethod === 'call_before' && (
                        <span className="flex items-center gap-1">
                          <span>📞</span>
                          <span>Zadzwonię przed przyjazdem</span>
                        </span>
                      )}
                      {o.contactMethod === 'chat_only' && (
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          <span>Kontakt tylko przez czat</span>
                        </span>
                      )}
                      {o.contactMethod === 'no_contact' && (
                        <span className="flex items-center gap-1">
                          <span>🚪</span>
                          <span>Przyjadę bez kontaktu (jeśli dostęp)</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* MVP: Notes (użyj notes jeśli dostępne, fallback do message) */}
                  {(o.notes || o.message) && (
                    <div className="text-sm text-slate-700 mb-2 leading-relaxed">
                      {o.notes || o.message}
                    </div>
                  )}
                  
                  {/* Termin realizacji - pokaż jeśli jest dostępny */}
                  {o.completionDate && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        📅 Termin realizacji:
                      </span>
                      <span className="text-sm text-slate-600">
                        {new Date(o.completionDate).toLocaleString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {orderData?.priorityDateTime && (() => {
                        const clientTerm = new Date(orderData.priorityDateTime).getTime();
                        const offerTerm = new Date(o.completionDate).getTime();
                        const diff = Math.abs(offerTerm - clientTerm);
                        const tolerance = 60 * 60 * 1000; // 1 godzina
                        const isMyTerm = diff <= tolerance;
                        
                        return isMyTerm ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            ✓ Zgodny z moim terminem
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            ⚠ Inny termin
                          </span>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* MVP: Provider info + Level + Rating */}
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    {o.providerMeta?.name && (
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          {o.providerMeta.name}
                        </div>
                        {o.providerMeta.level && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {o.providerMeta.level === 'pro' ? 'TOP' : o.providerMeta.level === 'standard' ? 'STANDARD' : 'BASIC'}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {o.providerMeta?.ratingAvg && (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-medium">{o.providerMeta.ratingAvg}</span>
                        {o.providerMeta.ratingCount && (
                          <span className="text-slate-400">({o.providerMeta.ratingCount})</span>
                        )}
                      </div>
                    )}
                    
                    {/* Legacy: completionDate */}
                    {o.completionDate && !o.etaMinutes && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <span>📅</span>
                        <span>
                          {new Date(o.completionDate).toLocaleDateString('pl-PL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prawa strona - akcje i metadane */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  {/* Badges i rating */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {Array.isArray(o.providerMeta?.badges) && (
                        <>
                          {o.providerMeta.badges.includes("verified") && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Verified
                            </span>
                          )}
                          {o.providerMeta.badges.includes("top_ai") && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              ⭐ TOP AI
                            </span>
                          )}
                        </>
                      )}
                      {getProviderTrustBadges(o.providerMeta).map((b) => (
                        <span
                          key={b.key}
                          title={b.title}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {b.key === 'top_rated' && '⭐ '}
                          {b.key === 'new_provider' && '🆕 '}
                          {b.key === 'experienced' && '✓ '}
                          {b.label}
                        </span>
                      ))}
                    </div>
                    
                    {o.providerMeta?.ratingAvg && (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-medium">{o.providerMeta.ratingAvg}</span>
                        <span className="text-slate-400">({o.providerMeta.ratingCount ?? 0})</span>
                      </div>
                    )}
                  </div>

                  {/* Przyciski akcji */}
                  <div className="flex items-center gap-2">
                    {/* Boost button dla providerów */}
                    {user?.role === 'provider' && String(o.providerId) === String(user._id) && o.status === 'submitted' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Boostować ofertę za 10 zł (24h)? Pakiet PRO = darmowy boost.')) return;
                          try {
                            const data = await boostOffer({ token, offerId: o._id });
                            if (data.requiresPayment) {
                              window.location.href = data.checkoutUrl;
                            } else {
                              alert(data.message || 'Oferta zboostowana!');
                              const updated = await getOffersOfOrder({ token, orderId });
                              setOffers(updated);
                            }
                          } catch (error) {
                            alert(error.message || 'Błąd boostowania oferty');
                          }
                        }}
                        className="rounded-lg px-3 py-1.5 bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
                      >
                        🚀 Boost
                      </button>
                    )}

                    <button
                      className="rounded-lg px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                      onClick={()=>setProviderPreview({ open:true, providerId: o.providerId, offer: o })}
                    >
                      Szczegóły
                    </button>
                    
                    {user?.role === 'client' && (
                      <button
                        className="rounded-lg px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                        disabled={acceptingId === o._id}
                        onClick={()=>onAccept(o._id)}
                      >
                        {acceptingId === o._id ? "Akceptuję…" : "Akceptuj"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal akceptacji oferty z informacją o tierze i Fast-Track */}
      <AcceptOfferModal
        isOpen={acceptModal.isOpen}
        onClose={() => setAcceptModal({ isOpen: false, offer: null, order: null })}
        offer={acceptModal.offer}
        order={acceptModal.order} // Przekaż order jeśli jest dostępny
        onAccept={handleAcceptOffer}
        isAccepting={acceptingId === acceptModal.offer?._id}
        loyaltyTier={user?.gamification?.tier ? {
          name: typeof user.gamification.tier === 'string' ? user.gamification.tier : user.gamification.tier.name,
          discount: typeof user.gamification.tier === 'string' ? 0 : (user.gamification.tier.discount || 0),
          prioritySupport: typeof user.gamification.tier === 'string' ? false : !!user.gamification.tier.prioritySupport,
          icon: typeof user.gamification.tier === 'string'
            ? (user.gamification.tier === 'platinum' ? '👑' : user.gamification.tier === 'gold' ? '🥇' : user.gamification.tier === 'silver' ? '🥈' : '🥉')
            : (user.gamification.tier.icon || '💎')
        } : null}
        isFastTrack={Boolean(offers[0]?.orderIsFastTrack)}
        disableSystemPayment={forceExternalPayment}
        systemDisabledReason={stripeBlockReason}
      />

      {/* Modal TOP 3 rekomendowane przez AI */}
      {showTopModal && showAIShortlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowTopModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="font-semibold text-slate-900">TOP 3 rekomendowane przez AI</h3>
              </div>
              <button type="button" onClick={() => setShowTopModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {topOffersForModal.slice(0, 3).map((o, idx) => (
                <div key={o._id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">#{idx + 1}</span>
                      {recommendedOfferId && String(o._id) === String(recommendedOfferId) && (
                        <span className="text-xs font-medium text-indigo-700">AI poleca</span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 mt-1">{o.price || o.amount} zł</div>
                    <div className="text-sm text-slate-600 truncate">{o.providerMeta?.name || o.providerId?.name || 'Wykonawca'}</div>
                    {(o.notes || o.message) && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{o.notes || o.message}</div>}
                  </div>
                  {user?.role === 'client' && (
                    <button
                      className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                      disabled={acceptingId === o._id}
                      onClick={() => { onAccept(o._id); setShowTopModal(false); }}
                    >
                      {acceptingId === o._id ? '…' : 'Akceptuj'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
              <button
                type="button"
                onClick={() => { setFilterAI('ai_top'); setShowTopModal(false); }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Pokaż TOP 3 w liście
              </button>
              <button type="button" onClick={() => setShowTopModal(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300">
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      <ProviderPreview
        providerId={providerPreview.providerId}
        open={providerPreview.open}
        onClose={()=>setProviderPreview({ open:false, providerId:null, offer: null })}
        offer={providerPreview.offer}
      />
    </div>
  );
}


