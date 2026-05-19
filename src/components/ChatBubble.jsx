import React from "react";
import { AssistantMessageContent } from "../utils/formatChatMessage";

function clsx(...a) { return a.filter(Boolean).join(" "); }

export default function ChatBubble({ role, text, ts, rich = false }) {
  const isUser = role === "user";
  const time = ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className={clsx("flex w-full items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[11px] font-semibold text-white shadow-md sm:h-9 sm:w-9 sm:text-xs">
          AI
        </div>
      )}
      <div className={clsx(
        "max-w-[min(92%,28rem)] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug shadow-sm sm:max-w-[80%] sm:px-4 sm:py-2.5 sm:text-sm sm:leading-relaxed",
        isUser
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
      )}>
        {rich && !isUser ? (
          <AssistantMessageContent text={text} />
        ) : (
          <div className="whitespace-pre-wrap">{text}</div>
        )}
        <div className={clsx("mt-1.5 text-[11px] opacity-70 sm:text-[10px]", isUser ? "text-blue-100" : "text-gray-500")}>
          {time}
        </div>
      </div>
      {isUser && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-300 text-[11px] font-medium text-gray-700 border-2 border-white shadow-sm sm:h-9 sm:w-9 sm:text-xs">
          TY
        </div>
      )}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex w-full items-end gap-2">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[11px] font-semibold text-white shadow-md sm:h-9 sm:w-9 sm:text-xs">
        AI
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2.5 text-[15px] shadow-sm sm:px-4 sm:text-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
          <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
