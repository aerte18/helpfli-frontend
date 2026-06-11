import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UnifiedAIConcierge from "./ai/UnifiedAIConcierge";
import AiQuickSheet from "./ai/AiQuickSheet";
import AiFabLauncher from "./ui/AiFabLauncher";
import useAiConciergeNudge from "../hooks/useAiConciergeNudge";
import { useBreakpointMd } from "../hooks/useBreakpointMd";
import { useAuth } from "../context/AuthContext";
import { onAI } from "../ai/chat/bus";
import { isChatContextRoute } from "../utils/chatMobileChrome";

export default function AiWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const isMdUp = useBreakpointMd();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seedQuery, setSeedQuery] = useState("");
  const [busAiOpen, setBusAiOpen] = useState(false);

  useEffect(() => {
    return onAI((evt) => {
      if (evt.type === "open") setBusAiOpen(true);
      if (evt.type === "close") setBusAiOpen(false);
    });
  }, []);

  const fabHidden = open || sheetOpen || busAiOpen;
  const hideOnChat = isChatContextRoute(location);
  const isProvider = user?.role === "provider";

  const { teaser, suggestionDot, markEngaged } = useAiConciergeNudge({
    enabled: !fabHidden && !hideOnChat && !isProvider,
  });

  if (isProvider || hideOnChat) {
    return null;
  }

  const handleFabClick = () => {
    markEngaged();
    if (isMdUp) {
      // Desktop: od razu rozmowa.
      setSeedQuery("");
      setOpen(true);
    } else {
      // Mobile: najpierw bottom sheet z szybkimi akcjami (stan 4).
      setSheetOpen(true);
    }
  };

  const startChat = (seed) => {
    setSeedQuery(seed || "");
    setSheetOpen(false);
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
        onClick={handleFabClick}
      />

      <AiQuickSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStart={startChat}
      />

      <UnifiedAIConcierge
        mode="modal"
        open={open}
        onClose={() => setOpen(false)}
        seedQuery={seedQuery}
      />
    </>
  );
}
