import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UnifiedAIConcierge from "./ai/UnifiedAIConcierge";
import AiFabLauncher from "./ui/AiFabLauncher";
import useAiConciergeNudge, { PROACTIVE_HINT } from "../hooks/useAiConciergeNudge";
import { useAuth } from "../context/AuthContext";
import { onAI } from "../ai/chat/bus";
import { isChatContextRoute } from "../utils/chatMobileChrome";

export default function AiWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [busAiOpen, setBusAiOpen] = useState(false);
  const [seedQuery, setSeedQuery] = useState("");

  useEffect(() => {
    return onAI((evt) => {
      if (evt.type === "open") setBusAiOpen(true);
      if (evt.type === "close") setBusAiOpen(false);
    });
  }, []);

  const fabHidden = open || busAiOpen;
  const hideOnChat = isChatContextRoute(location);
  const isProvider = user?.role === "provider";

  const { teaser, suggestionDot, markEngaged } = useAiConciergeNudge({
    enabled: !hideOnChat && !isProvider,
    chatOpen: fabHidden,
    isLoggedIn: Boolean(user),
  });

  if (isProvider || hideOnChat) {
    return null;
  }

  const handleOpen = () => {
    // Follow-up: klik w dymek z podpowiedzią (lub z kropką sugestii)
    // otwiera czat od razu w temacie tej podpowiedzi.
    const followUp = teaser?.prompt || (suggestionDot ? PROACTIVE_HINT.prompt : "");
    markEngaged();
    setSeedQuery(followUp);
    setOpen(true);
  };

  return (
    <>
      <AiFabLauncher
        testId="ai-fab"
        variant="client"
        hidden={fabHidden}
        teaser={teaser}
        dot={suggestionDot}
        label="Zapytaj AI"
        onClick={handleOpen}
      />

      <UnifiedAIConcierge
        mode="modal"
        open={open}
        onClose={() => {
          setOpen(false);
          setSeedQuery("");
        }}
        seedQuery={seedQuery}
      />
    </>
  );
}
