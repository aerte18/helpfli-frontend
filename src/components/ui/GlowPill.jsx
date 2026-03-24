import { motion } from "framer-motion";

export default function GlowPill({ icon = null, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative inline-flex items-center gap-2 rounded-full px-4 py-2
                 bg-white/6 backdrop-blur-md text-sm text-white/90
                 ring-1 ring-white/10 shadow-[0_2px_20px_rgb(0,0,0,0.08)]"
    >
      {/* Glow border */}
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full
                       bg-[conic-gradient(from_180deg_at_50%_50%,#9b87f5_0%,#22d3ee_40%,#a78bfa_70%,#22d3ee_100%)]
                       opacity-30 blur-[10px]" />

      {/* Thin gradient outline */}
      <span className="pointer-events-none absolute inset-0 rounded-full
                       [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] 
                       [mask-composite:exclude] p-px
                       bg-gradient-to-r from-indigo-400/60 via-cyan-300/60 to-violet-400/60" />

      {icon && <span className="text-base opacity-90">{icon}</span>}
      <span className="font-medium">{children}</span>
    </motion.div>
  );
}













