import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import UnifiedAIConcierge from "./ai/UnifiedAIConcierge";
import { useAuth } from "../context/AuthContext";
import { useBreakpointMd } from "../hooks/useBreakpointMd";

export default function AiWidget() {
  const { user } = useAuth();
  const isMdUp = useBreakpointMd();
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Ukryj widget dla providerów - Asystent AI jest tylko dla klientów
  if (user?.role === 'provider') {
    return null;
  }

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
      {/* Launcher */}
      <motion.button
        onClick={() => {
          setOpen(true);
        }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          y: [0, -5, 0]
        }}
        transition={{ 
          y: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed z-[50] rounded-full shadow-2xl
                   bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3
                   md:bottom-6 md:right-6
                   bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700
                   border-2 border-indigo-400/30 backdrop-blur-sm
                   hover:shadow-3xl transition-all duration-300 overflow-hidden"
        style={{
          padding: isHovered && isMdUp ? "12px 20px" : isMdUp ? "16px" : "12px",
          width: isHovered && isMdUp ? "auto" : isMdUp ? "64px" : "48px",
          height: isHovered && isMdUp ? "64px" : isMdUp ? "64px" : "48px",
        }}
        aria-label="Otwórz Asystenta AI"
        data-testid="ai-fab"
      >
        <span className="sr-only">Asystent AI</span>
        
        {/* Pulsująca aureola - żółty glow effect - tylko wewnątrz przycisku */}
        <motion.div
          animate={isHovered ? "hover" : "idle"}
          variants={glowVariants}
          className="absolute inset-2 rounded-full blur-sm -z-10"
          style={{
            background: 'radial-gradient(circle at center, var(--primary), transparent 40%)'
          }}
        />
        
        {/* Dodatkowy subtelny glow dla głębi - tylko wewnątrz przycisku */}
        <motion.div
          animate={isHovered ? "hover" : "idle"}
          variants={glowVariants2}
          className="absolute inset-2 rounded-full blur-sm -z-10"
          style={{
            background: 'radial-gradient(circle at center, oklch(0.7 0.15 85), transparent 40%)'
          }}
        />
        
        <div className="flex items-center gap-3 relative z-10">
          {/* Główna ikona Sparkles - żółte gwiazdki */}
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
          
          {/* Tekst "Asystent AI" - rozwija się przy hover */}
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

      {/* Modal */}
      <UnifiedAIConcierge 
        mode="modal"
        open={open} 
        onClose={() => setOpen(false)} 
        seedQuery=""
      />
    </>
  );
}
