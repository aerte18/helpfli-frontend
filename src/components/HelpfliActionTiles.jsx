import { motion } from "framer-motion";
import { FileEdit, Search, Sparkles, UserPlus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ICON_BG_COLORS = [
  'oklch(0.88 0.08 240)', // light blue
  'oklch(0.88 0.08 240)', // light blue
  'oklch(0.88 0.08 240)', // light blue
  'oklch(0.38 0.15 264)', // primary dark blue
];

function HelpfliActionTile({ icon: Icon, title, description, onClick, isPrimary = false, iconBgColor }) {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={onClick || (() => {})}
      className={`h-full flex flex-col rounded-xl border p-3 space-y-2 transition-all ${
        isPrimary 
          ? 'bg-primary text-primary-foreground border-primary hover:scale-105' 
          : 'bg-secondary hover:border-primary hover:shadow-xl'
      }`}
      style={!isPrimary ? {
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      } : {}}
      whileHover={{ scale: 1.02 }}
    >
      {/* Icon at top */}
      <div className="flex justify-center">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon 
            className={`h-6 w-6 md:h-7 md:w-7 ${isPrimary ? 'text-primary-foreground' : ''}`}
            style={!isPrimary ? { color: 'oklch(0.3 0.15 264)' } : {}}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Title and Description */}
      <div className="flex-1 flex flex-col justify-center text-center space-y-1">
        <h3 className={`font-semibold text-sm ${isPrimary ? 'text-primary-foreground' : ''}`}>
          {title}
        </h3>
        <p className={`text-[10px] leading-tight ${isPrimary ? 'text-white' : ''}`} style={!isPrimary ? { color: 'var(--muted-foreground)' } : {}}>
          {description}
        </p>
      </div>

      {/* Arrow button at bottom */}
      <div className="flex justify-end">
        <div 
          className="rounded-full h-8 w-8 flex items-center justify-center transition-all group-hover:translate-x-1"
          style={{ backgroundColor: iconBgColor }}
        >
          <ArrowRight 
            className={`h-3 w-3 ${isPrimary ? 'text-primary-foreground' : ''}`}
            style={!isPrimary ? { color: 'oklch(0.3 0.15 264)' } : {}}
          />
        </div>
      </div>
    </motion.button>
  );
}

export function TileCreateOrder({ onClick }) {
  const navigate = useNavigate();
  return (
    <HelpfliActionTile
      icon={FileEdit}
      title="Utwórz zlecenie"
      description="Opisz problem, a wykonawcy odpowiedzą"
      iconBgColor={ICON_BG_COLORS[0]}
      onClick={onClick || (() => navigate("/create-order"))}
    />
  );
}

export function TileSearchProviders({ onClick }) {
  const navigate = useNavigate();
  return (
    <HelpfliActionTile
      icon={Search}
      title="Szukaj wykonawców"
      description="Przeglądaj dostępnych specjalistów"
      iconBgColor={ICON_BG_COLORS[1]}
      onClick={onClick || (() => navigate("/home"))}
    />
  );
}

export function TileAskAI({ onClick }) {
  const navigate = useNavigate();
  return (
    <HelpfliActionTile
      icon={Sparkles}
      title="Zapytaj AI"
      description="Inteligentny asystent pomoże"
      iconBgColor={ICON_BG_COLORS[2]}
      onClick={onClick || (() => navigate("/concierge"))}
    />
  );
}

export function TileBecomeProvider({ onClick }) {
  const navigate = useNavigate();
  return (
    <HelpfliActionTile
      icon={UserPlus}
      title="Zostań wykonawcą"
      description="Dołącz do platformy i zacznij zarabiać"
      iconBgColor={ICON_BG_COLORS[3]}
      isPrimary={true}
      onClick={onClick || (() => navigate("/register?role=provider"))}
    />
  );
}

export default function HelpfliActionTiles() {
  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TileCreateOrder />
          <TileSearchProviders />
          <TileAskAI />
          <TileBecomeProvider />
        </div>
      </div>
    </section>
  );
}

