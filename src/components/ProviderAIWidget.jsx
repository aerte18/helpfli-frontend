import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMySubscription } from "../api/subscriptions";
import { useBreakpointMd } from "../hooks/useBreakpointMd";
import { apiUrl } from "../lib/apiUrl";
import { useLocation } from "react-router-dom";
import { isChatContextRoute } from "../utils/chatMobileChrome";
import { useMobileHint } from "./ui/MobileHintProvider";

export default function ProviderAIWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMapMobileMode, setIsMapMobileMode] = useState(false);
  const [isMapImmersive, setIsMapImmersive] = useState(false);
  const [mapDragOffsetY, setMapDragOffsetY] = useState(0);
  const dragRef = useRef({
    active: false,
    moved: false,
    startY: 0,
    startOffsetY: 0,
  });
  const [packageType, setPackageType] = useState('PROV_FREE');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [usage, setUsage] = useState({ used: 0, limit: 20, remaining: 20 });
  const [contextNote, setContextNote] = useState("");
  const [insightBadge, setInsightBadge] = useState(0);
  const messagesEndRef = React.useRef(null);
  const isMdUp = useBreakpointMd();
  const mobileHint = useMobileHint();

  useEffect(() => {
    if (isMdUp) {
      setIsMapMobileMode(false);
      setMapDragOffsetY(0);
      return undefined;
    }

    if (location.pathname !== "/provider-home") {
      setIsMapMobileMode(false);
      setMapDragOffsetY(0);
      return undefined;
    }

    const detectMapMode = () => {
      const hasProviderMap = Boolean(document.querySelector(".qs-provider-map-stack"));
      const hasMapToggle = Boolean(document.querySelector("[data-qs-map-immersive-toggle]"));
      setIsMapMobileMode(hasProviderMap && hasMapToggle);
      setIsMapImmersive(document.body.classList.contains("qs-map-immersive"));
    };

    detectMapMode();
    const observer = new MutationObserver(detectMapMode);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", detectMapMode);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", detectMapMode);
    };
  }, [location.pathname, isMdUp]);

  // Otwórz widget z zewnątrz (np. z Konta → Moje oferty, AI Inbox na mapie)
  useEffect(() => {
    const handler = (e) => {
      const prefill = e.detail?.prefill;
      const note = e.detail?.contextNote;
      const skipHint = Boolean(e.detail?.skipHint);
      setOpen(true);
      if (typeof note === "string" && note.trim()) {
        setContextNote(note.trim());
      } else {
        setContextNote("");
      }
      if (prefill) setInput(prefill);
      if (!skipHint) {
        mobileHint?.showHint?.(
          "Asystent AI wykonawcy",
          "Pomaga pisać oferty, wyceniać zlecenia i odpowiadać klientom."
        );
      }
    };
    window.addEventListener('openProviderAi', handler);
    return () => window.removeEventListener('openProviderAi', handler);
  }, [mobileHint]);

  useEffect(() => {
    const handler = (e) => {
      const count = Number(e.detail?.count || 0);
      setInsightBadge(Number.isFinite(count) && count > 0 ? count : 0);
    };
    window.addEventListener("providerAiInsightsUpdate", handler);
    return () => window.removeEventListener("providerAiInsightsUpdate", handler);
  }, []);

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

  const clampDragY = (value) => {
    const max = Math.max(160, window.innerHeight * 0.28);
    const min = -Math.max(220, window.innerHeight * 0.35);
    return Math.min(max, Math.max(min, value));
  };

  const handlePointerDown = (e) => {
    if (!isMapMobileMode) return;
    dragRef.current.active = true;
    dragRef.current.moved = false;
    dragRef.current.startY = e.clientY;
    dragRef.current.startOffsetY = mapDragOffsetY;
  };

  const handlePointerMove = (e) => {
    if (!isMapMobileMode || !dragRef.current.active) return;
    const deltaY = e.clientY - dragRef.current.startY;
    if (Math.abs(deltaY) > 4) dragRef.current.moved = true;
    setMapDragOffsetY(clampDragY(dragRef.current.startOffsetY + deltaY));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const handleOpen = () => {
    if (isMapMobileMode && dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    mobileHint?.showHint?.(
      "Asystent AI wykonawcy",
      "Pomaga pisać oferty, wyceniać zlecenia i odpowiadać klientom."
    );
    setContextNote("");
    setOpen(true);
  };

  const glowVariants = {
    idle: {
      scale: [1, 1.02, 1],
      opacity: [0.15, 0.2, 0.15],
      transition: {
        repeat: Infinity,
        duration: 3,
        ease: [0.4, 0, 0.6, 1]
      }
    },
    hover: {
      scale: 1.1,
      opacity: 0.3,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      {!open && !isMapImmersive && !hideFloatingFab && (
      <motion.button
        onClick={handleOpen}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        whileTap={{ scale: 0.95 }}
        animate={
          isMapMobileMode
            ? { y: mapDragOffsetY }
            : { y: [0, -5, 0] }
        }
        transition={{
          y: isMapMobileMode
            ? { duration: 0.12, ease: "easeOut" }
            : { repeat: Infinity, duration: 3, ease: "easeInOut" },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-[50] shadow-2xl qs-fixed-above-mobile-tab
                   md:bottom-6 md:right-6
                   bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700
                   border-2 border-purple-400/30 backdrop-blur-sm
                   hover:shadow-3xl transition-all duration-300 overflow-hidden
                   ${isMapMobileMode ? "right-[-10px] rounded-l-full rounded-r-none" : "right-3 rounded-full"}`}
        style={{
          padding: isHovered && isMdUp ? "12px 20px" : isMdUp ? "16px" : "12px",
          width: isMapMobileMode ? "52px" : isHovered && isMdUp ? "auto" : isMdUp ? "64px" : "48px",
          height: isHovered && isMdUp ? "64px" : isMdUp ? "64px" : "48px",
        }}
        aria-label="Otwórz Asystent AI"
        data-testid="provider-ai-fab"
      >
        <span className="sr-only">Asystent AI</span>
        {insightBadge > 0 && (
          <span className="absolute right-1 top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {insightBadge > 9 ? "9+" : insightBadge}
          </span>
        )}
        
        {/* Pulsująca aureola */}
        <motion.div
          animate={isHovered ? "hover" : "idle"}
          variants={glowVariants}
          className="absolute inset-2 rounded-full blur-sm -z-10"
          style={{
            background: 'radial-gradient(circle at center, oklch(0.7 0.15 300), transparent 40%)'
          }}
        />
        
        <div className="flex items-center gap-3 relative z-10">
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2, 
              ease: "easeInOut" 
            }}
          >
            <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
          </motion.div>
          
          <AnimatePresence>
            {isHovered && isMdUp && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-white font-semibold text-sm whitespace-nowrap"
              >
                Asystent AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[60] flex items-stretch justify-center p-0 md:items-center md:justify-center md:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:rounded-none md:h-[600px] md:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-purple-50 to-pink-50">
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
                      onClick={() => {
                        setContextNote("");
                        setOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-500" />
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

