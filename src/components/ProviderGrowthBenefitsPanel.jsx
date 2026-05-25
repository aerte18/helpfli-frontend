import { Link } from 'react-router-dom';
import {
  Sparkles,
  Percent,
  Zap,
  Crown,
  Calendar,
  Info,
  Gift,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGrowthMe } from '../api/growth';
import { useEffect, useMemo, useState } from 'react';

/**
 * Panel aktywnych benefitów growth — prowizja, boosty, subskrypcja (osobno).
 *
 * Props:
 * - collapsible: gdy true, panel renderuje się jako zwijany (mała belka + chevron).
 * - defaultCollapsed: stan startowy, gdy nic nie ma w localStorage.
 * - storageKey: klucz pod jakim trzymamy stan zwinięcia (per-strona).
 */
export default function ProviderGrowthBenefitsPanel({
  className = '',
  compact = false,
  collapsible = false,
  defaultCollapsed = true,
  storageKey = 'providerGrowthBenefitsPanel:collapsed',
}) {
  const { user } = useAuth();
  const [benefits, setBenefits] = useState(user?.growthBenefits || null);

  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible) return false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === '0') return false;
      if (raw === '1') return true;
    } catch (_) {}
    return defaultCollapsed;
  });

  useEffect(() => {
    if (!collapsible) return;
    try {
      localStorage.setItem(storageKey, collapsed ? '1' : '0');
    } catch (_) {}
  }, [collapsed, collapsible, storageKey]);

  useEffect(() => {
    if (user?.role !== 'provider') return;
    if (user?.growthBenefits) {
      setBenefits(user.growthBenefits);
      return;
    }
    getGrowthMe()
      .then((d) => setBenefits(d.growthBenefits || d))
      .catch(() => {});
  }, [user?.role, user?._id, user?.growthBenefits]);

  const founding = benefits?.provider?.foundingProvider;
  const sub = benefits?.provider?.subscription;
  const foundingActive = founding?.active;

  // Krótki opis dla trybu zwiniętego — pokazujemy maks. 2 etykiety
  const chips = useMemo(() => {
    const out = [];
    if (foundingActive) {
      out.push(founding?.commissionLabel || '0% prowizji');
    }
    if (foundingActive && (founding?.freeBoostsRemaining ?? 0) > 0) {
      out.push(`${founding.freeBoostsRemaining} darmowych boostów`);
    }
    if (sub) {
      out.push(`Subskrypcja ${sub.planName}`);
    }
    return out;
  }, [foundingActive, founding, sub]);

  if (user?.role === 'client') {
    const wc = benefits?.client?.welcomeCredit || user?.growthBenefits?.client?.welcomeCredit;
    if (!wc?.eligible && !wc?.used) return null;
    return (
      <div className={`rounded-xl border border-emerald-200 bg-emerald-50 p-4 ${className}`}>
        <div className="flex gap-3">
          <Gift className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-950 text-sm">{wc.title || 'Bonus powitalny'}</p>
            <p className="text-sm text-emerald-800 mt-1">{wc.description}</p>
            {wc.eligible && (
              <Link to="/create-order" className="inline-block mt-2 text-sm font-semibold text-emerald-700 hover:underline">
                Utwórz pierwsze zlecenie →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'provider') return null;

  if (!foundingActive && !sub) return null;

  if (compact && !foundingActive) return null;

  const headerInteractive = collapsible;

  return (
    <div className={`rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={headerInteractive ? () => setCollapsed((v) => !v) : undefined}
        aria-expanded={headerInteractive ? !collapsed : undefined}
        className={`w-full px-4 py-2.5 ${collapsed ? '' : 'border-b border-amber-200/60'} bg-amber-100/40 flex items-center gap-2 text-left ${
          headerInteractive ? 'hover:bg-amber-100/70 transition-colors cursor-pointer' : 'cursor-default'
        }`}
      >
        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-700 shrink-0" aria-hidden />
        <h3 className="font-semibold text-amber-950 text-sm shrink-0">Twoje aktywne korzyści</h3>

        {collapsible && collapsed && chips.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 min-w-0 ml-1 overflow-hidden">
            {chips.slice(0, 2).map((c, i) => (
              <span
                key={i}
                className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-white/70 border border-amber-200 text-amber-900 whitespace-nowrap truncate max-w-[180px]"
              >
                {c}
              </span>
            ))}
            {chips.length > 2 && (
              <span className="text-[11px] font-medium text-amber-800">+{chips.length - 2}</span>
            )}
          </div>
        )}

        {collapsible && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-amber-800">
            <span className="hidden md:inline">{collapsed ? 'Pokaż' : 'Zwiń'}</span>
            {collapsed ? (
              <ChevronDown className="w-4 h-4" aria-hidden />
            ) : (
              <ChevronUp className="w-4 h-4" aria-hidden />
            )}
          </span>
        )}
      </button>

      {!(collapsible && collapsed) && (
        <div className="p-4 space-y-4">
          {foundingActive && (
            <BenefitRow
              icon={Percent}
              title={founding.commissionLabel || '0% prowizji platformy'}
              detail={
                founding.expiresAtLabel
                  ? `Bez prowizji od zleceń w Helpfli do ${founding.expiresAtLabel}${
                      founding.daysRemaining != null ? ` (pozostało ${founding.daysRemaining} dni)` : ''
                    }`
                  : 'Program Pierwszy wykonawca'
              }
              badge="Pierwszy"
            />
          )}

          {foundingActive && (founding.freeBoostsRemaining ?? 0) > 0 && (
            <BenefitRow
              icon={Zap}
              title={`${founding.freeBoostsRemaining} darmowych wyróżnień ofert`}
              detail={`Z puli startowej (${founding.freeBoostsTotal || 10} łącznie w programie Pierwszy wykonawca). Zużywasz je przy boostcie oferty — przed płatnymi i limitami PRO.`}
            />
          )}

          {sub && (
            <BenefitRow
              icon={Crown}
              title={`Subskrypcja ${sub.planName}`}
              detail={
                sub.validUntilLabel
                  ? `Pakiet aktywny do ${sub.validUntilLabel}${
                      sub.daysRemaining != null ? ` (${sub.daysRemaining} dni)` : ''
                    }. Opłata abonamentowa jest osobna od prowizji od zleceń.`
                  : 'Aktywny pakiet PRO / Standard'
              }
              badge="Pakiet"
            />
          )}

          {founding?.stacksWithSubscription && (foundingActive && sub) && (
            <p className="text-xs text-amber-900/80 flex gap-2 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              {founding.stacksWithSubscription}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/subscriptions?audience=provider"
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
            >
              Zarządzaj subskrypcją
            </Link>
            <span className="text-amber-400">·</span>
            <Link to="/account?tab=referrals" className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline">
              Program poleceń
            </Link>
            {collapsible && (
              <>
                <span className="text-amber-400">·</span>
                <Link to="/account" className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline">
                  Zobacz na koncie
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BenefitRow({ icon: Icon, title, detail, badge }) {
  return (
    <div className="flex gap-3">
      <div className="p-2 rounded-lg bg-white border border-amber-200/80 h-fit">
        <Icon className="w-4 h-4 text-amber-700" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-amber-950 text-sm">{title}</span>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-amber-900/85 mt-1 leading-relaxed">{detail}</p>
      </div>
      <Calendar className="w-4 h-4 text-amber-600/50 shrink-0 hidden sm:block" aria-hidden />
    </div>
  );
}
