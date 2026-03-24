import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export default function AskAIButton({ onClick, children = "Zapytaj AI" }) {
  const [ripples, setRipples] = useState([]);

  return (
    <motion.button
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setRipples((r) => [...r, { x: e.clientX-rect.left, y: e.clientY-rect.top, id: crypto.randomUUID() }]);
        onClick?.(e);
      }}
      whileTap={{ scale: 0.98 }}
      className="relative inline-flex items-center gap-2 rounded-xl px-5 py-3
                 bg-white text-slate-900 font-semibold shadow-[0_10px_40px_rgba(79,70,229,0.35)]
                 ring-1 ring-slate-200 overflow-hidden"
    >
      {/* soft pulse */}
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl
                       bg-gradient-to-r from-indigo-200/40 via-fuchsia-200/40 to-cyan-200/40
                       animate-pulse" />
      <Sparkles className="h-5 w-5" />
      {children}

      {/* ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          onAnimationEnd={() => setRipples((x) => x.filter((i) => i.id !== r.id))}
          style={{ left: r.x, top: r.y }}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-indigo-400/30
                     animate-[ripple_700ms_ease-out_forwards]"
        />
      ))}
    </motion.button>
  );
}













