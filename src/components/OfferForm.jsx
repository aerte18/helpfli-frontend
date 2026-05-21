import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useRef, useState } from "react";
import { getOfferHint, postOffer } from "../api/offers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./toast/ToastProvider";
import { useTelemetry } from "../hooks/useTelemetry";
import { Send, Sparkles, Info, ChevronUp, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "../utils/errorMessages";
import {
  getUrgencyLabel,
  suggestCompletionLocalFromUrgency,
} from "../utils/orderUrgency";

const OFFER_FORM_AI_KEY = "offerForm_showAi";
/** Twarda blokada: poniżej wymagane potwierdzenie „Wyślij mimo to” (zgodne z backendem). */
const OFFER_QUALITY_HARD_THRESHOLD = 45;

/** Wartość dla input[type=datetime-local] w strefie użytkownika (nie UTC z toISOString). */
function toDatetimeLocalValue(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function resolveCompletionDateValue(
  completionDate,
  isPriority,
  priorityDateTime,
  orderUrgency,
  orderUrgencyTime
) {
  if (completionDate?.trim()) return completionDate.trim();
  if (isPriority && priorityDateTime) {
    return toDatetimeLocalValue(priorityDateTime);
  }
  if (orderUrgency) {
    return suggestCompletionLocalFromUrgency(orderUrgency, orderUrgencyTime);
  }
  return "";
}

function hasActiveFieldErrors(errors) {
  return Object.values(errors || {}).some((v) => Boolean(v));
}

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

/** Zwijany panel AI — nie zasłania pól formularza */
function OfferAiAssistPanel({
  visible,
  onShow,
  onHide,
  loading,
  data,
  onApplyAll,
  onApplyPrice,
  onApplyDescription,
}) {
  if (!visible) {
    return (
      <button
        type="button"
        onClick={onShow}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40 px-3 py-2.5 text-sm font-medium text-indigo-800 hover:bg-indigo-50"
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        Pokaż podpowiedzi AI (cena, opis, ryzyka)
      </button>
    );
  }

  const suggested = data?.pricing?.suggested;
  const win = data?.suggestions?.winScore;
  const winLabel = data?.suggestions?.winLabel;

  return (
    <details className="group rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-indigo-950">
          <Sparkles className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
          <span>Podpowiedzi AI</span>
          {loading && <span className="text-xs font-normal text-indigo-600">ładowanie…</span>}
          {!loading && suggested != null && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-indigo-900 shadow-sm">
              ~{Math.round(suggested)} zł
            </span>
          )}
          {!loading && win != null && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
              {win}% {winLabel || "szansy"}
            </span>
          )}
        </span>
        <span className="shrink-0 text-xs text-indigo-600 group-open:hidden">Rozwiń</span>
        <ChevronUp className="h-4 w-4 shrink-0 text-indigo-500 hidden group-open:block" aria-hidden />
      </summary>

      <div className="border-t border-indigo-100 px-4 py-3 space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {data?.pricing && (
            <button
              type="button"
              onClick={onApplyAll}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Wstaw wszystko do formularza
            </button>
          )}
          <button
            type="button"
            onClick={onHide}
            className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
          >
            Ukryj AI
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-indigo-700">Analizuję zlecenie…</p>
        ) : !data ? (
          <p className="text-xs text-indigo-700">Brak sugestii — wypełnij formularz ręcznie.</p>
        ) : (
          <>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-800">{data.orderSummary?.service || "Usługa"}</strong>
              {data.orderSummary?.location ? ` · ${data.orderSummary.location}` : ""}
            </p>

            {data.pricing && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
                <span className="text-xs text-indigo-900">
                  Cena: <strong className="text-base">{Math.round(data.pricing.suggested)} zł</strong>
                  <span className="text-indigo-600 font-normal">
                    {" "}
                    ({Math.round(data.pricing.range?.min || 0)}–{Math.round(data.pricing.range?.max || 0)} zł)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onApplyPrice}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
                >
                  Wstaw cenę
                </button>
              </div>
            )}

            {data.suggestions?.description && (
              <div className="rounded-lg border border-indigo-100 bg-white/80 p-2">
                <div className="flex flex-wrap justify-between gap-1 mb-1">
                  <span className="text-xs font-medium text-indigo-900">Przykładowy opis</span>
                  <button
                    type="button"
                    onClick={onApplyDescription}
                    className="text-xs font-semibold text-indigo-700 underline"
                  >
                    Wstaw do opisu
                  </button>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 italic">{data.suggestions.description}</p>
              </div>
            )}

            {(data.suggestions?.tips?.length > 0 || data.suggestions?.risks?.length > 0) && (
              <details className="text-xs text-slate-700">
                <summary className="cursor-pointer font-medium text-indigo-900">Więcej wskazówek i ryzyk</summary>
                <ul className="mt-2 list-disc pl-4 space-y-0.5">
                  {(data.suggestions?.tips || []).slice(0, 4).map((t, i) => (
                    <li key={`tip-${i}`}>{t}</li>
                  ))}
                  {(data.suggestions?.risks || []).slice(0, 3).map((r, i) => (
                    <li key={`risk-${i}`} className="text-amber-800">{r}</li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
    </details>
  );
}

function OfferQualityDetails({ quality, loadingPreflight, hasLlm, defaultOpen = false }) {
  if (!quality) return null;
  const toneRing =
    quality.tone === "emerald"
      ? "border-emerald-200"
      : quality.tone === "rose"
        ? "border-rose-200"
        : quality.tone === "amber"
          ? "border-amber-200"
          : "border-slate-200";

  return (
    <details
      className={`rounded-lg border bg-slate-50/80 ${toneRing}`}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-medium text-slate-800">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
          Jakość oferty (AI)
          {loadingPreflight && <span className="text-xs font-normal text-slate-500">…</span>}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
            quality.percent >= 70
              ? "bg-emerald-100 text-emerald-800"
              : quality.percent >= 45
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
          }`}
        >
          {quality.percent}%
        </span>
      </summary>
      <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-600 space-y-2">
        <p>{hasLlm ? "Ocena z analizy AI." : "Ocena uproszczona (offline)."}</p>
        {(quality.missing?.length > 0 || quality.warnings?.length > 0) && (
          <ul className="space-y-0.5 text-amber-900">
            {[...(quality.missing || []), ...(quality.warnings || [])].slice(0, 3).map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        )}
        {quality.strengths?.length > 0 && (
          <ul className="space-y-0.5 text-emerald-800">
            {quality.strengths.slice(0, 2).map((item, idx) => (
              <li key={idx}>✓ {item}</li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export default function OfferForm({
  orderId,
  service,
  city,
  onSent,
  isPriority = false,
  priorityDateTime = null,
  orderUrgency = null,
  orderUrgencyTime = null,
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
  const [loadingPreflight, setLoadingPreflight] = useState(false);
  const [aiPreflightQuality, setAiPreflightQuality] = useState(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(() => {
    try { return localStorage.getItem(OFFER_FORM_AI_KEY) === "true"; } catch { return false; }
  });
  const [showQuestionsPanel, setShowQuestionsPanel] = useState(false);
  /** Użytkownik potwierdził wysyłkę poniżej progu. */
  const [offerLowQualityOverrideAck, setOfferLowQualityOverrideAck] = useState(false);
  /** Po co najmniej jednej zablokowanej (lub wymagającej mimo) próbie wysyłki — pokaż panel z CTA. */
  const [offerLowQualityBlockShown, setOfferLowQualityBlockShown] = useState(false);
  const [questionDraft, setQuestionDraft] = useState("");
  const { push: toast } = useToast();
  const {
    trackOfferFormStart,
    trackOfferStepView,
    trackOfferFormSubmit,
    trackOfferFormPreflightBlocked,
    trackOfferFormPreflightOverride,
  } = useTelemetry();
  const offerStepTracked = useRef({ 1: false, 2: false, 3: false });
  const autoAppliedAiDraftRef = useRef(false);

  const applyAiDraft = (draft = {}) => {
    const price = draft.price ?? draft.amount ?? draft.suggestedPrice?.recommended ?? draft.pricing?.suggested;
    const text = draft.message || draft.description || draft.suggestedMessage || draft.suggestions?.description;
    const date = draft.completionDate || draft.suggestedCompletionDate || draft.suggestions?.completionDate;
    if (price) setAmount(String(Math.round(Number(price))));
    if (text) setMessage(text);
    if (date) {
      const parsed = new Date(date);
      if (!Number.isNaN(parsed.getTime()) && parsed > new Date()) {
        setCompletionDate(toDatetimeLocalValue(parsed));
      }
    }
    if (Array.isArray(draft.recommendedIncludes)) setPriceIncludes(draft.recommendedIncludes);
    if (draft.recommendedContactMethod) setContactMethod(draft.recommendedContactMethod);
    if (typeof draft.isFinalPriceRecommended === 'boolean') setIsFinalPrice(draft.isFinalPriceRecommended);
    setShowAdvanced(true);
    setFieldErrors({});
    toast({ title: "Oferta AI wstawiona", description: "Sprawdź cenę, termin i opis przed wysłaniem.", variant: "success" });
  };

  useEffect(() => {
    const handler = (event) => {
      const detail = event.detail || {};
      if (String(detail.orderId || '') !== String(orderId || '')) return;
      applyAiDraft(detail.draft || detail);
    };
    window.addEventListener('applyProviderAiOfferDraft', handler);
    return () => window.removeEventListener('applyProviderAiOfferDraft', handler);
  }, [orderId]);

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

  // Sync sugerowanego terminu do state (walidacja + edycja); priorytet: priorityDateTime > urgency.
  useEffect(() => {
    if (completionDate?.trim()) return;
    if (isPriority && priorityDateTime) {
      const local = toDatetimeLocalValue(priorityDateTime);
      if (local) setCompletionDate(local);
      return;
    }
    if (orderUrgency) {
      const suggested = suggestCompletionLocalFromUrgency(orderUrgency, orderUrgencyTime);
      if (suggested) setCompletionDate(suggested);
    }
  }, [orderId, isPriority, priorityDateTime, orderUrgency, orderUrgencyTime]);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev?.[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
          const shouldAutoDraft = new URLSearchParams(window.location.search).get('aiDraft') === '1';
          if (shouldAutoDraft && !autoAppliedAiDraftRef.current) {
            autoAppliedAiDraftRef.current = true;
            applyAiDraft({
              price: data.pricing?.suggested,
              description: data.suggestions?.description,
              completionDate: data.suggestions?.completionDate,
              recommendedIncludes: data.suggestions?.recommendedIncludes,
              recommendedContactMethod: data.suggestions?.recommendedContactMethod,
              isFinalPriceRecommended: data.suggestions?.isFinalPriceRecommended
            });
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

  const offerQuality = useMemo(() => {
    let score = 35;
    const strengths = [];
    const warnings = [];
    const missing = [];
    const amountNum = Number(amount);
    const text = String(message || '').toLowerCase();

    if (amountNum > 0) {
      score += 18;
      strengths.push("Cena jest podana jasno.");
      if (priceHint && amountNum >= priceHint.suggestedLo && amountNum <= priceHint.suggestedHi) {
        score += 8;
        strengths.push("Cena mieści się w rekomendowanym zakresie.");
      } else if (priceHint && (amountNum < priceHint.suggestedLo || amountNum > priceHint.suggestedHi)) {
        warnings.push("Cena jest poza rekomendowanym zakresem - wyjaśnij w opisie, skąd wynika.");
      }
    } else {
      missing.push("Podaj cenę.");
    }

    if (
      resolveCompletionDateValue(
        completionDate,
        isPriority,
        priorityDateTime,
        orderUrgency,
        orderUrgencyTime
      )
    ) {
      score += 14;
      strengths.push("Termin realizacji jest określony.");
    } else {
      missing.push("Dodaj termin realizacji.");
    }

    if (message.trim().length >= 80) {
      score += 16;
      strengths.push("Opis jest wystarczająco konkretny.");
    } else if (message.trim().length >= 25) {
      score += 8;
      warnings.push("Opis jest krótki - dodaj zakres prac i założenia ceny.");
    } else {
      missing.push("Dodaj krótki opis oferty.");
    }

    if (/zakres|obejm|wykon|diagnoz|robocizn|materiał|material|części|czesci/.test(text)) {
      score += 8;
      strengths.push("Opis mówi, co zawiera oferta.");
    } else {
      warnings.push("Dopisz, co dokładnie zawiera cena.");
    }

    if (/gwaranc|rękojm|rekojm|popraw|odpowiedzial/.test(text)) {
      score += 5;
      strengths.push("Oferta buduje zaufanie gwarancją lub odpowiedzialnością.");
    }

    if (priceIncludes.length > 0) {
      score += 8;
      strengths.push("Cena ma doprecyzowane elementy.");
    } else {
      warnings.push("Zaznacz, czy cena obejmuje robociznę, dojazd lub materiały.");
    }

    if (contactMethod) {
      score += 5;
    } else {
      warnings.push("Wybierz sposób kontaktu, jeśli realizacja wymaga ustaleń.");
    }

    if (!isFinalPrice && !/(może|moze|zmian|po diagnoz|po oględzin|po ogledzin|części|czesci)/.test(text)) {
      warnings.push("Jeśli cena może się zmienić, wyjaśnij w opisie co może wpłynąć na koszt.");
      score -= 6;
    }

    if (aiSuggestions?.suggestions?.risks?.length > 0 && message.trim().length < 120) {
      warnings.push("AI widzi ryzyka w zleceniu - warto odnieść się do nich w opisie.");
    }

    const percent = Math.max(20, Math.min(100, Math.round(score)));
    return {
      percent,
      label: percent >= 85 ? "Bardzo mocna oferta" : percent >= 70 ? "Dobra oferta" : percent >= 55 ? "Do dopracowania" : "Słaba oferta",
      tone: percent >= 85 ? "emerald" : percent >= 70 ? "blue" : percent >= 55 ? "amber" : "rose",
      strengths: strengths.slice(0, 4),
      warnings: warnings.slice(0, 4),
      missing: missing.slice(0, 3)
    };
  }, [amount, completionDate, message, priceHint, priceIncludes, contactMethod, isFinalPrice, aiSuggestions, isPriority, priorityDateTime]);
  const displayedOfferQuality = aiPreflightQuality || offerQuality;
  const suggestedQuestions = useMemo(
    () => (Array.isArray(aiSuggestions?.suggestions?.questions) ? aiSuggestions.suggestions.questions.slice(0, 4) : []),
    [aiSuggestions]
  );

  const appendQuestionToMessage = (question) => {
    const q = String(question || "").trim();
    if (!q) return;
    const normalized = q.endsWith("?") ? q : `${q}?`;
    setMessage((prev) => {
      const base = String(prev || "").trim();
      return base ? `${base}\n- ${normalized}` : `Pytania do doprecyzowania:\n- ${normalized}`;
    });
    setQuestionDraft("");
    toast({
      title: "Pytanie dodane do oferty",
      description: "Klient zobaczy je razem z ofertą, zanim ją zaakceptuje.",
      variant: "success",
    });
  };

  useEffect(() => {
    if (!orderId || !token || user?.role !== 'provider') return;
    const amountNum = Number(amount);
    if (!amountNum && !message.trim() && !completionDate) {
      setAiPreflightQuality(null);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setLoadingPreflight(true);
        const res = await fetch(apiUrl('/api/offers/preflight-quality'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId,
            amount: amountNum || 0,
            message,
            completionDate,
            priceIncludes,
            isFinalPrice,
            contactMethod
          }),
          signal: controller.signal
        });
        if (!res.ok) throw new Error(`preflight ${res.status}`);
        const data = await res.json();
        setAiPreflightQuality(data?.quality || null);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.warn('AI preflight quality failed, using local fallback:', error);
          setAiPreflightQuality(null);
        }
      } finally {
        setLoadingPreflight(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [orderId, token, user?.role, amount, message, completionDate, priceIncludes, isFinalPrice, contactMethod]);

  // Zmiana oferty = ponowna potrzeba oceny; nie trzymaj „mimo to” do starej wersji.
  useEffect(() => {
    setOfferLowQualityOverrideAck(false);
  }, [amount, message, completionDate, priceIncludes, isFinalPrice, contactMethod]);

  // Powyżej progu: nie pokazuj stanu po blokadzie.
  const displayedQualityPct = Number(displayedOfferQuality?.percent) || 0;
  useEffect(() => {
    if (displayedQualityPct >= OFFER_QUALITY_HARD_THRESHOLD) {
      setOfferLowQualityBlockShown(false);
    }
  }, [displayedQualityPct]);

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
    
    // Walidacja terminu realizacji (uwzględnij termin klienta z priorityDateTime)
    const effectiveCompletionDate = resolveCompletionDateValue(
      completionDate,
      isPriority,
      priorityDateTime,
      orderUrgency,
      orderUrgencyTime
    );
    if (!effectiveCompletionDate) {
      errors.completionDate = "Wybierz termin realizacji";
    } else {
      const selectedDate = new Date(effectiveCompletionDate);
      const now = new Date();
      if (Number.isNaN(selectedDate.getTime())) {
        errors.completionDate = "Nieprawidłowy termin realizacji";
      } else if (selectedDate < now) {
        errors.completionDate = "Termin realizacji nie może być w przeszłości";
      }
    }
    
    return errors;
  };

  async function onSubmit() {
    if (sending) return;
    // Walidacja przed wysłaniem
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorField = Object.keys(errors)[0];
      setFormError(
        errors[firstErrorField]
          ? `Proszę poprawić błędy: ${errors[firstErrorField]}`
          : "Proszę poprawić błędy w formularzu"
      );
      // Przewiń do pierwszego błędu
      const element = document.getElementById(`offer-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    const q = Number(displayedOfferQuality?.percent) || 0;
    const belowHard =
      q > 0 && q < OFFER_QUALITY_HARD_THRESHOLD;
    if (belowHard && !offerLowQualityOverrideAck) {
      setOfferLowQualityBlockShown(true);
      setFormError("Ocena oferty jest poniżej wymaganego progu. Ulepsz ofertę albo użyj „Wyślij mimo to”.");
      trackOfferFormPreflightBlocked(
        orderId,
        q,
        Boolean(aiPreflightQuality)
      );
      return;
    }
    
    setSending(true);
    setFormError("");
    setFieldErrors({});
    try {
      const finalCompletionDate = resolveCompletionDateValue(
        completionDate,
        isPriority,
        priorityDateTime,
        orderUrgency,
        orderUrgencyTime
      );
      
      // Przygotuj informacje o cenie i kontakcie
      const priceInfo = {
        includes: priceIncludes,
        includesOther: priceIncludesOther || undefined,
        isFinal: isFinalPrice
      };
      
      const needOverrideFlag = belowHard && offerLowQualityOverrideAck;
      const offer = await postOffer({
        token,
        payload: { 
          orderId, 
          amount: Number(amount), 
          message, 
          completionDate: finalCompletionDate,
          priceInfo, // Informacje o cenie
          contactMethod, // Sposób kontaktu
          aiQuality: {
            percent: displayedOfferQuality.percent,
            label: displayedOfferQuality.label,
            tone: displayedOfferQuality.tone,
            missing: displayedOfferQuality.missing,
            warnings: displayedOfferQuality.warnings,
            strengths: displayedOfferQuality.strengths,
            ...(needOverrideFlag
              ? { lowQualityOverride: true, qualityGateThreshold: OFFER_QUALITY_HARD_THRESHOLD }
              : {}),
          },
          // paymentMethod nie jest już potrzebne - klient już wybrał przy tworzeniu zlecenia
          boost 
        }
      });
      trackOfferFormSubmit(
        orderId,
        Number(amount),
        needOverrideFlag,
        Number(displayedOfferQuality?.percent) || null
      );
      onSent?.(offer.offer);
      if (offer.pricingAdvice) {
        setPricingAdvice(offer.pricingAdvice);
      }
      setMessage("");
      setCompletionDate("");
      setBoost(false);
      setOfferLowQualityOverrideAck(false);
      setOfferLowQualityBlockShown(false);
    } catch (e) {
      if (e?.code === "offer_quality_too_low") {
        setOfferLowQualityBlockShown(true);
        setOfferLowQualityOverrideAck(false);
        setFormError(
          e?.message
            || "Jakość oferty jest poniżej wymaganego progu. Ulepsz ofertę albo użyj „Wyślij mimo to”."
        );
        return;
      }
      // Błędy limitu są obsługiwane przez backend i wysyłane jako powiadomienia
      setFormError(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  }

  const applyAiPriceOnly = () => {
    if (aiSuggestions?.pricing?.suggested) {
      setAmount(String(Math.round(aiSuggestions.pricing.suggested)));
      toast({ title: "Cena wstawiona", variant: "success" });
    }
  };

  const applyAiDescriptionOnly = () => {
    const text = aiSuggestions?.suggestions?.description;
    if (text) {
      setMessage(text);
      toast({ title: "Opis wstawiony", variant: "success" });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Wypełnij <strong className="text-slate-900">cenę</strong>, <strong className="text-slate-900">termin</strong> i opcjonalnie <strong className="text-slate-900">opis</strong>, potem wyślij ofertę.
      </p>

      {orderId && (
        <OfferAiAssistPanel
          visible={showAiSuggestions}
          onShow={() => setShowAiSuggestionsAndPersist(true)}
          onHide={() => setShowAiSuggestionsAndPersist(false)}
          loading={loadingAiSuggestions}
          data={aiSuggestions}
          onApplyAll={() =>
            applyAiDraft({
              price: aiSuggestions?.pricing?.suggested,
              description: aiSuggestions?.suggestions?.description,
              completionDate: aiSuggestions?.suggestions?.completionDate,
              recommendedIncludes: aiSuggestions?.suggestions?.recommendedIncludes,
              recommendedContactMethod: aiSuggestions?.suggestions?.recommendedContactMethod,
              isFinalPriceRecommended: aiSuggestions?.suggestions?.isFinalPriceRecommended,
            })
          }
          onApplyPrice={applyAiPriceOnly}
          onApplyDescription={applyAiDescriptionOnly}
        />
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

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
          Cena i termin
        </h3>
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
                clearFieldError("amount");
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

          <div className="flex flex-wrap items-center gap-2">
            {!bandsError && priceHint && (
              <p className="text-xs text-slate-600">
                Zakres rynkowy:{" "}
                <span className="font-semibold text-slate-900">
                  {priceHint.suggestedLo}–{priceHint.suggestedHi} zł
                </span>
                {position?.badge ? <> · <Badge type={position.badge} /></> : null}
              </p>
            )}
            {aiSuggestions?.pricing?.suggested && (
              <button
                type="button"
                onClick={applyAiPriceOnly}
                className="text-xs font-medium text-indigo-700 hover:text-indigo-900 underline"
              >
                AI: {Math.round(aiSuggestions.pricing.suggested)} zł
              </button>
            )}
          </div>

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
          
          {/* Dokładny termin klienta (zlecenie priorytetowe) */}
          {isPriority && priorityDateTime && (
            <div className="mb-2 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <div className="text-xs font-medium text-blue-900 mb-1">
                📅 Termin wybrany przez klienta (dokładny):
              </div>
              <div className="text-sm text-blue-800">
                {new Date(priorityDateTime).toLocaleString('pl-PL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Możesz zaproponować inny termin poniżej.
              </div>
            </div>
          )}

          {orderUrgency && !(isPriority && priorityDateTime) && (
            <p className="text-xs text-amber-900 rounded-lg border border-amber-100 bg-amber-50/80 px-2.5 py-2">
              Klient: <strong>{getUrgencyLabel(orderUrgency)?.label || orderUrgency}</strong> — podaj konkretną datę poniżej.{" "}
              <button
                type="button"
                className="font-semibold underline hover:no-underline"
                onClick={() => {
                  const suggested = suggestCompletionLocalFromUrgency(orderUrgency, orderUrgencyTime);
                  if (suggested) setCompletionDate(suggested);
                }}
              >
                Wstaw sugerowany termin
              </button>
            </p>
          )}

          <input
            id="offer-completion-date"
            type="datetime-local"
            value={resolveCompletionDateValue(
              completionDate,
              isPriority,
              priorityDateTime,
              orderUrgency,
              orderUrgencyTime
            )}
            onChange={(e) => {
              setCompletionDate(e.target.value);
              clearFieldError("completionDate");
            }}
            min={toDatetimeLocalValue(new Date())}
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
                ? 'Możesz zaproponować inny termin niż wybrał klient (lub zostawić termin klienta).'
                : orderUrgency
                  ? `Dopasuj się do preferencji klienta (${getUrgencyLabel(orderUrgency)?.short || orderUrgency}) — podaj konkretną datę i godzinę, kiedy skończysz pracę.`
                  : 'Kiedy możesz zakończyć zlecenie? (data i godzina)'}
              {!isPriority && !orderUrgency && ' '}np. dzisiaj 18:00, jutro po 16:00
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

        {orderPaymentPreference && (
          <p
            className={`text-xs rounded-lg px-2.5 py-2 flex items-start gap-2 ${
              orderPaymentPreference === "system"
                ? "bg-blue-50 text-blue-900 border border-blue-100"
                : "bg-amber-50 text-amber-900 border border-amber-100"
            }`}
            title={
              orderPaymentPreference === "system"
                ? "Środki w depozycie do potwierdzenia odbioru przez klienta."
                : "Rozliczenie bezpośrednio z klientem."
            }
          >
            {orderPaymentPreference === "system" ? (
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            ) : (
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            )}
            <span>
              {orderPaymentPreference === "system"
                ? "Klient wybrał Helpfli Protect (escrow)."
                : "Klient wybrał płatność poza systemem."}
            </span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
          Opis i wysłanie
        </h3>

        <OfferQualityDetails
          quality={displayedOfferQuality}
          loadingPreflight={loadingPreflight}
          hasLlm={Boolean(aiPreflightQuality)}
          defaultOpen={displayedQualityPct > 0 && displayedQualityPct < 55}
        />

        {offerLowQualityBlockShown &&
          displayedQualityPct > 0 &&
          displayedQualityPct < OFFER_QUALITY_HARD_THRESHOLD &&
          !offerLowQualityOverrideAck && (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
              role="status"
            >
              <p className="font-semibold">Oferta wymaga poprawy lub ręcznego potwierdzenia</p>
              <p className="mt-1 text-rose-800/90">
                Obecna ocena ({displayedQualityPct}%) jest poniżej {OFFER_QUALITY_HARD_THRESHOLD}%. Możesz
                dopracować cenę, termin albo opis, albo świadomie wysłać słabszą wersję oferty.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setOfferLowQualityBlockShown(false);
                    setFormError("");
                  }}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-900 shadow-sm hover:bg-rose-100/80"
                >
                  Dopasuj ofertę
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOfferLowQualityOverrideAck(true);
                    setOfferLowQualityBlockShown(false);
                    setFormError("");
                    trackOfferFormPreflightOverride(
                      orderId,
                      displayedQualityPct,
                      Boolean(aiPreflightQuality)
                    );
                    toast({
                      title: "Potwierdzono wysyłkę poniżej progu",
                      description: "Możesz nacisnąć „Wyślij ofertę do klienta” ponownie.",
                      variant: "default",
                    });
                  }}
                  className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-800"
                >
                  Wyślij mimo to
                </button>
              </div>
            </div>
          )}

        <button
          type="button"
          onClick={() => setShowQuestionsPanel((v) => !v)}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
        >
          <span>Pytania do klienta w opisie (opcjonalnie)</span>
          <span className="text-xs text-slate-500">{showQuestionsPanel ? "Ukryj" : "Pokaż"}</span>
        </button>
        {showQuestionsPanel && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
            <p className="text-xs text-slate-600">Krótkie pytania dopisują się do opisu oferty (bez telefonu/linków).</p>
            {suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={`${q}-${idx}`}
                    type="button"
                    onClick={() => appendQuestionToMessage(q)}
                    className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs text-indigo-800 hover:bg-indigo-50"
                  >
                    + {q}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={questionDraft}
                onChange={(e) => setQuestionDraft(e.target.value)}
                placeholder="Np. Czy widać numer modelu urządzenia?"
                className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                maxLength={220}
              />
              <button
                type="button"
                onClick={() => appendQuestionToMessage(questionDraft)}
                disabled={!questionDraft.trim()}
                className="h-9 rounded-lg bg-slate-800 px-3 text-sm font-medium text-white disabled:opacity-50"
              >
                Dodaj
              </button>
            </div>
          </div>
        )}

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
              clearFieldError("message");
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
          disabled={sending || hasActiveFieldErrors(fieldErrors)}
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






