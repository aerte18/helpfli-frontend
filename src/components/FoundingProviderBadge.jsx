import { Sparkles } from 'lucide-react';

/**
 * Badge „Pierwszy wykonawca Helpfli” / Founding Provider.
 */
export default function FoundingProviderBadge({ compact = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold bg-amber-100 text-amber-900 border border-amber-300/80 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      } ${className}`}
      title="Pierwszy wykonawca Helpfli — 0% prowizji, wyższa widoczność"
    >
      <Sparkles className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden />
      {compact ? 'Pierwszy' : 'Pierwszy wykonawca'}
    </span>
  );
}

export function hasFoundingProviderBadge(data) {
  if (!data) return false;
  if (data.isFoundingProvider) return true;
  const badges = data.badges;
  if (Array.isArray(badges) && badges.includes('founding_provider')) return true;
  if (badges && typeof badges === 'object' && badges.founding_provider) return true;
  return false;
}
