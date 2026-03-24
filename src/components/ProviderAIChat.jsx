// Asystent AI dla providerów - pomoc w tworzeniu ofert
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { sendOfferChatMessage } from '../api/ai_advanced';

export default function ProviderAIChat({ orderId, orderDescription = '' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Zapamiętaj stan rozwinięcia per orderId (żeby nie klikać za każdym razem)
  useEffect(() => {
    try {
      const key = `provider_ai_chat_expanded:${orderId || 'unknown'}`;
      const raw = localStorage.getItem(key);
      if (raw === null) {
        setExpanded(false); // domyślnie zwinięte
      } else {
        setExpanded(raw === '1');
      }
    } catch {
      setExpanded(false);
    }
  }, [orderId]);

  useEffect(() => {
    try {
      const key = `provider_ai_chat_expanded:${orderId || 'unknown'}`;
      localStorage.setItem(key, expanded ? '1' : '0');
    } catch {
      // ignore
    }
  }, [expanded, orderId]);

  useEffect(() => {
    // Inicjalizuj chat z powitaniem
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: 'Cześć! 👋 Jestem Asystentem AI Helpfli. Pomogę Ci przygotować dobrą ofertę (cena, zakres, komunikacja). O co chcesz zapytać?'
      }]);
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.text
      }));

      const response = await sendOfferChatMessage(orderId, userMessage, conversationHistory);
      const mainText = typeof response.response === 'string' ? response.response : (response.response?.message ?? response.message ?? 'Przepraszam, nie udało się uzyskać odpowiedzi.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: mainText,
        agents: response.agents || null
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Błąd: ${error.message || 'Nie udało się wysłać wiadomości'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Jaką cenę zaproponować?',
    'Co powinienem uwzględnić w ofercie?',
    'Jakie są typowe ceny dla tego typu zlecenia?',
    'Jak sformułować wiadomość do klienta?'
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header - jak w zipie */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-5 flex items-center justify-between hover:bg-purple-100/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-900">Asystent AI</div>
            <div className="text-sm text-slate-600">Pomoc w tworzeniu oferty</div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {/* Messages - podobny styl do chatów w aplikacji */}
      {expanded ? (
        <div className="flex flex-col h-[400px] overflow-hidden">
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/60"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,.02) 20px, rgba(0,0,0,.02) 21px)'
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
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
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl px-4 py-2.5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-indigo-600"></div>
                  <span className="text-sm text-slate-600">Piszę...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions - podobny styl do przycisków w CreateOrder */}
        {messages.length === 1 && (
          <div className="px-5 pb-3">
            <div className="text-sm text-slate-600 mb-2">Szybkie pytania:</div>
            <div className="space-y-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInput(q)}
                  className="w-full text-left px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input - podobny styl do inputów w CreateOrder */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white/80">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Zadaj pytanie..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              Wyślij
            </button>
          </div>
        </form>
        </div>
      ) : null}
    </div>
  );
}













