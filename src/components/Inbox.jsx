import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from "react";

const Inbox = ({ onSelectConversation }) => {
  const [threads, setThreads] = useState([]);

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/messages"), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Błąd pobierania inboxu");
      setThreads(data);
    } catch (err) {
      console.error("Błąd pobierania inboxu:", err);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  return (
    <div className="border p-4 rounded bg-white">
      <h2 className="text-lg font-semibold mb-3">📥 Wiadomości</h2>
      <div className="space-y-2">
        {threads.map((thread) => (
          <div
            key={thread.orderId}
            className="p-2 border rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelectConversation(thread)}
          >
            <div className="flex justify-between items-center">
              <div>
                <strong>{thread.otherUser.name}</strong>
                <div className="text-sm text-gray-600">{thread.lastMessage?.text?.slice(0, 40)}...</div>
              </div>
              {thread.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {thread.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inbox;