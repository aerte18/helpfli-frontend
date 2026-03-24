import { useState } from "react";
import { MoreVertical, Phone, Video, Info, Search } from "lucide-react";

export default function ChatHeader({ 
  participant, 
  currentUser,
  order,
  onVideoCall,
  onPhoneCall,
  onInfo,
  onSearch
}) {
  const [showMenu, setShowMenu] = useState(false);

  const otherParticipant = participant || {};
  const avatarUrl = otherParticipant.avatar || 
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(otherParticipant.name || 'User')}&backgroundColor=4F46E5`;
  const name = otherParticipant.name || 'Użytkownik';
  const isOnline = otherParticipant.isOnline || otherParticipant.provider_status?.isOnline || false;
  const lastSeen = otherParticipant.lastSeenAt || otherParticipant.provider_status?.lastSeenAt;

  const formatLastSeen = () => {
    if (!lastSeen) return null;
    const d = new Date(lastSeen);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 5) return 'Online';
    if (minutes < 60) return `Ostatnio widziany ${minutes} min temu`;
    if (diff < 86400000) return `Ostatnio widziany dzisiaj o ${d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
    return `Ostatnio widziany ${d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}`;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar z statusem online */}
        <div className="relative flex-shrink-0">
          <img 
            src={avatarUrl} 
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Informacje o rozmówcy */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 truncate">
            {isOnline ? (
              <span className="text-green-600 font-medium">Online</span>
            ) : (
              formatLastSeen() || 'Offline'
            )}
          </p>
        </div>
      </div>

      {/* Akcje */}
      <div className="flex items-center gap-2">
        {onSearch && (
          <button
            onClick={onSearch}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Szukaj w wiadomościach"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {onVideoCall && (
          <button
            onClick={onVideoCall}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Rozpocznij wideo-wizytę"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {onPhoneCall && (
          <button
            onClick={onPhoneCall}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Zadzwoń"
          >
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Menu opcji */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
                {onInfo && (
                  <button
                    onClick={() => { onInfo(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    Informacje o rozmowie
                  </button>
                )}
                {order && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 mt-1">
                    Zlecenie: #{order._id?.slice(-8) || order.id}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

