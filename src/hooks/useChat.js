import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "../lib/socket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

export default function useChat({ conversationId, currentUser }) {
  const [socketReady, setSocketReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);

  // init socket once
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => setSocketReady(true));
    socket.on("disconnect", () => setSocketReady(false));

    socket.on("message:new", ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("message:edited", ({ messageId, newText, editedAt }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, text: newText, editedAt } : m));
    });

    socket.on("message:deleted", ({ messageId }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, text: "", attachments: [], deletedAt: new Date().toISOString() } : m));
    });

    socket.on("message:reaction", ({ messageId, userId, emoji, action }) => {
      setMessages((prev) => prev.map(m => {
        if (m._id !== messageId) return m;
        const reactions = m.reactions || [];
        if (action === "remove") {
          return { ...m, reactions: reactions.filter(r => !(r.user === userId && r.emoji === emoji)) };
        } else {
          return { ...m, reactions: [...reactions, { user: userId, emoji }] };
        }
      }));
    });

    socket.on("message:read", ({ userId, messageIds }) => {
      setMessages((prev) => prev.map(m => {
        if (messageIds && !messageIds.includes(m._id)) return m;
        const readBy = new Set((m.readBy || []).map(String));
        readBy.add(String(userId));
        return { ...m, readBy: Array.from(readBy) };
      }));
    });

    socket.on("typing", ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = Date.now(); else delete next[userId];
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // join / leave room on conversation change
  useEffect(() => {
    if (!socketRef.current || !socketReady || !conversationId) return;
    socketRef.current.emit("chat:join", { conversationId });
    return () => {
      if (socketRef.current) socketRef.current.emit("chat:leave", { conversationId });
    };
  }, [socketReady, conversationId]);

  // Przykładowe wiadomości DEMO
  const DEMO_MESSAGES = {
    "demo-order-1:demo-provider-1": [
      {
        _id: "demo-o1-msg-1",
        text: "Dzień dobry! Mogę podjechać dziś i sprawdzić kran. Czy pasuje po 18:00?",
        sender: "demo-provider-1",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        readBy: [],
        __demo: true,
      },
      {
        _id: "demo-o1-msg-2",
        text: "Tak, 18:00 pasuje. Proszę dać znać 10 min przed przyjazdem.",
        sender: "demo-client",
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        readBy: [],
        __demo: true,
      },
    ],
    "demo-order-2:demo-provider-1": [
      {
        _id: "demo-msg-1",
        text: "Witam! Widzę, że potrzebujesz wymiany gniazdka. Mogę przyjechać dzisiaj po 15:00.",
        sender: "demo-provider-1",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        readBy: [],
        __demo: true
      },
      {
        _id: "demo-msg-2",
        text: "Dziękuję za szybką odpowiedź! Czy możesz podać przybliżoną cenę?",
        sender: "demo-client",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
        readBy: [],
        __demo: true
      },
      {
        _id: "demo-msg-3",
        text: "Tak, oczywiście. Wysłałem ofertę - 180 zł z dojazdem wliczonym. Materiały są w cenie.",
        sender: "demo-provider-1",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.2).toISOString(),
        readBy: [],
        __demo: true
      },
      {
        _id: "demo-msg-4",
        text: "Świetnie, dziękuję! Zobaczę wszystkie oferty i dam znać.",
        sender: "demo-client",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        readBy: [],
        __demo: true
      }
    ],
    "demo-order-2:demo-provider-2": [
      {
        _id: "demo2p2-1",
        text: "Cześć! Mogę zrobić to jutro rano. Czy gniazdko iskrzy przy włączaniu konkretnego urządzenia?",
        sender: "demo-provider-2",
        createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
        readBy: [],
        __demo: true,
      },
      {
        _id: "demo2p2-2",
        text: "Najczęściej przy odkurzaczu, ale ostatnio też przy lampce.",
        sender: "demo-client",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        readBy: [],
        __demo: true,
      },
    ],
    "demo-order-2:demo-provider-3": [
      {
        _id: "demo2p3-1",
        text: "Dzień dobry! Mogę przyjechać dziś w 2h. Mam na miejscu sprzęt do pomiarów i nowe gniazdko premium.",
        sender: "demo-provider-3",
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        readBy: [],
        __demo: true,
      },
    ],
    "demo-order-3:demo-provider-1": [
      {
        _id: "demo3-1",
        text: "Hej, mogę zamontować karnisz w piątek. Masz już karnisz na miejscu?",
        sender: "demo-provider-1",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        readBy: [],
        __demo: true,
      },
      {
        _id: "demo3-2",
        text: "Tak, karnisz jest. Piątek pasuje.",
        sender: "demo-client",
        createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        readBy: [],
        __demo: true,
      },
    ],
  };

  // fetch initial messages (REST)
  useEffect(() => {
    if (!conversationId) return;
    
    const isDemo = String(conversationId || "").startsWith("demo-");
    if (isDemo && import.meta.env.DEV) {
      setMessages(DEMO_MESSAGES[String(conversationId)] || []);
      return;
    }
    
    const token = localStorage.getItem("token");
    fetch(`${BACKEND_URL}/api/chat/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMessages(data || []))
      .catch(() => {});
  }, [conversationId]);

  const sendMessage = useCallback(async ({ text, files }) => {
    // Dev: rozmowa demo-* bez backendu
    if (conversationId?.startsWith("demo-") && import.meta.env.DEV) {
      const senderId = currentUser?._id || currentUser?.id || "demo-client";
      const t = (text || "").trim();
      if (!t) return;
      const msg = {
        _id: `demo-msg-local-${Date.now()}`,
        text: t,
        sender: senderId,
        createdAt: new Date().toISOString(),
        readBy: [String(senderId)],
        __demo: true,
      };
      setMessages((prev) => [...prev, msg]);
      return;
    }

    let attachments = [];
    if (files && files.length) {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      const res = await fetch(`${BACKEND_URL}/api/chat/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      attachments = data.files || [];
    }

    socketRef.current?.emit("message:send", { conversationId, text, attachments });
  }, [conversationId]);

  const sendTyping = useCallback((isTyping) => {
    if (!conversationId) return;
    socketRef.current?.emit("typing", { conversationId, isTyping });
  }, [conversationId]);

  const markRead = useCallback(async (messageIds) => {
    if (!conversationId) return;
    socketRef.current?.emit("message:read", { conversationId, messageIds });
    // REST fallback (opcjonalnie mark all)
    const token = localStorage.getItem("token");
    fetch(`${BACKEND_URL}/api/chat/${conversationId}/mark-read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, [conversationId]);

  const reactToMessage = useCallback((messageId, emoji, action = "add") => {
    socketRef.current?.emit("message:react", { messageId, emoji, action });
  }, []);

  const editMessage = useCallback((messageId, newText) => {
    socketRef.current?.emit("message:edit", { messageId, newText });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    socketRef.current?.emit("message:delete", { messageId });
  }, []);

  const typingList = useMemo(() => Object.keys(typingUsers).filter(id => String(id) !== String(currentUser?._id)), [typingUsers, currentUser]);

  return {
    socketReady,
    messages,
    typingList,
    sendMessage,
    sendTyping,
    markRead,
    reactToMessage,
    editMessage,
    deleteMessage,
  };
}
