import React from "react";
import { openAI } from "@/ai/chat/bus";
import Button from "@/components/ui/Button";
import OriginalLogoIcon from "./icons/OriginalLogoIcon";

export default function AIAssistant({ children = "Zapytaj Helpfli AI", prefill = "", mode = "modal", ...props }) {
  return (
    <Button onClick={() => openAI(mode, prefill)} {...props} className="flex items-center gap-2">
      <OriginalLogoIcon className="w-5 h-5" withBackground={true} />
      {children}
    </Button>
  );
}