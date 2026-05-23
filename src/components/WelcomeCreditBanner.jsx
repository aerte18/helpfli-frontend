import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGrowthMe } from '../api/growth';

const DISMISS_KEY = 'helpfli_welcome_credit_banner_dismissed';

/**
 * Baner bonusu powitalnego dla klientów (20 zł po pierwszym ukończonym zleceniu).
 */
export default function WelcomeCreditBanner({ variant = 'default', className = '' }) {
  const { user } = useAuth();
  const [growth, setGrowth] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (user?.role !== 'client') return;
    let cancelled = false;
    getGrowthMe()
      .then((data) => {
        if (!cancelled) setGrowth(data?.welcomeCredit);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role, user?._id]);

  if (user?.role !== 'client') return null;

  const eligible =
    growth?.eligible ??
    (user?.firstOrderBonusEligible && !user?.welcomeCreditUsed);
  const used = growth?.used ?? user?.welcomeCreditUsed;
  const amountPln =
    Number(growth?.amountPln ?? user?.welcomeCreditAmount) > 0
      ? Number(growth?.amountPln ?? user?.welcomeCreditAmount)
      : 20;

  if (!eligible && !used) return null;
  if (dismissed && !eligible) return null;

  const isCompact = variant === 'compact';

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch (_) {}
  };

  if (used && !eligible) {
    return (
      <div
        className={`rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3 text-sm text-emerald-900 ${className}`}
      >
        <span className="flex items-center gap-2">
          <Gift className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden />
          Bonus powitalny {amountPln} zł został dodany do portfela punktów.
        </span>
        <Link to="/account/wallet" className="font-semibold text-emerald-700 hover:underline shrink-0">
          Portfel
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${
        isCompact
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4'
          : 'border-emerald-300/70 bg-gradient-to-r from-emerald-600 to-teal-600 p-5 md:p-6 text-white shadow-md'
      } ${className}`}
    >
      <button
        type="button"
        onClick={dismiss}
        className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
          isCompact ? 'text-emerald-700 hover:bg-emerald-100' : 'text-white/80 hover:bg-white/10'
        }`}
        aria-label="Zamknij baner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className={isCompact ? 'pr-8' : 'pr-10 max-w-2xl'}>
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            isCompact ? 'text-emerald-800' : 'text-emerald-100'
          }`}
        >
          Bonus powitalny
        </p>
        <h3
          className={`font-bold mt-1 leading-snug ${
            isCompact ? 'text-lg text-emerald-950' : 'text-xl md:text-2xl'
          }`}
        >
          Odbierz {amountPln} zł kredytu po pierwszym zleceniu
        </h3>
        <p
          className={`mt-2 text-sm ${
            isCompact ? 'text-emerald-900/90' : 'text-white/95'
          }`}
        >
          Ukończ pierwsze zlecenie z płatnością w Helpfli — kredyt trafi do portfela punktów i obniży koszt kolejnych usług.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/create-order"
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isCompact
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Utwórz zlecenie
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/account/wallet"
            className={`inline-flex items-center min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium ${
              isCompact
                ? 'text-emerald-800 border border-emerald-300 hover:bg-emerald-100/80'
                : 'text-white border border-white/40 hover:bg-white/10'
            }`}
          >
            Portfel punktów
          </Link>
        </div>
      </div>
    </div>
  );
}
