import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UnifiedAIConcierge from "./ai/UnifiedAIConcierge";
import AiFabLauncher from "./ui/AiFabLauncher";
import { useAuth } from "../context/AuthContext";
import { onAI } from "../ai/chat/bus";
import { isChatContextRoute } from "../utils/chatMobileChrome";

export default function AiWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [busAiOpen, setBusAiOpen] = useState(false);

  useEffect(() => {
    return onAI((evt) => {
      if (evt.type === "open") setBusAiOpen(true);
      if (evt.type === "close") setBusAiOpen(false);
    });
  }, []);

  const fabHidden = open || busAiOpen;
  const hideOnChat = isChatContextRoute(location);

  if (user?.role === "provider" || hideOnChat) {
    return null;
  }

  return (
    <>
      <AiFabLauncher
        testId="ai-fab"
        variant="client"
        hidden={fabHidden}
        onClick={() => setOpen(true)}
      />

      <UnifiedAIConcierge
        mode="modal"
        open={open}
        onClose={() => setOpen(false)}
        seedQuery=""
      />
    </>
  );
}
