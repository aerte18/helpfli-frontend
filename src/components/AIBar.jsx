import React from "react";
import { openAI } from "@/ai/chat/bus";
import OriginalLogoIcon from "./icons/OriginalLogoIcon";

export default function AIBar({ prefill = "", mode = "dock" }) {
  return (
    <button
      onClick={() => openAI(mode, prefill)}
      className="fixed right-4 bottom-4 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2"
      aria-label="Asystent AI"
    >
      <OriginalLogoIcon className="w-5 h-5" withBackground={true} />
      Asystent AI
    </button>
  );
}