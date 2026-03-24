import { motion } from "framer-motion";

function TypingDots() {
  const dot = {
    initial: { y: 0, opacity: 0.5 },
    animate: (i) => ({
      y: [0, -3, 0],
      opacity: [0.5, 1, 0.5],
      transition: { repeat: Infinity, duration: 1.1, delay: i * 0.15, ease: "easeInOut" },
    }),
  };
  return (
    <div className="flex items-center gap-1">
      {[0,1,2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          variants={dot}
          initial="initial"
          animate="animate"
          className="h-2 w-2 rounded-full bg-white/80"
        />
      ))}
    </div>
  );
}

export default function AIBubble({ children, typing = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative max-w-[80%] rounded-2xl px-4 py-3 mr-4
                 bg-gray-50 border border-gray-200
                 text-gray-800 shadow-sm"
    >
      <div className="leading-relaxed">
        {typing ? <TypingDots /> : children}
      </div>
    </motion.div>
  );
}
