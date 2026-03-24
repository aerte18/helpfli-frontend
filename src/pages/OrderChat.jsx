// src/pages/OrderChat.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { UI } from "../i18n/pl_ui";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../lib/socket";
import { createVideoSession, createVideoPaymentIntent } from "../api/video";

const API = import.meta.env.VITE_API_URL || "";

export default function OrderChat() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [startingVideo, setStartingVideo] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const inputRef = useRef(null);

  // Pobierz szczegóły zlecenia
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
    }
  }, [orderId]);

  // Pobierz wiadomości dla zlecenia
  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/messages/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
        setError("");
      } else {
        setError("Nie udało się pobrać wiadomości");
      }
    } catch (err) {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    fetchMessages();
  }, [fetchOrder, fetchMessages]);

  // Socket dla nowych wiadomości
  useEffect(() => {
    if (!orderId) return;
    
    const socket = getSocket();
    
    const handleNewMessage = ({ message }) => {
      if (message.orderId === orderId) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on("message:new", handleNewMessage);
    
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [orderId]);

  // Wyślij wiadomość
  const sendMessage = useCallback(async ({ text, files }) => {
    if (!orderId || !user) return;
    
    try {
      const token = localStorage.getItem("token");
      const body = {
        text,
        orderId,
        to: null // Backend znajdzie odbiorcę na podstawie zlecenia
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error("Nie udało się wysłać wiadomości");
      }
    } catch (err) {
      setError(err.message);
    }
  }, [orderId, user]);

  // Rozpocznij wideo-wizytę
  const handleStartVideo = useCallback(async () => {
    if (!order || !user) return;

    // Określ kto jest providerem
    const providerId = typeof order.provider === 'string' 
      ? order.provider 
      : order.provider?._id || order.provider?.id;
    
    if (!providerId) {
      setError('Nie można określić wykonawcy');
      return;
    }

    // Klient nie może rozpocząć wideo-wizyty z samym sobą
    if (user.role === 'provider' && String(user.id || user._id) === String(providerId)) {
      setError('Nie możesz rozpocząć wideo-wizyty z samym sobą');
      return;
    }

    setStartingVideo(true);
    try {
      // Domyślna cena wideo-wizyty (można później dodać konfigurację)
      const videoPrice = 50.00; // 50 zł

      // Utwórz PaymentIntent
      const paymentData = await createVideoPaymentIntent({
        providerId,
        orderId,
        price: videoPrice
      });

      // Przekieruj do checkout z informacją o typie płatności
      const url = `/checkout?pi=${encodeURIComponent(paymentData.paymentIntentId)}&cs=${encodeURIComponent(paymentData.clientSecret)}&type=video&providerId=${encodeURIComponent(providerId)}&orderId=${encodeURIComponent(orderId || '')}&price=${encodeURIComponent(videoPrice)}`;
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create video payment:', err);
      setError(err.message || 'Nie udało się rozpocząć płatności za wideo-wizytę');
      setStartingVideo(false);
    }
  }, [order, user, orderId, navigate]);

  // Określ kto jest providerem (przed early return, żeby hooki były zawsze w tej samej kolejności)
  const providerId = order
    ? (typeof order.provider === 'string' ? order.provider : order.provider?._id || order.provider?.id)
    : null;
  const canStartVideo = order && providerId && user && user.role === 'client';
  const isProvider = order && user && String(providerId) === String(user._id || user.id);

  const fetchSuggestedReplies = useCallback(async () => {
    if (!orderId || !isProvider) return;
    setSuggestLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/ai/chat-suggest-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      setSuggestedReplies(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestedReplies([]);
    } finally {
      setSuggestLoading(false);
    }
  }, [orderId, isProvider]);

  const applySuggestion = (text) => {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Ładowanie czatu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Czat - Zlecenie {orderId}</h1>
          <p className="text-gray-600">Rozmowa z wykonawcą</p>
        </div>
        {canStartVideo && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleStartVideo}
              disabled={startingVideo}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {startingVideo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Rozpoczynanie...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Rozpocznij wideo-wizytę</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500">Cena: 50 zł</p>
          </div>
        )}
      </div>
      
      <div className="h-[70vh] border border-gray-200 rounded-lg flex flex-col overflow-hidden bg-white">
        {/* Importujemy ChatBox dla spójności */}
        <div className="flex-1 overflow-hidden">
          {/* Tymczasowo używamy prostszego widoku, ale możemy zaimportować ChatBox */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg font-medium mb-2">Brak wiadomości</p>
                <p className="text-sm">Napisz pierwszą wiadomość!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message.from._id === user._id;
                return (
                  <div
                    key={message._id}
                    className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img 
                          src={message.from.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(message.from.name)}&backgroundColor=4F46E5`}
                          alt={message.from.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                      isMine
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                    }`}>
                      {!isMine && (
                        <div className="text-xs font-medium mb-1 text-gray-600">
                          {message.from.name}
                        </div>
                      )}
                      <div className="text-sm leading-relaxed">{message.text}</div>
                      <div className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(message.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isMine && (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img 
                          src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=4F46E5`}
                          alt="Ty"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Sugerowane odpowiedzi (tylko dla wykonawcy) */}
        {isProvider && (
          <div className="border-t border-gray-100 px-4 py-2 bg-slate-50">
            {suggestedReplies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 self-center mr-1">Sugerowane:</span>
                {suggestedReplies.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="px-3 py-1.5 text-xs rounded-full border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
                  >
                    {s.length > 50 ? s.slice(0, 47) + "…" : s}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={fetchSuggestedReplies}
                disabled={suggestLoading}
                className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1"
              >
                {suggestLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Ładowanie...
                  </>
                ) : (
                  <>✨ Pomóż mi odpowiedzieć</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Input do wysyłania wiadomości */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = e.target.message.value.trim();
              if (text) {
                sendMessage({ text });
                e.target.message.value = '';
              }
            }}
            className="flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              name="message"
              type="text"
              placeholder={UI.chatPlaceholder}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors font-medium"
            >
              Wyślij
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}