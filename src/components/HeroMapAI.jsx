import { motion } from "framer-motion";

export default function HeroMapAI() {
  return (
    <div className="hidden lg:block relative">
      <div className="rounded-3xl p-8 backdrop-blur-sm h-[340px] flex items-stretch overflow-hidden" style={{ background: 'linear-gradient(to bottom right, oklch(from var(--primary) l c h / 0.1), var(--secondary), oklch(from var(--accent) l c h / 0.2))' }}>
        <img
          src="/img/isometric-map-with-contractor-location-pins.jpg"
          alt="Helpfli Platform Illustration"
          className="w-full h-full object-contain rounded-2xl scale-[1.7]"
        />
        <div className="absolute top-4 right-4 rounded-xl p-4 shadow-xl border animate-float" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="text-sm">
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Znajdź pomoc w okolicy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

