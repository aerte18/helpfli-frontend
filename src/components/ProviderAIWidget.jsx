import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMySubscription } from "../api/subscriptions";
import { apiUrl } from "../lib/apiUrl";
import { useLocation } from "react-router-dom";
import { isChatContextRoute } from "../utils/chatMobileChrome";
import AiFabLauncher from "./ui/AiFabLauncher";

export default function ProviderAIWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isMapImmersive, setIsMapImmersive] = useState(false);
  const [packageType, setPackageType] = useState('PROV_FREE');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [usage, setUsage] = useState({ used: 0, limit: 20, remaining: 20 });
  const [contextNote, setContextNote] = useState("");
  const [insightBadge, setInsightBadge] = useState(0);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    const syncImmersive = () => {
      setIsMapImmersive(document.body.classList.contains("qs-map-immersive"));
    };
    syncImmersive();
    const observer = new MutationObserver(syncImmersive);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Otwórz widget z zewnątrz (np. z Konta → Moje oferty, AI Inbox na mapie)
  useEffect(() => {
    const handler = (e) => {
      const prefill = e.detail?.prefill;
      const note = e.detail?.contextNote;
      setOpen(true);
      if (typeof note === "string" && note.trim()) {
        setContextNote(note.trim());
      } else {
        setContextNote("");
      }
      if (prefill) setInput(prefill);
    };
    window.addEventListener('openProviderAi', handler);
    return () => window.removeEventListener('openProviderAi', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const count = Number(e.detail?.count || 0);
      setInsightBadge(Number.isFinite(count) && count > 0 ? count : 0);
    };
    window.addEventListener("providerAiInsightsUpdate", handler);
    return () => window.removeEventListener("providerAiInsightsUpdate", handler);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add("qs-ai-modal-open");
    return () => document.body.classList.remove("qs-ai-modal-open");
  }, [open]);

  // Sprawdź pakiet użytkownika i pobierz statystyki użycia
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.role !== 'provider') {
        setLoading(false);
        return;
      }

      try {
        const subscription = await getMySubscription();
        const pkg = subscription?.planKey || 'PROV_FREE';
        setPackageType(pkg);
        
        // Pobierz statystyki użycia
        const token = localStorage.getItem('token');
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        try {
          const usageRes = await fetch(apiUrl(`/api/usage/me?month=${encodeURIComponent(monthKey)}`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            // Użyj providerAiChatQueries jeśli dostępne
            if (usageData.usage?.providerAiChatQueries) {
              const chatUsage = usageData.usage.providerAiChatQueries;
              setUsage({
                used: chatUsage.used || 0,
                limit: chatUsage.limit === 'Nielimitowane' ? Infinity : (typeof chatUsage.limit === 'number' ? chatUsage.limit : 20),
                remaining: chatUsage.remaining === 'Nielimitowane' ? Infinity : (typeof chatUsage.remaining === 'number' ? chatUsage.remaining : 20)
              });
            } else {
              // Fallback jeśli nie ma danych
              const limit = pkg === 'PROV_FREE' ? 20 : Infinity;
              setUsage({
                used: 0,
                limit,
                remaining: limit
              });
            }
          }
        } catch (e) {
          console.error('Błąd pobierania statystyk:', e);
          // Fallback
          const limit = pkg === 'PROV_FREE' ? 20 : Infinity;
          setUsage({
            used: 0,
            limit,
            remaining: limit
          });
        }
      } catch (error) {
        console.error('Błąd sprawdzania subskrypcji:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  // Inicjalizuj wiadomość powitalną
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: 'Cześć! 👋 Jestem Asystentem AI Helpfli. Pomogę Ci przygotować dobrą ofertę (cena, zakres, komunikacja). O co chcesz zapytać?'
      }]);
    }
  }, [open]);

  // Scroll do końca przy nowych wiadomościach
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(apiUrl('/api/provider-ai-chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((m) => ({ role: m.role, text: m.text || m.content }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Sprawdź czy to błąd limitu
        if (errorData.limit && errorData.used !== undefined) {
          setUsage({
            used: errorData.used,
            limit: errorData.limit,
            remaining: 0
          });
          
          // Pokaż informację o upsell
          if (errorData.upsell) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              text: `❌ ${errorData.message || 'Przekroczono limit zapytań'}\n\n💡 ${errorData.upsell.title}\n${errorData.upsell.description}\n\nPrzejdź do /account/subscriptions aby ulepszyć pakiet.`
            }]);
            return;
          }
        }
        
        throw new Error(errorData.message || 'Błąd wysyłania wiadomości');
      }

      const data = await response.json();
      const mainText = typeof data.response === 'string' ? data.response : (data.response?.message ?? 'Przepraszam, nie udało się uzyskać odpowiedzi.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: mainText,
        agents: data.agents || null
      }]);
      
      // Zaktualizuj statystyki użycia
      if (data.usage) {
        setUsage({
          used: data.usage.used,
          limit: data.usage.limit,
          remaining: data.usage.remaining
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Błąd: ${error.message || 'Nie udało się wysłać wiadomości'}`
      }]);
    } finally {
      setSending(false);
    }
  };

  const quickQuestions = [
    'Pokaż najlepsze zlecenia dla mnie',
    'Gdzie mam największą szansę zarobić?',
    'Jak poprawić skuteczność moich ofert?',
    'Napisz krótką odpowiedź do klienta'
  ];

  // Ukryj widget jeśli nie jest providerem
  if (loading || user?.role !== 'provider') {
    return null;
  }

  if (isChatContextRoute(location)) {
    return null;
  }

  const isAccountRoute = location.pathname.startsWith("/account");
  const hideFloatingFab = isAccountRoute && !open;

  const isFree = packageType === 'PROV_FREE';
  const isStandard = packageType === 'PROV_STD';
  const isPro = packageType === 'PROV_PRO';
  const hasUnlimited = isStandard || isPro;

  const handleOpen = () => {
    setContextNote("");
    setOpen(true);
  };

  return (
    <>
      <AiFabLauncher
        testId="provider-ai-fab"
        variant="provider"
        hidden={open || isMapImmersive || hideFloatingFab}
        onClick={handleOpen}
        badge={
          insightBadge > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
              {insightBadge > 9 ? "9+" : insightBadge}
            </span>
          ) : null
        }
      />

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1300]"
              onClick={() => {
                setContextNote("");
                setOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[1300] flex items-stretch justify-center p-0 md:items-center md:justify-center md:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:rounded-none md:h-[600px] md:rounded-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b bg-gradient-to-r from-purple-50 to-pink-50 p-4 pt-[max(1rem,env(safe-area-inset-top))] md:p-5 md:pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Asystent AI</div>
                      <div className="text-sm text-slate-600">Pomoc w tworzeniu ofert</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isFree && (
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">{usage.used}</span> / {usage.limit} zapytań
                      </div>
                    )}
                    {hasUnlimited && (
                      <div className="text-sm text-green-600 font-medium">
                        Nielimitowane
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setContextNote("");
                        setOpen(false);
                      }}
                      className="rounded-full bg-white p-2.5 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-colors qs-tap-target"
                      aria-label="Zamknij asystenta AI"
                    >
                      <X className="w-5 h-5 text-slate-700" />
                    </button>
                  </div>
                </div>

                {contextNote && (
                  <div className="border-b border-indigo-100 bg-indigo-50/80 px-4 py-2.5 text-xs leading-relaxed text-indigo-900">
                    <span className="font-semibold">AI Inbox:</span> {contextNote}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-gray-100 text-slate-900 border border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                      </div>
                      {msg.role === 'assistant' && msg.agents && (msg.agents.offer || msg.agents.pricing) && (
                        <div className="mt-2 max-w-[85%] rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-left">
                          {msg.agents.offer?.suggestedPrice && (
                            <div className="text-sm text-purple-900">
                              <span className="font-medium">💰 Sugerowana cena:</span> {msg.agents.offer.suggestedPrice.recommended ?? '—'} PLN
                              {msg.agents.offer.suggestedTimeline && <><br /><span className="font-medium">⏱️ Termin:</span> {msg.agents.offer.suggestedTimeline}</>}
                            </div>
                          )}
                          {msg.agents.pricing?.suggestedRange && !msg.agents.offer?.suggestedPrice && (
                            <div className="text-sm text-purple-900">
                              <span className="font-medium">💰 Sugerowana cena:</span> {msg.agents.pricing.suggestedRange.recommended ?? '—'} PLN (zakres: {msg.agents.pricing.suggestedRange.min}-{msg.agents.pricing.suggestedRange.max} PLN)
                            </div>
                          )}
                          {msg.agents.offer?.firstMessageSuggestion && (
                            <div className="mt-1.5 text-xs text-indigo-800 border-t border-indigo-100 pt-2">
                              <span className="font-medium">✉️ Pierwsze zdanie do klienta:</span> „{msg.agents.offer.firstMessageSuggestion}”
                            </div>
                          )}
                          {(msg.agents.offer?.tips?.length || msg.agents.pricing?.tips?.length) ? (
                            <div className="mt-1.5 text-xs text-purple-700">
                              💡 {[...(msg.agents.offer?.tips || []), ...(msg.agents.pricing?.tips || [])].slice(0, 2).join(' • ')}
                            </div>
                          ) : null}
                        </div>
                      )}
                      {msg.role === 'assistant' && msg.agents?.searchOrders?.orders?.length > 0 && (
                        <div className="mt-2 max-w-[85%] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left">
                          <div className="text-xs font-medium text-emerald-800 mb-2">
                            📋 {msg.agents.searchOrders.sortBy === 'earning_potential' ? 'Zlecenia z najwyższym budżetem' : 'Zlecenia dopasowane do Ciebie'}
                          </div>
                          <ul className="space-y-1.5 text-sm text-emerald-900">
                            {msg.agents.searchOrders.orders.slice(0, 10).map((o) => (
                              <li key={o.id}>
                                <Link to={`/orders/${o.id}`} className="block rounded px-2 py-1 hover:bg-emerald-100/80">
                                  <span className="font-medium">{o.service || 'Usługa'}</span>
                                  {o.city && <span className="text-emerald-700"> · {o.city}</span>}
                                  {(o.budgetMax != null || o.budgetMin != null) && (
                                    <span className="text-emerald-600"> · {o.budgetMin != null ? `${o.budgetMin}` : '?'}–{o.budgetMax != null ? `${o.budgetMax}` : '?'} zł</span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-xl px-4 py-2.5 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-purple-600"></div>
                          <span className="text-sm text-slate-600">Piszę...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick questions */}
                {messages.length === 1 && (
                  <div className="px-5 pb-3 border-t bg-gray-50">
                    <div className="text-sm text-slate-600 mb-2 mt-3">Szybkie pytania:</div>
                    <div className="space-y-2">
                      {quickQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInput(q)}
                          className="w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t bg-white">
                  {isFree && usage.remaining === 0 && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-sm text-amber-800">
                        <strong>Limit wyczerpany</strong> - Użyłeś wszystkie {usage.limit} zapytań w tym miesiącu.
                      </div>
                      <a 
                        href="/account/subscriptions" 
                        className="text-sm text-amber-700 underline mt-1 inline-block"
                      >
                        Ulepsz pakiet aby uzyskać nielimitowany dostęp →
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Zadaj pytanie..."
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      disabled={sending || (isFree && usage.remaining === 0)}
                    />
                    <button
                      type="submit"
                      disabled={sending || !input.trim() || (isFree && usage.remaining === 0)}
                      className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                    >
                      Wyślij
                    </button>
                  </div>
                  {isFree && usage.remaining > 0 && (
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      Pozostało {usage.remaining} z {usage.limit} zapytań w tym miesiącu
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

