import GlowPill from "./GlowPill";
import { Sparkles, Zap, SlidersHorizontal } from "lucide-react";

export function AIFeaturePills() {
  return (
    <div className="flex flex-wrap gap-3">
      <GlowPill icon={<Sparkles size={16} />}>Inteligentna analiza</GlowPill>
      <GlowPill icon={<SlidersHorizontal size={16} />}>Dopasowane oferty</GlowPill>
      <GlowPill icon={<Zap size={16} />}>Szybka odpowiedź</GlowPill>
    </div>
  );
}













