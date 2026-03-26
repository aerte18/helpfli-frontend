import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState, useRef } from "react";

const useChat = (orderId, recipientId) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/messages/${orderId}`), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Błąd pobierania wiadomości");
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error("Błąd pobierania wiadomości:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() && !attachment) return;

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("to", recipientId);
    if (newMsg) formData.append("text", newMsg);
    if (attachment) formData.append("attachment", attachment);

    try {
      const token = localStorage.getItem("token");
      await fetch(apiUrl("/api/messages"), {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      setNewMsg("");
      setAttachment(null);
      fetchMessages();
    } catch (err) {
      console.error("Błąd wysyłania wiadomości:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  return {
    messages,
    newMsg,
    setNewMsg,
    sendMessage,
    attachment,
    setAttachment,
    messagesEndRef,
  };
};

export default useChat;