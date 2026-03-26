// src/pages/Inbox.jsx
import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markRead
} from '../services/chatApi';
import useSocket from '../hooks/useSocket';

function ConversationItem({ conv, active, onClick, meId }) {
  const other = (conv.participants || []).find(p => p._id !== meId) || {};
  const unread = (conv.unreadCount && (conv.unreadCount[meId] ?? conv.unreadCount.get?.(meId))) || 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${active ? 'bg-gray-100' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{other.name || 'Użytkownik'}</div>
        {unread > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">{unread}</span>}
      </div>
      <div className="text-sm text-gray-500 truncate">{conv.lastMessage || '—'}</div>
    </button>
  );
}

function ChatWindow({ conversation, meId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Socket connection
  const socket = useSocket(meId, {
    'new-message': (msg) => {
      if (msg.conversation === conversation?._id) {
        setMessages(prev => [...prev, msg]);
      }
    },
    'typing': ({ from }) => {
      if (from !== meId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }
  });

  useEffect(() => {
    if (!conversation?._id) return;
    let mounted = true;
    (async () => {
      const msgs = await fetchMessages(conversation._id);
      if (mounted) setMessages(msgs);
      await markRead(conversation._id);
      if (socket) {
        socket.emit('join-conversation', conversation._id);
      }
    })();
    return () => { mounted = false; };
  }, [conversation?._id, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const msg = await sendMessage(conversation._id, { text });
    setMessages((m) => [...m, msg]);
    setText('');
    
    // Emit socket event
    if (socket) {
      socket.emit('send-message', {
        convId: conversation._id,
        from: meId,
        to: conversation.participants.filter(p => p._id !== meId).map(p => p._id),
        text
      });
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { convId: conversation._id, from: meId });
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
      // Tu dodaj endpoint do uploadu plików
      const response = await fetch(apiUrl(`/api/chat/${conversation._id}/upload`), {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const { url, name, type, size } = await response.json();
        await sendMessage(conversation._id, { 
          text: '',
          attachments: [{ name, url, type, size }]
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleEdit = async (msgId) => {
    if (!editText.trim()) return;
    
    try {
      const response = await fetch(apiUrl(`/api/chat/messages/${msgId}/edit`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: editText })
      });
      
      if (response.ok) {
        setMessages(prev => prev.map(m => 
          m._id === msgId ? { ...m, text: editText, edited: true } : m
        ));
        setEditingId(null);
        setEditText('');
      }
    } catch (error) {
      console.error('Edit error:', error);
    }
  };

  const handleDelete = async (msgId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) return;
    
    try {
      const response = await fetch(apiUrl(`/api/chat/messages/${msgId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        setMessages(prev => prev.map(m => 
          m._id === msgId ? { ...m, deleted: true, text: '' } : m
        ));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleExport = () => {
    window.open(`/api/chat/${conversation._id}/export?format=txt`);
  };

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Wybierz rozmowę po lewej.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 font-semibold flex justify-between items-center">
        <span>
          {(conversation.participants || []).find(p => p._id !== meId)?.name || 'Rozmowa'}
        </span>
        <button 
          onClick={handleExport}
          className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Eksportuj
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(m => (
          <div key={m._id} className={`max-w-[70%] ${m.from === meId ? 'ml-auto text-right' : ''}`}>
            <div className={`px-3 py-2 rounded-2xl border ${m.from === meId ? 'bg-blue-50' : 'bg-white'} relative group`}>
              {editingId === m._id ? (
                <div className="flex gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                    autoFocus
                  />
                  <button onClick={() => handleEdit(m._id)} className="text-sm">✓</button>
                  <button onClick={() => setEditingId(null)} className="text-sm">✗</button>
                </div>
              ) : (
                <>
                  {m.deleted ? (
                    <span className="text-gray-400 italic">Wiadomość została usunięta</span>
                  ) : (
                    <>
                      <div>{m.text}</div>
                      {m.attachments?.map((att, i) => (
                        <div key={i} className="mt-2 p-2 bg-gray-50 rounded">
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                            📎 {att.name}
                          </a>
                        </div>
                      ))}
                      {m.reactions?.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {m.reactions.map((r, i) => (
                            <span key={i} className="text-xs bg-gray-200 px-1 rounded">
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  
                  {m.from === meId && !m.deleted && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingId(m._id)} className="text-xs mr-1">✏️</button>
                      <button onClick={() => handleDelete(m._id)} className="text-xs">🗑</button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {new Date(m.createdAt).toLocaleString()}
              {m.edited && <span className="ml-1">(edytowano)</span>}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="text-sm text-gray-400 italic">
            Użytkownik pisze...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          📎
        </button>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          className="flex-1 border rounded-xl px-3 py-2 outline-none"
          placeholder="Napisz wiadomość…"
        />
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white">Wyślij</button>
      </form>
    </div>
  );
}

export default function Inbox() {
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const meId = me?.id || me?._id;

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    (async () => {
      const list = await fetchConversations();
      setConversations(list);
      if (list.length && !activeId) setActiveId(list[0]._id);
    })();
  }, []);

  const activeConv = useMemo(
    () => conversations.find(c => c._id === activeId),
    [conversations, activeId]
  );

  return (
    <div className="h-[calc(100vh-80px)] flex border rounded-2xl overflow-hidden bg-white">
      <aside className="w-[340px] border-r overflow-y-auto">
        <div className="px-4 py-3 font-semibold border-b">Rozmowy</div>
        {conversations.map(c => (
          <ConversationItem
            key={c._id}
            conv={c}
            meId={meId}
            active={c._id === activeId}
            onClick={() => setActiveId(c._id)}
          />
        ))}
        {conversations.length === 0 && (
          <div className="p-4 text-sm text-gray-400">Brak rozmów.</div>
        )}
      </aside>

      <main className="flex-1">
        <ChatWindow conversation={activeConv} meId={meId} />
      </main>
    </div>
  );
}