import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

export default function useInbox() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [typingMap, setTypingMap] = useState({}); // { [conversationId]: { [userId]: number(timestamp) } }
  const socketRef = useRef(null);

  const fetchConvos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data || []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    if (user) fetchConvos(); 
    else {
      setConversations([]);
      setLoading(false);
    }
  }, [fetchConvos, user]);

  useEffect(() => {
    if (!user) {
      setTypingMap({});
      return;
    }
    const socket = getSocket();
    socketRef.current = socket;

    const onInboxUpdate = ({ conversationId }) => {
      fetchConvos();
    };

    const onNewMessage = ({ message }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === String(message.conversation));
        if (idx === -1) return prev;
        const copy = [...prev];
        const c = { ...copy[idx] };
        c.lastMessage = message;
        c.lastMessageAt = message.createdAt;
        c.unreadCount = (c.unreadCount || 0) + 1;
        copy.splice(idx, 1);
        return [c, ...copy];
      });
    };

    const onTyping = ({ conversationId, userId, isTyping }) => {
      if (!conversationId) return;
      setTypingMap((prev) => {
        const next = { ...prev };
        const map = { ...(next[conversationId] || {}) };
        if (isTyping) {
          map[userId] = Date.now();
        } else {
          delete map[userId];
        }
        if (Object.keys(map).length) next[conversationId] = map; else delete next[conversationId];
        return next;
      });
    };

    socket.on("inbox:updated", onInboxUpdate);
    socket.on("message:new", onNewMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.off("inbox:updated", onInboxUpdate);
      socket.off("message:new", onNewMessage);
      socket.off("typing", onTyping);
    };
  }, [fetchConvos, user]);

  // Auto-timeout: po 5s bez sygnału typing czyścimy wpisy
  useEffect(() => {
    const id = setInterval(() => {
      setTypingMap((prev) => {
        const now = Date.now();
        const next = { ...prev };
        let changed = false;
        for (const cid of Object.keys(next)) {
          const map = { ...next[cid] };
          for (const uid of Object.keys(map)) {
            if (now - map[uid] > 5000) { delete map[uid]; changed = true; }
          }
          if (Object.keys(map).length) next[cid] = map; else delete next[cid];
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const markConversationRead = useCallback(async (conversationId) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/api/chat/${conversationId}/mark-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) => prev.map((c) => c._id === conversationId ? { ...c, unreadCount: 0 } : c));
    } catch (e) {}
  }, [user]);

  const sorted = useMemo(() => {
    if (!user) return [];
    return [...conversations].sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0));
  }, [conversations, user]);

  return { 
    loading: loading && !!user, 
    conversations: sorted, 
    typingMap, 
    refresh: fetchConvos, 
    markConversationRead 
  };
}
