
// src/components/ChatBox.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import useChat from "../hooks/useChat";
import ChatHeader from "./chat/ChatHeader";
import MessageBubble from "./chat/MessageBubble";
import EmojiPicker from "./chat/EmojiPicker";
import MessageSearch from "./chat/MessageSearch";
import { groupMessages, addDateSeparators } from "../utils/groupMessages";
import { Paperclip, Send, X, MessageSquare } from "lucide-react";

export default function ChatBox({ conversationId, currentUser, participants = [], order, onVideoCall, onPhoneCall }) {
  const {
    messages,
    typingList,
    sendMessage,
    sendTyping,
    markRead,
    reactToMessage,
    editMessage,
    deleteMessage,
  } = useChat({ conversationId, currentUser });

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const endRef = useRef(null);
  const typingRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});

  // Grupowanie wiadomości
  const groupedMessages = useMemo(() => {
    const grouped = groupMessages(messages, currentUser?._id);
    return addDateSeparators(grouped);
  }, [messages, currentUser?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    // oznacz jako przeczytane po wejściu
    if (messages.length) {
      const unreadIds = messages
        .filter((m) => !(m.readBy || []).map(String).includes(String(currentUser?._id)))
        .map((m) => m._id);
      if (unreadIds.length) markRead(unreadIds);
    }
  }, [messages, markRead, currentUser?._id]);

  // Znajdź rozmówcę (nie currentUser)
  const otherParticipant = useMemo(() => {
    return participants.find(p => String(p._id) !== String(currentUser?._id)) || participants[0];
  }, [participants, currentUser?._id]);

  const onChangeText = (e) => {
    setText(e.target.value);
    if (typingRef.current) clearTimeout(typingRef.current);
    sendTyping(true);
    typingRef.current = setTimeout(() => sendTyping(false), 1200);
  };

  const onSend = (e) => {
    e?.preventDefault?.();
    if (!text.trim() && (!files || !files.length)) return;
    if (editingId) {
      editMessage(editingId, text);
      setEditingId(null);
      setText("");
      setFiles([]);
      return;
    }
    sendMessage({ text, files, replyTo: replyingTo?._id });
    setText("");
    setFiles([]);
    setReplyingTo(null);
  };

  // Keyboard shortcuts: Ctrl/Cmd + Enter wysyła wiadomość
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend(e);
    }
  };

  const onPickFiles = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji);
  };

  // Wyszukiwanie w wiadomościach (Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSearchResult = (message) => {
    setHighlightedMessageId(message._id);
    messageRefs.current[message._id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedMessageId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl overflow-hidden shadow-sm relative">
      {/* Wyszukiwanie */}
      {showSearch && (
        <MessageSearch
          messages={messages}
          onSelectMessage={handleSelectSearchResult}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Header */}
      <div className={showSearch ? 'pt-16' : ''}>
        <ChatHeader
          participant={otherParticipant}
          currentUser={currentUser}
          order={order}
          onVideoCall={onVideoCall}
          onPhoneCall={onPhoneCall}
          onSearch={() => setShowSearch(true)}
        />
      </div>

      {/* Wiadomości */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,.03) 20px, rgba(0,0,0,.03) 21px)' }}>
        {groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Brak wiadomości
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md">
              Napisz pierwszą wiadomość, aby rozpocząć rozmowę.
            </p>
          </div>
        ) : (
          groupedMessages.map((item) => {
            // Separator daty
            if (item.type === 'separator') {
              return (
                <div key={item._id} className="flex items-center justify-center my-4">
                  <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 font-medium">
                    {item.label}
                  </div>
                </div>
              );
            }

            // Wiadomość
            const isMine = String(item.sender?._id || item.sender) === String(currentUser?._id);
            const isHighlighted = highlightedMessageId === item._id;
            return (
              <div
                key={item._id}
                ref={(el) => { if (el) messageRefs.current[item._id] = el; }}
                className={isHighlighted ? 'animate-pulse bg-yellow-100 rounded-lg -mx-2 px-2 py-1' : ''}
              >
                <MessageBubble
                  message={item}
                  isMine={isMine}
                  showAvatar={item.showAvatar}
                  showName={item.showName}
                  grouped={item.grouped}
                  onEdit={(msg) => { setEditingId(msg._id); setText(msg.text || ""); }}
                  onDelete={deleteMessage}
                  onReply={setReplyingTo}
                  onReact={(msgId, emoji) => {
                    const hasReacted = item.reactions?.some(r => r.user === currentUser?._id && r.emoji === emoji);
                    reactToMessage(msgId, emoji, hasReacted ? "remove" : "add");
                  }}
                  currentUser={currentUser}
                />
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Status "pisze..." */}
      {typingList.length > 0 && (
        <div className="px-4 py-2 bg-white border-t border-gray-100">
          <TypingIndicator typingIds={typingList} participants={participants} meId={currentUser?._id} />
        </div>
      )}

      {/* Odpowiedź na wiadomość */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-600 mb-1">Odpowiadasz na:</div>
            <div className="text-sm text-gray-900 truncate">{replyingTo.text || '[Załącznik]'}</div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Podgląd załączników */}
      {files.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.type?.startsWith('image/') ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Paperclip className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="text-xs text-gray-600 mt-1 truncate w-20">{file.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={onSend} className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Załącz plik"
            aria-label="Załącz plik"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={onPickFiles}
          />
          
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (typingRef.current) clearTimeout(typingRef.current);
                sendTyping(true);
                typingRef.current = setTimeout(() => sendTyping(false), 1200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend(e);
                }
                // Ctrl/Cmd + Enter również wysyła
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  onSend(e);
                }
              }}
              aria-label="Wiadomość"
              aria-describedby="chat-input-hint"
              placeholder={editingId ? "Edytuj wiadomość..." : replyingTo ? "Napisz odpowiedź..." : "Napisz wiadomość..."}
              className="w-full border border-gray-300 rounded-2xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            <div className="absolute right-2 bottom-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>

          <button
            type="submit"
            disabled={!text.trim() && files.length === 0}
            className="p-2.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Wyślij (Enter)"
            aria-label="Wyślij wiadomość"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function TypingIndicator({ typingIds, participants, meId }) {
  const names = typingIds
    .filter((id) => String(id) !== String(meId))
    .map((uid) => participants.find((p) => String(p._id) === String(uid))?.name)
    .filter(Boolean);
  if (!names.length) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {names.length === 1 && `${names[0]} pisze…`}
        {names.length === 2 && `${names[0]} i ${names[1]} piszą…`}
        {names.length > 2 && `${names.slice(0,2).join(", ")} i ${names.length - 2} inne…`}
      </span>
    </div>
  );
}