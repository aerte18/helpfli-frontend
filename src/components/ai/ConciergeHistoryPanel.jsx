import React from "react";
import { History, X, MessageSquare } from "lucide-react";

function formatWhen(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export default function ConciergeHistoryPanel({
  open,
  onClose,
  sessions = [],
  loading,
  currentSessionId,
  onSelectSession,
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-[70] w-full max-w-[280px] border-l border-slate-200 bg-white shadow-xl flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <History className="h-4 w-4 text-indigo-600" />
          Historia rozmów
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100" aria-label="Zamknij historię">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && <p className="text-xs text-slate-500 px-2 py-4">Ładuję…</p>}
        {!loading && sessions.length === 0 && (
          <p className="text-xs text-slate-500 px-2 py-4">Brak zapisanych rozmów. Napisz pierwszą wiadomość.</p>
        )}
        {sessions.map((s) => (
          <button
            key={s.sessionId}
            type="button"
            onClick={() => onSelectSession(s.sessionId)}
            className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-colors ${
              currentSessionId === s.sessionId
                ? "bg-indigo-50 border border-indigo-200"
                : "hover:bg-slate-50 border border-transparent"
            }`}
          >
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-900 line-clamp-2">{s.preview}</div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {formatWhen(s.updatedAt)}
                  {s.messageCount ? ` · ${s.messageCount} wiad.` : ""}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
