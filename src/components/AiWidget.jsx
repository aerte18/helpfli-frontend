import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import UnifiedAIConcierge from "./ai/UnifiedAIConcierge";
import { useAuth } from "../context/AuthContext";
import { useBreakpointMd } from "../hooks/useBreakpointMd";
import { onAI } from "../ai/chat/bus";
import { isChatContextRoute } from "../utils/chatMobileChrome";

export default function AiWidget() {
  const { user } = useAuth();
  const isMdUp = useBreakpointMd();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  /** Globalny modal z busa (App → UnifiedAIConcierge attachBus) — ten sam co FAB, więc chowamy gwiazdkę */
  const [busAiOpen, setBusAiOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMapMobileMode, setIsMapMobileMode] = useState(false);
  const [mapDragOffsetY, setMapDragOffsetY] = useState(0);
  const dragRef = useRef({
    active: false,
    moved: false,
    startY: 0,
    startOffsetY: 0,
  });

  useEffect(() => {
    return onAI((evt) => {
      if (evt.type === "open") setBusAiOpen(true);
      if (evt.type === "close") setBusAiOpen(false);
    });
  }, []);

  useEffect(() => {
    if (isMdUp) {
      setIsMapMobileMode(false);
      setMapDragOffsetY(0);
      return undefined;
    }

    const isMapCandidateRoute =
      location.pathname === "/home" || location.pathname === "/search";
    if (!isMapCandidateRoute) {
      setIsMapMobileMode(false);
      setMapDragOffsetY(0);
      return undefined;
    }

    const detectMapMode = () => {
      const hasHomeMapShell = Boolean(document.querySelector(".qs-home-map-shell"));
      const hasMapToggle = Boolean(document.querySelector("[data-qs-map-immersive-toggle]"));
      setIsMapMobileMode(hasHomeMapShell && hasMapToggle);
    };

    detectMapMode();
    const observer = new MutationObserver(detectMapMode);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", detectMapMode);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", detectMapMode);
    };
  }, [location.pathname, isMdUp]);

  const fabHidden = open || busAiOpen;
  const mobileBottomClass = user
    ? "qs-fixed-above-mobile-tab"
    : "qs-fixed-soft-bottom";

  // Na mobile w widokach czatu FAB nachodzi na przycisk "Wyślij" (prawy-dół).
  // Ukrywamy więc launcher Asystenta AI na ekranach rozmów.
  const hideOnChat = isChatContextRoute(location);

  // Ukryj widget dla providerów - Asystent AI jest tylko dla klientów
  if (user?.role === 'provider') {
    return null;
  }

  if (hideOnChat) {
    return null;
  }

  const clampDragY = (value) => {
    const max = Math.max(160, window.innerHeight * 0.28);
    const min = -Math.max(220, window.innerHeight * 0.35);
    return Math.min(max, Math.max(min, value));
  };

  const handlePointerDown = (e) => {
    if (!isMapMobileMode) return;
    dragRef.current.active = true;
    dragRef.current.moved = false;
    dragRef.current.startY = e.clientY;
    dragRef.current.startOffsetY = mapDragOffsetY;
  };

  const handlePointerMove = (e) => {
    if (!isMapMobileMode || !dragRef.current.active) return;
    const deltaY = e.clientY - dragRef.current.startY;
    if (Math.abs(deltaY) > 4) dragRef.current.moved = true;
    setMapDragOffsetY(clampDragY(dragRef.current.startOffsetY + deltaY));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const handleOpen = () => {
    if (isMapMobileMode && dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setOpen(true);
  };

  const glowVariants = {
    idle: {
      scale: [1, 1.02, 1],
      opacity: [0.15, 0.2, 0.15],
      transition: {
        repeat: Infinity,
        duration: 3,
        ease: [0.4, 0, 0.6, 1]
      }
    },
    hover: {
      scale: 1.1,
      opacity: 0.3,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const glowVariants2 = {
    idle: {
      scale: [1, 1.03, 1],
      opacity: [0.1, 0.15, 0.1],
      transition: {
        repeat: Infinity,
        duration: 3.5,
        ease: [0.4, 0, 0.6, 1],
        delay: 0.3
      }
    },
    hover: {
      scale: 1.12,
      opacity: 0.25,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {!fabHidden && (
          <motion.button
            key="ai-fab"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={
              isMapMobileMode
                ? { opacity: 1, scale: 1, y: mapDragOffsetY }
                : { opacity: 1, scale: 1, y: [0, -5, 0] }
            }
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
              y: isMapMobileMode
                ? { duration: 0.12, ease: "easeOut" }
                : { repeat: Infinity, duration: 3, ease: "easeInOut" },
            }}
            onClick={handleOpen}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed z-[50] rounded-full shadow-2xl ${isMapMobileMode ? "right-[-10px] rounded-l-full rounded-r-none" : "right-3"} ${mobileBottomClass}
                       md:bottom-6 md:right-6
                       bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700
                       border-2 border-indigo-400/30 backdrop-blur-sm
                       hover:shadow-3xl transition-all duration-300 overflow-hidden`}
            style={{
              padding: isHovered && isMdUp ? "12px 20px" : isMdUp ? "16px" : "12px",
              width: isMapMobileMode ? "52px" : isHovered && isMdUp ? "auto" : isMdUp ? "64px" : "48px",
              height: isHovered && isMdUp ? "64px" : isMdUp ? "64px" : "48px",
            }}
            aria-label="Otwórz Asystenta AI"
            data-testid="ai-fab"
          >
            <span className="sr-only">Asystent AI</span>

            <motion.div
              animate={isHovered ? "hover" : "idle"}
              variants={glowVariants}
              className="absolute inset-2 rounded-full blur-sm -z-10"
              style={{
                background: 'radial-gradient(circle at center, var(--primary), transparent 40%)'
              }}
            />

            <motion.div
              animate={isHovered ? "hover" : "idle"}
              variants={glowVariants2}
              className="absolute inset-2 rounded-full blur-sm -z-10"
              style={{
                background: 'radial-gradient(circle at center, oklch(0.7 0.15 85), transparent 40%)'
              }}
            />

            <div className="flex items-center gap-3 relative z-10">
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-300" fill="currentColor" />
              </motion.div>

              <AnimatePresence>
                {isHovered && isMdUp && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="text-white font-semibold text-sm whitespace-nowrap"
                  >
                    Asystent AI
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <UnifiedAIConcierge
        mode="modal"
        open={open}
        onClose={() => setOpen(false)}
        seedQuery=""
      />
    </>
  );
}
