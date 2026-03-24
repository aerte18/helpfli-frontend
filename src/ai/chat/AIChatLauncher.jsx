import React from "react";
import { openAI } from "./bus";
import { Sparkles } from "lucide-react";

export default function AIChatLauncher() {
  return (
    <button
      onClick={() => openAI('dock')}
      className="fixed right-4 bottom-4 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-5 py-3 shadow-2xl hover:shadow-indigo-500/50 flex items-center gap-2.5 transition-all transform hover:scale-105 font-medium"
      aria-label="Asystent AI"
    >
      <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <span>Asystent AI</span>
    </button>
  );
}

