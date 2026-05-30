import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, TrendingUp, BadgeCheck, Loader2, Crown } from 'lucide-react';
import { getFoundingProviderStatus, activateFoundingProvider } from '../api/growth';
import { useAuth } from '../context/AuthContext';

const BENEFITS = [
  { icon: Crown, text: 'Pakiet PRO przez 60 dni' },
  { icon: Shield, text: '0% prowizji przez 60 dni' },
  { icon: BadgeCheck, text: 'Badge „Pierwszy wykonawca”' },
  { icon: TrendingUp, text: 'Większa widoczność na mapie i w AI' },
  { icon: Sparkles, text: '10 darmowych wyróżnień ofert' },
];

/**
 * Baner programu Founding Provider — landing, onboarding, panel wykonawcy.
 */
export default function FoundingProviderBanner({
  variant = 'marketing',
  showActivate = false,
  onActivated,
  className = '',
}) {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuth();
  const [status, setStatus] = useState({ remaining: null, limit: null, enabled: false, unavailable: true });
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getFoundingProviderStatus();
      if (!cancelled) {
        setStatus(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const counterAvailable =
    status?.remaining != null && status?.limit != null && !status?.unavailable;
  const remaining = counterAvailable ? Number(status.remaining) : null;
  const limit = counterAvailable ? Number(status.limit) : null;
  const spotsLow = counterAvailable && remaining > 0 && remaining <= 100;

  const handleActivate = async () => {
    if (!user) {
      navigate('/register?role=provider');
      return;
    }
    setActivating(true);
    setError('');
    try {
      await activateFoundingProvider();
      setActivated(true);
      await fetchMe?.();
      onActivated?.();
    } catch (e) {
      setError(e?.message || 'Nie udało się aktywować programu');
    } finally {
      setActivating(false);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isCompact
          ? 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-4'
          : 'border-amber-300/60 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 md:p-8 text-white shadow-lg'
      } ${className}`}
    >
      <div className={isCompact ? '' : 'max-w-3xl'}>
        <p
          className={`font-semibold uppercase tracking-wide ${
            isCompact ? 'text-amber-800 text-xs' : 'text-amber-100 text-xs md:text-sm'
          }`}
        >
          Program Pierwszy wykonawca
        </p>
        <h3
          className={`font-bold leading-tight mt-1 ${
            isCompact ? 'text-lg text-amber-950' : 'text-xl md:text-2xl'
          }`}
        >
          Dołącz do pierwszych 1000 wykonawców Helpfli
        </h3>

        {!loading && counterAvailable && status?.enabled !== false && (
          <p
            className={`mt-2 text-sm ${
              isCompact ? 'text-amber-900/90' : 'text-white/95'
            } ${spotsLow ? 'font-semibold' : ''}`}
          >
            Zostało <strong>{remaining}</strong> z {limit} miejsc
          </p>
        )}
        {!loading && !counterAvailable && (
          <p className={`mt-2 text-sm ${isCompact ? 'text-amber-900/80' : 'text-white/90'}`}>
            Licznik wolnych miejsc chwilowo niedostępny — aktywacja w panelu sprawdzi dostępność.
          </p>
        )}

        <ul
          className={`mt-4 grid gap-2 ${
            isCompact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:gap-3'
          }`}
        >
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className={`flex items-center gap-2 text-sm ${
                isCompact ? 'text-amber-950/90' : 'text-white/95'
              }`}
            >
              <Icon className={`shrink-0 w-4 h-4 ${isCompact ? 'text-amber-700' : 'text-amber-100'}`} />
              {text}
            </li>
          ))}
        </ul>

        {error && (
          <p className={`mt-3 text-sm ${isCompact ? 'text-red-700' : 'text-red-100'}`}>{error}</p>
        )}

        {activated && (
          <p className={`mt-3 text-sm font-medium ${isCompact ? 'text-emerald-800' : 'text-emerald-100'}`}>
            Status aktywowany — powodzenia!
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {showActivate &&
            user?.role === 'provider' &&
            !activated &&
            (counterAvailable ? remaining > 0 : status?.enabled !== false) &&
            !user?.foundingProviderEverActivated &&
            !user?.foundingProvider && (
            <button
              type="button"
              disabled={activating}
              onClick={handleActivate}
              className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${
                isCompact
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white text-orange-700 hover:bg-amber-50'
              }`}
            >
              {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Aktywuj status Pierwszego wykonawcy
            </button>
          )}
          {!showActivate && (
            <button
              type="button"
              onClick={() => {
                if (user?.role === 'provider') {
                  navigate('/provider-home');
                  return;
                }
                if (user?.role === 'company_owner') {
                  navigate('/account/company');
                  return;
                }
                navigate('/register?role=provider');
              }}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-sm ${
                isCompact
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white text-orange-700 hover:bg-amber-50'
              }`}
            >
              {user?.role === 'provider' || user?.role === 'company_owner'
                ? 'Przejdź do panelu wykonawcy'
                : 'Zarejestruj się jako wykonawca'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
