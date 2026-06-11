import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UnifiedAIConcierge from "./ai/UnifiedAIConcierge";
import AiFabLauncher from "./ui/AiFabLauncher";
import useAiConciergeNudge from "../hooks/useAiConciergeNudge";
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
  const isProvider = user?.role === "provider";

  const { teaser, markEngaged } = useAiConciergeNudge({
    enabled: !fabHidden && !hideOnChat && !isProvider,
  });

  if (isProvider || hideOnChat) {
    return null;
  }

  const handleOpen = () => {
    markEngaged();
    setOpen(true);
  };

  return (
    <>
      <AiFabLauncher
        testId="ai-fab"
        variant="client"
        hidden={fabHidden}
        teaser={teaser}
        onClick={handleOpen}
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
