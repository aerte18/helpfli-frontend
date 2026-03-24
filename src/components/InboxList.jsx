import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export default function InboxList({ conversations, activeId, onSelect, typingMap = {}, currentUser }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) => {
      const title = c.title || (c.participants || []).map(p => p.name).join(", ");
      return title.toLowerCase().includes(query);
    });
  }, [q, conversations]);

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Teraz';
    if (minutes < 60) return `${minutes}m`;
    if (diff < 86400000) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('pl-PL', { weekday: 'short' });
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header z wyszukiwaniem */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            placeholder="Szukaj rozmów..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Lista konwersacji */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 p-4">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">Brak konwersacji</p>
              <p className="text-xs">Nie znaleziono rozmów</p>
            </div>
          </div>
        ) : (
          filtered.map((c) => {
            const tmap = typingMap[c._id] || {};
            const typingIds = Object.keys(tmap).filter((id) => String(id) !== String(currentUser?._id));
            const participants = c.participants || [];
            const otherParticipant = participants.find(p => String(p._id) !== String(currentUser?._id)) || participants[0];
            const names = typingIds
              .map((uid) => participants.find((p) => String(p._id) === String(uid))?.name)
              .filter(Boolean);
            
            const avatarUrl = otherParticipant?.avatar || 
              `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(otherParticipant?.name || 'User')}&backgroundColor=4F46E5`;
            const title = c.title || otherParticipant?.name || participants.map((p) => p.name).join(", ");
            const isActive = activeId === c._id;

            return (
              <button
                key={c._id}
                className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
                onClick={() => onSelect(c)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatarUrl}
                      alt={title}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    {otherParticipant?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Treść */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                        {title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {names.length > 0 ? (
                          <span className="text-xs text-blue-600 animate-pulse">
                            pisze…
                          </span>
                        ) : null}
                        {c.unreadCount > 0 ? (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                            {c.unreadCount > 99 ? '99+' : c.unreadCount}
                          </span>
                        ) : null}
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatTime(c.lastMessageAt || c.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {names.length > 0 ? (
                        <span className="text-blue-600 italic">
                          {names.length === 1 && `${names[0]} pisze…`}
                          {names.length === 2 && `${names[0]} i ${names[1]} piszą…`}
                        </span>
                      ) : (
                        c.lastMessage?.text || (c.lastMessage?.attachments?.length ? "📎 Załącznik" : "Brak wiadomości")
                      )}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
