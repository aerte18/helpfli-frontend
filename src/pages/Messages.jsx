import { useEffect, useState } from "react";
import useInbox from "../hooks/useInbox";
import ChatBox from "../components/ChatBox";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { user: currentUser } = useAuth();
  const { loading, conversations, typingMap, markConversationRead } = useInbox();
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const [active, setActive] = useState(null);

  const toText = (v, fallback = "") => {
    if (v == null) return fallback;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    try { return JSON.stringify(v); } catch { return fallback; }
  };

  useEffect(() => {
    if (active) markConversationRead(active._id);
  }, [active, markConversationRead]);

  return (
    <div className="h-[80vh] grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50">
      {/* Lista konwersacji */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white md:col-span-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-gray-500">Ładowanie…</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {safeConversations.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Brak rozmów.</div>
            ) : (
              safeConversations.map((c) => {
                const participants = Array.isArray(c?.participants) ? c.participants : [];
                const other = participants.find((p) => String(p?._id || p) !== String(currentUser?._id || currentUser?.id)) || participants[0] || {};
                const title = toText(c?.title) || toText(other?.name) || "Rozmowa";
                const preview =
                  toText(c?.lastMessage?.text) ||
                  (Array.isArray(c?.lastMessage?.attachments) && c.lastMessage.attachments.length ? "📎 Załącznik" : "Brak wiadomości");
                const unread = Number(c?.unreadCount || 0);
                const isActive = String(active?._id) === String(c?._id);
                return (
                  <button
                    key={String(c?._id)}
                    className={`w-full text-left p-3 border-b hover:bg-gray-50 ${isActive ? "bg-blue-50" : ""}`}
                    onClick={() => setActive(c)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">{title}</div>
                      {unread > 0 ? (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{unread > 99 ? "99+" : unread}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1">{preview}</div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Okno czatu */}
      <div className="md:col-span-2 border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
        {active ? (
          <ChatBox 
            conversationId={active._id} 
            currentUser={currentUser} 
            participants={active.participants || []}
            order={active.order}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">Wybierz rozmowę</p>
              <p className="text-sm text-gray-500">Wybierz konwersację z listy, aby rozpocząć czat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
