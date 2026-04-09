import { apiUrl } from "@/lib/apiUrl";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createOrder } from "../../api/orders";
import LiveCameraAI from "../LiveCameraAI";
import ChatBubble, { TypingBubble } from "../ChatBubble";
import { Sparkles, X, Paperclip, Send, Video, Loader2, AlertTriangle } from "lucide-react";
import { onAI, closeAI } from "../../ai/chat/bus";
import { companyAiChat } from "../../api/companies";

/**
 * Ujednolicony komponent Asystenta AI - używany wszędzie w aplikacji
 * Wspiera tryby: 'page' (pełna strona), 'modal' (modal overlay), 'inline' (wbudowany)
 */
export default function UnifiedAIConcierge({ 
  mode: initialMode = 'page', // 'page' | 'modal' | 'inline'
  open: initialOpen = true, 
  onClose, 
  seedQuery = "",
  onCreateOrder,
  attachBus = false // Czy nasłuchiwać na bus.openAI
}) {
  const [mode, setMode] = useState(initialMode);
  // Używaj prop open bezpośrednio jeśli nie jest attachBus (kontrolowany komponent)
  // W przeciwnym razie używaj stanu wewnętrznego
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const open = attachBus ? internalOpen : initialOpen;
  const [input, setInput] = useState(seedQuery || "");
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [submittingOneClick, setSubmittingOneClick] = useState(false);
  const [companyId, setCompanyId] = useState(undefined); // undefined = nie sprawdzono, null = brak firmy, string = id firmy
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Dla użytkownika firmy: pobierz companyId (żeby pokazać Asystenta dla firmy zamiast klienta)
  useEffect(() => {
    if (!user || !open) return;
    const isCompanyUser = user.role === 'company_owner' || user.role === 'company_manager';
    if (!isCompanyUser) {
      setCompanyId(null);
      return;
    }
    if (companyId !== undefined) return; // już mamy wynik
    const token = localStorage.getItem('token');
    fetch(apiUrl(`/api/companies`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        const id = data.success && data.companies?.length ? data.companies[0]._id : null;
        setCompanyId(id);
      })
      .catch(() => setCompanyId(null));
  }, [user, open, companyId]);

  // Integracja z bus system (dla AIBar, AIAssistant, etc.)
  useEffect(() => {
    if (!attachBus) return;
    
    const unsubscribe = onAI((evt) => {
      if (evt.type === 'open') {
        setMode(evt.mode || 'modal');
        setInternalOpen(true);
        if (evt.prefill) setInput(evt.prefill);
      }
      if (evt.type === 'close') {
        setInternalOpen(false);
        if (onClose) onClose();
      }
    });
    
    return unsubscribe;
  }, [attachBus, onClose]);

  useEffect(() => {
    if (seedQuery && open) setInput(seedQuery);
  }, [seedQuery, open]);

  // Inicjalizacja AI – powitalna wiadomość zależna od roli (firma vs klient)
  const clientWelcome = "Cześć! 👋 W czym mogę pomóc? Opisz swój problem, a znajdę najlepszego wykonawcę w Twojej okolicy.";
  const companyWelcome = "Cześć! 👋 Jestem Asystentem AI dla Twojej firmy. Mogę podsumować zespół i obciążenie, podpowiedzieć komu przypisać zlecenie, wskazać gdzie są faktury i ustawienia. O co chcesz zapytać?";
  useEffect(() => {
    if (!open || msgs.length !== 0) return;
    if (companyId === undefined) {
      setIsInitializing(true);
      return;
    }
    setIsInitializing(true);
    const timer = setTimeout(() => {
      setMsgs([{ role: "assistant", text: companyId ? companyWelcome : clientWelcome }]);
      setIsInitializing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, msgs.length, companyId]);

  // Auto-wysłanie seedQuery
  useEffect(() => {
    if (open && seedQuery && seedQuery.trim() && msgs.length === 1) {
      const timer = setTimeout(() => ask(), 2000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/ai/concierge/upload`), {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAttachedFiles(prev => [...prev, ...data.files]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const ask = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      const proceed = confirm('Aby użyć Asystenta AI, musisz się zalogować.\n\n📌 Zarejestruj się za darmo i otrzymaj 50 darmowych zapytań do AI!\n\nCzy chcesz się zalogować teraz?');
      if (proceed) {
        navigate("/login?next=" + encodeURIComponent("/concierge"));
      }
      return;
    }
    
    const q = input.trim();
    const imageUrls = attachedFiles.map(f => f.url);
    
    setMsgs((m) => [...m, { 
      role: "user", 
      text: q || (attachedFiles.length > 0 ? `Przesłano ${attachedFiles.length} plik(ów) do analizy` : ''),
      files: attachedFiles.length > 0 ? attachedFiles : undefined
    }]);
    setBusy(true);
    
    try {
      const conversationHistory = msgs
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.text || '' }))
        .slice(-10);

      // Tryb firmy: użyj Asystenta AI dla firmy (ten sam co w Panelu firmy)
      if (companyId) {
        const data = await companyAiChat(companyId, q || (attachedFiles.length > 0 ? `Przesłano ${attachedFiles.length} plik(ów)` : ''), conversationHistory);
        const replyText = data.response || 'Brak odpowiedzi.';
        setMsgs((m) => [...m, {
          role: 'assistant',
          text: replyText,
          actionCard: data.actionCard || null
        }]);
        setBusy(false);
        setInput('');
        setAttachedFiles([]);
        return;
      }

      // Tryb klienta: Concierge V2 lub V1
      const USE_V2 = import.meta.env.VITE_USE_AI_V2 !== 'false';
      const API_URL = import.meta.env.VITE_API_URL || '';
      
      let endpoint, requestBody;
      
      let sessionId = null;
      try {
        sessionId = localStorage.getItem('ai_concierge_session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          localStorage.setItem('ai_concierge_session_id', sessionId);
        }
      } catch (e) {
        sessionId = `session_${Date.now()}`;
      }
      
      if (USE_V2) {
        endpoint = `${API_URL}/api/ai/concierge/v2`;
        requestBody = {
          messages: conversationHistory,
          sessionId,
          userContext: { location: null },
          imageUrls: imageUrls
        };
      } else {
        endpoint = `${API_URL}/api/ai/concierge/analyze`;
        requestBody = {
          description: q || 'Analizuj przesłane pliki i zaproponuj rozwiązanie',
          imageUrls: imageUrls,
          conversationHistory: conversationHistory
        };
      }
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Limity są obsługiwane przez backend i wysyłane jako powiadomienia
        // Nie pokazujemy alertów w UI
        throw new Error(errorData.message || 'Błąd podczas analizy');
      }
      
      const data = await res.json();
      
      // Obsługa odpowiedzi V2 (nowy format)
      if (USE_V2 && data.result) {
        const result = data.result;
        const agents = data.agents || {};
        
        // Zapisz sessionId i messageId dla feedbacku (jeśli dostępne)
        const sessionId = data.sessionId || `session_${Date.now()}`;
        const messageId = data.messageId || `msg_${Date.now()}`;
        
        // Zapisz sessionId w localStorage dla kolejnych requestów
        try {
          localStorage.setItem('ai_concierge_session_id', sessionId);
        } catch (e) {
          // Ignore localStorage errors
        }
        
        // Przygotuj analysisResult z danymi z agentów
        setAnalysisResult({
          ...data,
          serviceCandidate: result.detectedService ? {
            code: result.detectedService,
            name: result.detectedService
          } : null,
          urgency: result.urgency,
          diySteps: agents.diy?.steps || [],
          dangerFlags: result.safety?.flag ? [result.safety.reason] : [],
          pricing: agents.pricing || null, // Widełki cenowe
          diagnostic: agents.diagnostic || null, // Ocena ryzyka
          matching: agents.matching || null, // Wykonawcy
          orderDraft: agents.orderDraft || null // Draft zlecenia
        });
        
        // Główna odpowiedź = naturalna wypowiedź agenta (jak rozmowa). Szczegóły (ceny, wykonawcy) w blokach poniżej.
        const replyText = result.reply || "Analizuję Twój problem...";

setMsgs((m) => [...m, {
          role: "assistant",
          text: replyText,
          nextStep: result.nextStep,
          showCameraButton: true,
          agents: agents,
          toolUsed: data.toolUsed || null,
          toolResult: data.toolResult || null,
          sessionId: sessionId,
          messageId: messageId,
          requestId: data.requestId
        }]);
        
        // Jeśli są pytania, dodaj je jako sugestie
        if (result.questions && result.questions.length > 0) {
          // Pytania można później wyświetlić jako szybkie odpowiedzi
          console.log('Pytania do wyświetlenia:', result.questions);
        }
      } else {
        // Obsługa odpowiedzi V1 (stary format - backward compatibility)
        setAnalysisResult(data);
        
        const text = data?.serviceCandidate?.name || 
                    data?.diySteps?.[0]?.text || 
                    "Analizuję Twój problem... Mogę zaproponować rozwiązanie lub znaleźć wykonawcę.";
        setMsgs((m) => [...m, { role: "assistant", text, showCameraButton: true, sponsorAds: data?.sponsorAds }]);
      }
    } catch (error) {
      console.error('Asystent AI error:', error);
      setMsgs((m) => [...m, { 
        role: "assistant", 
        text: error.message || "Ups, spróbuj ponownie." 
      }]);
    } finally {
      setBusy(false);
      setInput("");
      setAttachedFiles([]);
    }
  };

  // Style w zależności od trybu
  const containerClass = mode === 'modal' 
    ? "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
    : mode === 'inline'
    ? "w-full"
    : "min-h-screen bg-gray-50";

  const cardClass = mode === 'modal'
    ? "w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[72dvh] max-h-[72dvh] sm:h-[75vh] sm:max-h-[600px] relative z-50"
    : mode === 'inline'
    ? "w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[600px] relative z-50"
    : "bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)] relative z-50";

  const wrapperClass = mode === 'page'
    ? "container mx-auto py-8 max-w-4xl"
    : "";

  const content = (
    <div className={cardClass} style={{ pointerEvents: 'auto' }}>
      {/* Header - profesjonalny */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-white text-lg">Asystent AI</div>
            <div className="text-xs text-white/80">{companyId ? 'Asystent dla firmy' : 'Asystent Helpfli'}</div>
          </div>
        </div>
                 <button
                   onClick={() => {
                     if (attachBus) {
                       setInternalOpen(false);
                       closeAI();
                     } else {
                       if (onClose) {
                         onClose();
                       }
                     }
                   }}
                   className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                   aria-label="Zamknij"
                 >
                   <X className="w-5 h-5 text-white" />
                 </button>
      </div>

      {/* Messages area */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 min-h-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,.02) 20px, rgba(0,0,0,.02) 21px)' }}
      >
        {isInitializing ? (
          <div className="flex items-center justify-center h-full min-h-[220px] sm:min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-500">Inicjalizuję AI...</p>
            </div>
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[220px] sm:min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">Witaj w Asystencie AI!</p>
              <p className="text-sm text-gray-500">{companyId ? 'Zadaj pytanie o zespół, zlecenia lub ustawienia firmy' : 'Opisz swój problem, a pomogę znaleźć rozwiązanie'}</p>
            </div>
          </div>
        ) : (
          <>
            {msgs.map((m, i) => (
              <div key={i} className="w-full">
                {m.role === "user" ? (
                  <>
                    <ChatBubble role="user" text={m.text} ts={m.createdAt || Date.now()} />
                    {m.files && m.files.length > 0 && (
                      <div className="mt-2 flex justify-end">
                        <div className="space-y-2 max-w-[80%]">
                          {m.files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                              <span className="text-indigo-600">
                                {file.type === 'image' ? '🖼️' : '🎥'}
                              </span>
                              <span className="truncate text-gray-700">{file.originalName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full">
                    <ChatBubble role="assistant" text={m.text} ts={m.createdAt || Date.now()} />
                    {/* Lista zleceń z narzędzia listMyOrders – linki do szczegółów */}
                    {m.toolResult?.orders && m.toolResult.orders.length > 0 && (
                      <div className="mt-3 ml-12 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 max-w-md">
                        <div className="text-xs font-semibold text-indigo-800 mb-2">Twoje zlecenia</div>
                        <ul className="space-y-2">
                          {m.toolResult.orders.slice(0, 10).map((order) => (
                            <li key={order.id}>
                              <a
                                href={order.link?.startsWith('http') ? order.link : (order.link || `/orders/${order.id}`)}
                                onClick={(e) => {
                                  if (!order.link?.startsWith('http')) {
                                    e.preventDefault();
                                    navigate(order.link || `/orders/${order.id}`);
                                  }
                                }}
                                className="block text-sm text-indigo-700 hover:text-indigo-900 hover:underline"
                              >
                                {order.description || order.service || `Zlecenie ${order.id}`} – <span className="font-medium">{order.status}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                        {m.toolResult.summary && (
                          <p className="text-xs text-indigo-600 mt-2">{m.toolResult.summary}</p>
                        )}
                      </div>
                    )}
                    {/* Karta akcji Asystenta dla firmy (np. „Zobacz zlecenia firmy”) */}
                    {m.actionCard && (
                      <div className="mt-2 ml-12">
                        <button
                          type="button"
                          onClick={() => navigate(m.actionCard.path)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          → {m.actionCard.label}
                        </button>
                      </div>
                    )}
                    {/* Przyciski feedback (👍👎) */}
                    {m.messageId && (
                      <div className="mt-2 ml-12 flex gap-2">
                        <button
                          onClick={async (e) => {
                            try {
                              const API_URL = import.meta.env.VITE_API_URL || '';
                              const token = localStorage.getItem('token');
                              const feedbackRes = await fetch(`${API_URL}/api/ai/feedback`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                  sessionId: m.sessionId,
                                  messageId: m.messageId,
                                  agent: 'concierge',
                                  quickFeedback: 'positive',
                                  wasHelpful: true
                                })
                              });
                              if (feedbackRes.ok) {
                                const btn = e.target;
                                btn.textContent = '✓ Dziękujemy!';
                                btn.disabled = true;
                              }
                            } catch (err) {
                              console.error('Feedback error:', err);
                            }
                          }}
                          className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                          title="Ta odpowiedź była pomocna"
                        >
                          👍
                        </button>
                        <button
                          onClick={async (e) => {
                            try {
                              const API_URL = import.meta.env.VITE_API_URL || '';
                              const token = localStorage.getItem('token');
                              const feedbackRes = await fetch(`${API_URL}/api/ai/feedback`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                  sessionId: m.sessionId,
                                  messageId: m.messageId,
                                  agent: 'concierge',
                                  quickFeedback: 'negative',
                                  wasHelpful: false
                                })
                              });
                              if (feedbackRes.ok) {
                                const btn = e.target;
                                btn.textContent = '✓ Dziękujemy!';
                                btn.disabled = true;
                              }
                            } catch (err) {
                              console.error('Feedback error:', err);
                            }
                          }}
                          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          title="Ta odpowiedź nie była pomocna"
                        >
                          👎
                        </button>
                      </div>
                    )}
                    
                    {/* Przyciski akcji na podstawie nextStep (V2) */}
                    {m.nextStep && (
                      <div className="mt-3 ml-12 flex flex-wrap gap-2">
                        {m.nextStep === 'suggest_diy' && (
                          <button
                            onClick={() => {
                              // Przewiń do sekcji DIY Steps jeśli są w analysisResult
                              if (analysisResult?.diySteps?.length > 0) {
                                document.querySelector('[data-diy-section]')?.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Zobacz kroki DIY</span>
                          </button>
                        )}
                        
                        {m.nextStep === 'suggest_providers' && (
                          <button
                            onClick={() => {
                              if (onCreateOrder && analysisResult?.serviceCandidate) {
                                onCreateOrder({
                                  description: input || 'Problem wykryty przez Asystenta AI',
                                  service: analysisResult.serviceCandidate.code,
                                  urgency: analysisResult.urgency || 'normal'
                                });
                              } else {
                                navigate('/create-order', {
                                  state: {
                                    prefill: {
                                      description: input || 'Problem wykryty przez Asystenta AI',
                                      service: analysisResult?.serviceCandidate?.code,
                                      urgency: analysisResult?.urgency || 'normal'
                                    },
                                    fromAI: true
                                  }
                                });
                              }
                              if (mode === 'modal' && onClose) onClose();
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Znajdź wykonawcę</span>
                          </button>
                        )}
                        
                        {m.nextStep === 'show_pricing' && (
                          <>
                            {m.agents?.pricing?.ranges ? (
                              <div className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-2">
                                <div className="font-semibold text-gray-800 mb-3">💰 Widełki cenowe</div>
                                <div className="grid grid-cols-3 gap-3">
                                  {['basic', 'standard', 'pro'].map(level => {
                                    const range = m.agents.pricing.ranges[level];
                                    if (!range) return null;
                                    return (
                                      <div key={level} className="bg-white rounded-lg p-3 border border-yellow-200">
                                        <div className="text-xs font-medium text-gray-600 mb-1 uppercase">{level}</div>
                                        <div className="text-lg font-bold text-gray-900">{range.min}-{range.max} PLN</div>
                                        <ul className="text-xs text-gray-600 mt-2 space-y-1">
                                          {range.whatYouGet?.slice(0, 2).map((item, i) => (
                                            <li key={i}>• {item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    );
                                  })}
                                </div>
                                {m.agents.pricing.priceDrivers && m.agents.pricing.priceDrivers.length > 0 && (
                                  <div className="mt-3 text-xs text-gray-600">
                                    <strong>Czynniki:</strong> {m.agents.pricing.priceDrivers.slice(0, 3).join(', ')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  alert('Ładuję widełki cenowe...');
                                }}
                                className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                              >
                                <span>💰</span>
                                <span>Zobacz widełki cenowe</span>
                              </button>
                            )}
                          </>
                        )}
                        
                        {m.nextStep === 'create_order' && (
                          <button
                            onClick={() => {
                              if (onCreateOrder && analysisResult?.serviceCandidate) {
                                onCreateOrder({
                                  description: input || 'Problem wykryty przez Asystenta AI',
                                  service: analysisResult.serviceCandidate.code,
                                  urgency: analysisResult.urgency || 'normal',
                                  diySteps: analysisResult.diySteps,
                                  parts: analysisResult.parts
                                });
                              } else {
                                navigate('/create-order', {
                                  state: {
                                    prefill: {
                                      description: input || 'Problem wykryty przez Asystenta AI',
                                      service: analysisResult?.serviceCandidate?.code,
                                      urgency: analysisResult?.urgency || 'normal',
                                      diySteps: analysisResult?.diySteps,
                                      parts: analysisResult?.parts
                                    },
                                    fromAI: true
                                  }
                                });
                              }
                              if (mode === 'modal' && onClose) onClose();
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Utwórz zlecenie</span>
                          </button>
                        )}
                        
                        {m.showCameraButton && (
                          <button
                            onClick={() => setShowLiveCamera(true)}
                            className="px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Video className="w-4 h-4" />
                            <span>Otwórz kamerę AI</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Fallback dla V1 (bez nextStep) */}
                    {!m.nextStep && m.showCameraButton && (
                      <div className="mt-3 ml-12 flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowLiveCamera(true)}
                          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Video className="w-4 h-4" />
                          <span>Otwórz kamerę AI</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Wyświetlanie wyników analizy */}
            {analysisResult && (
              <div className="mt-4 space-y-3">
                {/* Helpfli poleca: DIY / wezwij fachowca */}
                {analysisResult.recommendation && (
                  <div className={`rounded-xl border p-4 ${
                    analysisResult.recommendation.type === 'provider'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {analysisResult.recommendation.type === 'provider'
                        ? 'Helpfli poleca: wezwij fachowca'
                        : 'Helpfli poleca: DIY'}
                    </div>
                    <p className="text-sm mt-1 opacity-90">
                      {analysisResult.recommendation.reason}
                    </p>
                  </div>
                )}
                {/* Sugerowana usługa */}
                {analysisResult.serviceCandidate && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <p className="text-xs text-indigo-600 font-medium mb-1">Sugerowana usługa</p>
                    <p className="font-semibold text-indigo-900">{analysisResult.serviceCandidate.name}</p>
                    {analysisResult.serviceCandidate.description && (
                      <p className="text-sm text-indigo-700 mt-1">{analysisResult.serviceCandidate.description}</p>
                    )}
                  </div>
                )}
                
                {/* DIY Steps - z agenta DIY */}
                {analysisResult.diySteps && analysisResult.diySteps.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm" data-diy-section>
                    <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      🔧 Kroki do wykonania
                      {analysisResult.diy && (
                        <span className="text-xs font-normal text-gray-500">
                          ({analysisResult.diy.difficulty} • ~{analysisResult.diy.estimatedTimeMinutes} min)
                        </span>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {analysisResult.diySteps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            readOnly
                          />
                          <span className="flex-1 leading-relaxed text-foreground">{step.text || step}</span>
                        </li>
                      ))}
                    </ul>
                    {analysisResult.diy?.tools && analysisResult.diy.tools.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-1">🛠️ Potrzebne narzędzia:</div>
                        <div className="text-xs text-gray-600">{analysisResult.diy.tools.join(', ')}</div>
                      </div>
                    )}
                    {analysisResult.diy?.stopConditions && analysisResult.diy.stopConditions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-red-800 mb-1">⚠️ Kiedy przerwać:</div>
                        <ul className="text-xs text-red-700 space-y-1">
                          {analysisResult.diy.stopConditions.map((condition, idx) => (
                            <li key={idx}>• {condition}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Pricing - Widełki cenowe z agenta */}
                {analysisResult.pricing?.ranges && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                    <div className="font-semibold text-gray-800 mb-3">💰 Widełki cenowe</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {['basic', 'standard', 'pro'].map(level => {
                        const range = analysisResult.pricing.ranges[level];
                        if (!range) return null;
                        return (
                          <div key={level} className="bg-white rounded-lg p-3 border border-yellow-200">
                            <div className="text-xs font-medium text-gray-600 mb-1 uppercase">{level}</div>
                            <div className="text-lg font-bold text-gray-900">{range.min}-{range.max} PLN</div>
                            <ul className="text-xs text-gray-600 mt-2 space-y-1">
                              {range.whatYouGet?.map((item, i) => (
                                <li key={i}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                    {analysisResult.pricing.expressFee && (
                      <div className="mt-3 text-sm text-gray-700">
                        <strong>Dopłata ekspresowa:</strong> {analysisResult.pricing.expressFee.min}-{analysisResult.pricing.expressFee.max} PLN ({analysisResult.pricing.expressFee.note})
                      </div>
                    )}
                    {analysisResult.pricing.priceDrivers && analysisResult.pricing.priceDrivers.length > 0 && (
                      <div className="mt-3 text-xs text-gray-600">
                        <strong>Czynniki wpływające na cenę:</strong> {analysisResult.pricing.priceDrivers.slice(0, 4).join(', ')}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Matching - Wykonawcy z agenta */}
                {analysisResult.matching?.topProviders && analysisResult.matching.topProviders.length > 0 && (
                  <div className="bg-white border border-indigo-200 rounded-xl p-4">
                    <div className="font-semibold text-indigo-900 mb-3">👥 Polecani wykonawcy</div>
                    <div className="space-y-3">
                      {analysisResult.matching.topProviders.slice(0, 3).map((provider, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{provider.name}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {provider.rating > 0 && `⭐ ${provider.rating.toFixed(1)} • `}
                                {provider.distanceKm > 0 && `${provider.distanceKm.toFixed(1)} km • `}
                                Poziom: {provider.level}
                              </div>
                            </div>
                          </div>
                          {provider.reason && provider.reason.length > 0 && (
                            <div className="text-xs text-indigo-700 mt-2">
                              💡 {provider.reason[0]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {analysisResult.matching.topProviders.length > 3 && (
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        + {analysisResult.matching.topProviders.length - 3} więcej wykonawców
                      </div>
                    )}
                  </div>
                )}

                {/* Reklamy / Polecane sklepy i usługi */}
                {analysisResult.sponsorAds && analysisResult.sponsorAds.length > 0 && (
                  <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
                    <div className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <span>🏪</span> Polecane dla Ciebie
                    </div>
                    <div className="space-y-3">
                      {analysisResult.sponsorAds.map((ad) => (
                        <a
                          key={ad.id}
                          href={ad.link || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/50 hover:bg-amber-100/70 transition-colors text-left"
                        >
                          {ad.imageUrl && (
                            <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white border border-amber-200">
                              <img src={ad.imageUrl.startsWith('http') ? ad.imageUrl : `${import.meta.env.VITE_API_URL || ''}${ad.imageUrl}`} alt={ad.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{ad.title}</div>
                            {ad.description && <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{ad.description}</div>}
                            <span className="inline-block mt-2 text-xs font-medium text-amber-700">{ad.ctaText || 'Zobacz ofertę'}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Diagnostic - Ocena ryzyka */}
                {analysisResult.diagnostic && (
                  <div className={`border rounded-xl p-4 ${
                    analysisResult.diagnostic.risk === 'high' 
                      ? 'bg-red-50 border-red-200' 
                      : analysisResult.diagnostic.risk === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="font-semibold mb-2">
                      {analysisResult.diagnostic.risk === 'high' ? '⚠️ Wysokie ryzyko' : 
                       analysisResult.diagnostic.risk === 'medium' ? '⚡ Średnie ryzyko' : 
                       '✅ Niskie ryzyko'}
                    </div>
                    {analysisResult.diagnostic.immediateActions && analysisResult.diagnostic.immediateActions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium mb-1">Działania natychmiastowe:</div>
                        <ul className="text-xs space-y-1">
                          {analysisResult.diagnostic.immediateActions.map((action, idx) => (
                            <li key={idx}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.diagnostic.rationale && analysisResult.diagnostic.rationale.length > 0 && (
                      <div className="mt-2 text-xs">
                        <strong>Powód:</strong> {analysisResult.diagnostic.rationale[0]}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Parts */}
                {analysisResult.parts && analysisResult.parts.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="font-semibold text-foreground mb-2">🛒 Części przydatne do naprawy</div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {analysisResult.parts.map((part, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{part.name} × {part.qty}</span>
                          <span className="text-foreground">{part.approxPrice ?? '—'} {part.unit || ''}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-muted-foreground mt-2">Kupisz w popularnych marketach (Castorama / OBI / Leroy Merlin).</div>
                  </div>
                )}
                
                {/* Danger Flags */}
                {analysisResult.dangerFlags && analysisResult.dangerFlags.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-800" />
                      <p className="text-sm font-medium text-red-800">Uwaga!</p>
                    </div>
                    <p className="text-xs text-red-600">
                      Wykryto potencjalne zagrożenie. Zalecamy kontakt z fachowcem.
                    </p>
                  </div>
                )}
                
                {/* Utwórz zlecenie w 1 kliknięciu (gdy Helpfli poleca fachowca i mamy draft) */}
                {analysisResult.recommendation?.type === 'provider' && analysisResult.draftId && (
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        setSubmittingOneClick(true);
                        try {
                          const base = import.meta.env.VITE_API_URL || '';
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${base}/api/ai/drafts/${analysisResult.draftId}/submit`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({})
                          });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok && data.orderId) {
                            if (mode === 'modal' && onClose) onClose();
                            navigate(`/orders/${data.orderId}`);
                          } else {
                            throw new Error(data.message || 'Nie udało się utworzyć zlecenia');
                          }
                        } catch (err) {
                          console.error(err);
                          alert(err.message || 'Nie udało się utworzyć zlecenia. Spróbuj przejść do formularza.');
                        } finally {
                          setSubmittingOneClick(false);
                        }
                      }}
                      disabled={submittingOneClick}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {submittingOneClick ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {submittingOneClick ? 'Tworzę zlecenie...' : 'Utwórz zlecenie w 1 kliknięciu'}
                    </button>
                  </div>
                )}
                {/* Przycisk Utwórz zlecenie (gdy brak draftId lub inna ścieżka) */}
                {analysisResult.serviceCandidate && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        if (onCreateOrder) {
                          onCreateOrder({
                            description: input || 'Problem wykryty przez Asystenta AI',
                            service: analysisResult.serviceCandidate.code,
                            urgency: analysisResult.urgency || 'normal',
                            diySteps: analysisResult.diySteps,
                            parts: analysisResult.parts
                          });
                        } else {
                          navigate('/create-order', {
                            state: {
                              prefill: {
                                description: input || 'Problem wykryty przez Asystenta AI',
                                service: analysisResult.serviceCandidate.code,
                                urgency: analysisResult.urgency || 'normal',
                                diySteps: analysisResult.diySteps,
                                parts: analysisResult.parts
                              },
                              fromAI: true
                            }
                          });
                        }
                        if (mode === 'modal' && onClose) onClose();
                      }}
                      className="w-full btn-helpfli-primary px-4 py-2.5 text-sm flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Utwórz zlecenie na podstawie analizy
                    </button>
                  </div>
                )}
              </div>
            )}
            {busy && <TypingBubble />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Przesłane pliki - podgląd */}
      {attachedFiles.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.type === 'image' ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                    <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="text-xs text-gray-600 mt-1 truncate w-20">{file.originalName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area - profesjonalny */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowLiveCamera(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Kamera AI"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <label className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => uploadFiles(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            <div className={`p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
              {uploading ? (
                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            placeholder={
              companyId
                ? "Np. zapytaj o zespół, obciążenie lub faktury…"
                : "Krótko opisz problem lub dodaj zdjęcie/film…"
            }
            className="flex-1 border border-gray-300 rounded-2xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none max-h-40 text-sm"
            rows={2}
            style={{ minHeight: '48px' }}
          />
          <button
            onClick={ask}
            disabled={busy || uploading || !input.trim()}
            className="p-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex-shrink-0"
            title="Wyślij"
          >
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const handleBackdropClick = () => {
    if (attachBus) {
      setInternalOpen(false);
      closeAI();
    } else {
      if (onClose) {
        onClose();
      }
    }
  };

  // Nie renderuj jeśli nie jest otwarty (chyba że to page mode)
  if (!open && mode !== 'page') {
    return null;
  }

  return (
    <div className={containerClass}>
      {mode === 'modal' && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={handleBackdropClick}
        />
      )}
      
      {wrapperClass ? (
        <div className={wrapperClass}>
          {content}
        </div>
      ) : (
        <div className="relative z-50">
          {content}
        </div>
      )}

      {/* Live Camera AI Modal */}
      <LiveCameraAI
        open={showLiveCamera}
        onClose={() => setShowLiveCamera(false)}
        onAnalyzeComplete={(result) => {
          setAnalysisResult(result);
          setShowLiveCamera(false);
          
          // Dodaj wiadomość z wynikami analizy
          let aiMessage = '';
          if (result.serviceCandidate) {
            aiMessage = `Widzę problem związany z ${result.serviceCandidate.name}. `;
            if (result.diySteps && result.diySteps.length > 0) {
              aiMessage += `Mogę zaproponować ${result.diySteps.length} kroków do wykonania samodzielnie. `;
            }
            if (result.parts && result.parts.length > 0) {
              aiMessage += `Będziesz potrzebować ${result.parts.length} części. `;
            }
            aiMessage += 'Poniżej znajdziesz szczegóły i możliwość utworzenia zlecenia.';
          } else if (result.diySteps && result.diySteps.length > 0) {
            aiMessage = `Znalazłem ${result.diySteps.length} kroków do wykonania. Poniżej znajdziesz szczegóły.`;
          } else {
            aiMessage = 'Analizuję problem. Za chwilę otrzymasz szczegółowe informacje.';
          }
          
          setMsgs(prev => [...prev, { 
            role: 'assistant', 
            text: aiMessage,
            createdAt: Date.now()
          }]);
          
          // Przewiń do końca, aby zobaczyć wyniki
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />
    </div>
  );
}
