import React from "react";

function clsx(...a) { return a.filter(Boolean).join(" "); }

export default function ChatBubble({ role, text, ts }) {
  const isUser = role === "user";
  const time = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

  return (
    <div className={clsx("flex w-full items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold shadow-md">
          AI
        </div>
      )}
      <div className={clsx(
        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
        isUser 
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm" 
          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
      )}>
        <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
        <div className={clsx("mt-1.5 text-[10px] opacity-70", isUser ? "text-blue-100" : "text-gray-500")}>
          {time}
        </div>
      </div>
      {isUser && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-300 text-gray-700 text-xs font-medium border-2 border-white shadow-sm">
          TY
        </div>
      )}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex w-full items-end gap-2">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold shadow-md">
        AI
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
