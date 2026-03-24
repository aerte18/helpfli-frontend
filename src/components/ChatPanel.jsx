/* ChatPanel: wysuwany panel czatu z uploadem plików (S3) + miniaturami */
import { useEffect, useMemo, useRef, useState } from "react";
import { isImage, iconForMime, formatSize } from "../utils/fileIcons";
import { getSocket } from "../lib/socket";

/** Jeśli masz już własny hook useSocket – możesz go użyć zamiast createSocket */
function createSocket(token) {
  if (!token) return null;
  // Użyj getSocket() zamiast bezpośredniego io()
  const socket = getSocket();
  // Wycisz błędy połączenia
  socket.on("connect_error", () => {
    // Błędy są już wyciszone w getSocket()
  });
  return socket;
}

/** Mała karta załącznika w wiadomości */
function Attachment({ a }) {
  if (!a) return null;
  const thumb = a.thumbnailUrl || a.url;
  const isImg = isImage(a.type);
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
      title={a.name}
    >
      <div className="flex items-center gap-2">
        {isImg ? (
          <img
            src={thumb}
            alt={a.name}
            className="h-12 w-12 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-xl">
            {iconForMime(a.type)}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-800">
            {a.name}
          </div>
          <div className="text-xs text-slate-500">{formatSize(a.size)}</div>
        </div>
      </div>
    </a>
  );
}

export default function ChatPanel({
  open,
  onClose,
  peerId,       // id rozmówcy
  roomId,       // opcjonalnie: gdy czat po zleceniu (np. order:<id>)
  authToken,    // JWT z localStorage
  selfUser,     // { id, name }
}) {
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [uploading, setUploading] = useState(false);

  // identyfikator pokoju: preferuj przekazany roomId, w innym wypadku DM
  const activeRoom = useMemo(() => {
    if (roomId) return roomId;
    const mine = selfUser?.id || "me";
    return `dm:${[mine, peerId].sort().join("-")}`;
  }, [roomId, peerId, selfUser]);

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // socket lifecycle
  useEffect(() => {
    if (!open) return;
    
    // Tymczasowe rozwiązanie - backend nie działa
    console.log("Backend nie działa, używam mock data dla czatu");
    
    // Mock wiadomość powitalna
    setTimeout(() => {
      setMessages([
        {
          id: "welcome",
          from: peerId,
          to: selfUser?.id,
          text: "Cześć! Dziękuję za zainteresowanie. Jak mogę Ci pomóc?",
          ts: Date.now(),
          status: "sent"
        }
      ]);
    }, 500);

    // Prawdziwy kod (zakomentowany)
    /*
    const s = createSocket(authToken);
    socketRef.current = s;

    s.on("connect", () => {
      // dołącz do pokoju i poproś o historię
      s.emit("chat:join", { roomId: activeRoom, peerId });
    });

    s.on("chat:history", (hist) => setMessages(hist || []));
    s.on("chat:message", (msg) => setMessages((m) => [...m, msg]));
    s.on("chat:typing", ({ from, typing }) => {
      if (from === peerId) setPeerTyping(!!typing);
    });
    s.on("chat:status", ({ msgId, status }) =>
      setMessages((m) => m.map((x) => (x._id === msgId || x.id === msgId ? { ...x, status } : x)))
    );
    s.on("chat:reaction", ({ msgId, by, emoji }) =>
      setMessages((m) =>
        m.map((x) =>
          x._id === msgId || x.id === msgId
            ? { ...x, reactions: { ...(x.reactions || {}), [by]: emoji } }
            : x
        )
      )
    );

    return () => {
      s.emit("chat:leave", { roomId: activeRoom });
      s.disconnect();
    };
    */
  }, [open, authToken, activeRoom, peerId, selfUser?.id]);

  const sendText = () => {
    if (!input.trim()) return;
    
    // Tymczasowe rozwiązanie - backend nie działa
    const newMessage = {
      id: `msg_${Date.now()}`,
      _id: `msg_${Date.now()}`,
      from: selfUser?.id,
      to: peerId,
      roomId: activeRoom,
      text: input.trim(),
      attachments: [],
      ts: Date.now(),
      status: "sent",
    };
    
    setMessages((m) => [...m, newMessage]);
    setInput("");
    
    // Mock odpowiedź po 1-2 sekundach
    setTimeout(() => {
      const responses = [
        "Dziękuję za wiadomość! Przeanalizuję Twoje potrzeby i przygotuję wycenę.",
        "Rozumiem. Czy możesz podać więcej szczegółów?",
        "To brzmi jak coś, co mogę dla Ciebie zrobić. Kiedy byłbyś dostępny?",
        "Świetnie! Przygotowuję ofertę specjalnie dla Ciebie.",
        "Dziękuję za kontakt. Odpowiem wkrótce z konkretną propozycją."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages((m) => [...m, {
        id: `reply_${Date.now()}`,
        from: peerId,
        to: selfUser?.id,
        text: randomResponse,
        ts: Date.now(),
        status: "sent"
      }]);
    }, 1000 + Math.random() * 1000);
    
    // Prawdziwy kod (zakomentowany)
    /*
    const s = socketRef.current;
    if (!s || !input.trim()) return;
    const payload = {
      roomId: activeRoom,
      to: peerId,
      text: input.trim(),
      attachments: [],
    };
    s.emit("chat:send", payload, (ack) => {
      setMessages((m) => [
        ...m,
        {
          id: ack?.id,
          _id: ack?.id,
          from: selfUser?.id,
          to: peerId,
          roomId: activeRoom,
          text: payload.text,
          attachments: [],
          ts: ack?.ts || Date.now(),
          status: "sent",
        },
      ]);
    });
    setInput("");
    */
  };

  const onTyping = () => {
    setPeerTyping(false);
    socketRef.current?.emit("chat:typing", {
      roomId: activeRoom,
      to: peerId,
      typing: true,
    });
  };

  // upload wielu plików
  const uploadFiles = async (fileList) => {
    if (!fileList?.length) return [];
    setUploading(true);
    try {
      const fd = new FormData();
      [...fileList].forEach((f) => fd.append("files", f));
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload error");
      const data = await res.json(); // { files: [...] }
      return data.files || [];
    } finally {
      setUploading(false);
    }
  };

  const onPickFiles = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const atts = await uploadFiles(files);
    sendAttachments(atts);
    e.target.value = "";
  };

  const sendAttachments = (atts) => {
    if (!atts?.length) return;
    const s = socketRef.current;
    const payload = { roomId: activeRoom, to: peerId, text: "", attachments: atts };
    s.emit("chat:send", payload, (ack) => {
      setMessages((m) => [
        ...m,
        {
          id: ack?.id,
          _id: ack?.id,
          from: selfUser?.id,
          to: peerId,
          roomId: activeRoom,
          text: "",
          attachments: atts,
          ts: ack?.ts || Date.now(),
          status: "sent",
        },
      ]);
    });
  };

  // drag & drop
  const dropRef = useRef(null);
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e) => { e.preventDefault(); el.classList.add("ring-2","ring-sky-300"); };
    const onDragLeave = (e) => { e.preventDefault(); el.classList.remove("ring-2","ring-sky-300"); };
    const onDrop = async (e) => {
      e.preventDefault();
      el.classList.remove("ring-2","ring-sky-300");
      const files = e.dataTransfer?.files;
      if (files?.length) {
        const atts = await uploadFiles(files);
        sendAttachments(atts);
      }
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition ${open ? "visible bg-black/20" : "invisible bg-black/0"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl border-l border-slate-200
          transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="font-semibold">Czat</div>
          <div className="text-xs text-slate-500">{peerTyping ? "pisze…" : ""}</div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">Zamknij</button>
        </div>

        <div className="h-[calc(100%-128px)] overflow-y-auto px-3 py-3 space-y-2" ref={dropRef}>
          {messages.map((m) => {
            const mine = m.from === selfUser?.id;
            return (
              <div
                key={m._id || m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-sky-600 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}

                {/* Załączniki */}
                {!!m.attachments?.length && (
                  <div className={`mt-2 grid gap-2 ${m.attachments.length > 1 ? "grid-cols-2" : ""}`}>
                    {m.attachments.map((a, idx) => (
                      <Attachment key={idx} a={a} />
                    ))}
                  </div>
                )}

                <div className={`mt-1 flex items-center justify-between text-[10px] opacity-80 ${mine ? "text-white/80" : "text-slate-500"}`}>
                  <span>{new Date(m.ts || Date.now()).toLocaleTimeString()}</span>
                  <span>{m.status === "read" ? "✔✔" : m.status === "delivered" ? "✔" : ""}</span>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input + upload */}
        <div className="px-3 py-3 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Napisz wiadomość… (lub upuść pliki tutaj)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              onInput={onTyping}
            />
            <label className={`btn-secondary cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              📎
              <input type="file" multiple className="hidden" onChange={onPickFiles} disabled={uploading} />
            </label>
            <button className="btn-primary" onClick={sendText}>Wyślij</button>
          </div>
          {uploading && <div className="mt-2 text-xs text-slate-500">Wysyłanie plików…</div>}
          <p className="mt-1 text-[11px] text-slate-400">Obsługa obrazów, PDF i innych. Miniatury generuje backend.</p>
        </div>
      </aside>
    </>
  );
}