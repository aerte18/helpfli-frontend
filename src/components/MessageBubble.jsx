import React from "react";

const MessageBubble = ({ message, isOwn }) => {
  const bubbleStyle = isOwn
    ? "bg-blue-100 text-right ml-auto"
    : "bg-gray-100 text-left";

  return (
    <div className={`max-w-[80%] p-2 rounded shadow-sm ${bubbleStyle}`}>
      <div className="text-sm">
        <strong>{isOwn ? "Ty" : message.from.name}</strong>
        {message.edited && <span className="text-xs ml-1">(edytowano)</span>}
      </div>
      {message.text && <div className="mt-1">{message.text}</div>}
      {message.attachment && (
        <div className="mt-2">
          <a
            href={message.attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            📎 Załącznik
          </a>
        </div>
      )}
      {message.reactions && message.reactions.length > 0 && (
        <div className="mt-1 text-sm">
          {message.reactions.map((r, idx) => (
            <span key={idx}>{r.type} </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;