import React from "react";
import { openAI } from "@/ai/chat/bus";
import OriginalLogoIcon from "./icons/OriginalLogoIcon";

export default function AIBubble({ label = "Zapytaj AI", prefill = "", mode = "dock", className = "" }) {
  return (
    <span
      onClick={() => openAI(mode, prefill)}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 shadow-sm border border-gray-200 bg-white cursor-pointer ${className}`}
    >
      <OriginalLogoIcon className="w-4 h-4" withBackground={true} />
      {label}
    </span>
  );
}