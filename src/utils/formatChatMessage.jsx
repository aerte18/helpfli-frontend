import React from "react";
import { extractAIReply } from "./extractAIReply";

function inlineFormat(text) {
  const parts = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={`${match.index}-b`}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

/**
 * Czytelne formatowanie odpowiedzi asystenta (pogrubienia, listy) bez surowego JSON.
 */
export function AssistantMessageContent({ text }) {
  const clean = extractAIReply(text || "");
  const lines = clean.split(/\r?\n/);
  const blocks = [];
  let listItems = null;
  let listType = null;

  const flushList = () => {
    if (!listItems?.length) return;
    const ListTag = listType === "ol" ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${blocks.length}`}
        className={
          listType === "ol"
            ? "my-1.5 list-decimal space-y-1 pl-5"
            : "my-1.5 list-disc space-y-1 pl-5"
        }
      >
        {listItems.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {inlineFormat(item)}
          </li>
        ))}
      </ListTag>
    );
    listItems = null;
    listType = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const bullet = trimmed.match(/^[-•*]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);

    if (bullet) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
        listItems = [];
      }
      listItems.push(bullet[1]);
      return;
    }

    if (numbered) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
        listItems = [];
      }
      listItems.push(numbered[1]);
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${idx}`} className="leading-relaxed">
        {inlineFormat(trimmed)}
      </p>
    );
  });

  flushList();

  if (!blocks.length) {
    return <p className="leading-relaxed text-gray-500">…</p>;
  }

  return <div className="space-y-0.5">{blocks}</div>;
}
