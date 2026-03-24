import { useState } from "react";
import { Check, CheckCheck, MoreVertical, Edit2, Trash2, Reply } from "lucide-react";

export default function MessageBubble({ 
  message, 
  isMine, 
  showAvatar = true, 
  showName = false,
  grouped = false,
  onEdit,
  onDelete,
  onReply,
  onReact,
  currentUser
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const readBy = message.readBy || [];
  const readCount = readBy.length;
  const isRead = readCount > 1; // Więcej niż nadawca
  const isDelivered = message.sentAt && !isRead;
  const isSending = !message.sentAt;

  const getStatusIcon = () => {
    if (isSending) return <span className="text-gray-400 text-xs">●</span>;
    if (isRead) return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    if (isDelivered) return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    return <Check className="w-3.5 h-3.5 text-gray-400" />;
  };

  const avatarUrl = message.sender?.avatar || 
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(message.sender?.name || 'User')}&backgroundColor=4F46E5`;
  const senderName = message.sender?.name || 'Użytkownik';

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Teraz';
    if (minutes < 60) return `${minutes}m`;
    if (diff < 86400000) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className={`flex items-end gap-2 group ${isMine ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-1' : 'mt-4'}`}>
      {/* Avatar - tylko jeśli nie moja wiadomość i nie zgrupowana */}
      {!isMine && showAvatar && !grouped && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
          <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
        </div>
      )}
      {!isMine && !showAvatar && !grouped && <div className="w-8" />}

      <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Nazwa nadawcy - tylko jeśli nie moja i nie zgrupowana */}
        {!isMine && showName && !grouped && (
          <span className="text-xs text-gray-600 mb-1 px-1">{senderName}</span>
        )}

        {/* Bąbelek wiadomości */}
        <div
          className={`relative px-4 py-2 rounded-2xl shadow-sm ${
            isMine
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
          } ${message.deletedAt ? 'opacity-60' : ''}`}
        >
          {/* Edytowana wiadomość */}
          {message.editedAt && (
            <span className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-400'} mr-2`}>
              (edytowano)
            </span>
          )}

          {/* Tekst wiadomości */}
          {message.deletedAt ? (
            <span className={`italic ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
              Wiadomość została usunięta
            </span>
          ) : (
            <>
              {message.text && (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.text}
                </p>
              )}

              {/* Załączniki */}
              {message.attachments?.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((att, idx) => (
                    <Attachment key={idx} attachment={att} isMine={isMine} />
                  ))}
                </div>
              )}

              {/* Reakcje */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(
                    message.reactions.reduce((acc, r) => {
                      const key = r.emoji || r;
                      if (!acc[key]) acc[key] = { emoji: key, count: 0, users: [] };
                      acc[key].count++;
                      if (r.user) acc[key].users.push(r.user);
                      return acc;
                    }, {})
                  ).map(([emoji, data]) => (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(message._id, emoji)}
                      className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                        isMine
                          ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {data.emoji} {data.count > 1 && data.count}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Menu opcji - pokazuje się przy hover */}
          {!message.deletedAt && (
            <div className={`absolute ${isMine ? 'left-0' : 'right-0'} -top-8 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full bg-gray-800 text-white hover:bg-gray-700"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                    {onReply && (
                      <button
                        onClick={() => { onReply(message); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Reply className="w-4 h-4" />
                        Odpowiedz
                      </button>
                    )}
                    {isMine && onEdit && (
                      <button
                        onClick={() => { onEdit(message); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edytuj
                      </button>
                    )}
                    {isMine && onDelete && (
                      <button
                        onClick={() => { onDelete(message._id); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Usuń
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp i status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
          {isMine && getStatusIcon()}
        </div>
      </div>

      {/* Avatar po prawej - tylko dla moich wiadomości, jeśli nie zgrupowane */}
      {isMine && showAvatar && !grouped && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
          <img 
            src={currentUser?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}&backgroundColor=4F46E5`} 
            alt="Ty" 
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      {isMine && !showAvatar && !grouped && <div className="w-8" />}
    </div>
  );
}

function Attachment({ attachment, isMine }) {
  const isImage = attachment.type?.startsWith('image/') || attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = attachment.type?.startsWith('video/') || attachment.url?.match(/\.(mp4|webm|ogg)$/i);
  const isPDF = attachment.type === 'application/pdf' || attachment.url?.match(/\.pdf$/i);

  if (isImage) {
    return (
      <div className="rounded-lg overflow-hidden max-w-xs">
        <img 
          src={attachment.url} 
          alt={attachment.name || 'Załącznik'} 
          className="max-h-64 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(attachment.url, '_blank')}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="rounded-lg overflow-hidden max-w-xs">
        <video 
          src={attachment.url} 
          controls 
          className="max-h-64 w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block px-3 py-2 rounded-lg border ${
        isMine 
          ? 'bg-white/20 border-white/30 text-white' 
          : 'bg-gray-50 border-gray-200 text-gray-700'
      } hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-center gap-2">
        {isPDF && <span className="text-lg">📄</span>}
        <span className="text-sm truncate">{attachment.name || 'Załącznik'}</span>
      </div>
    </a>
  );
}

