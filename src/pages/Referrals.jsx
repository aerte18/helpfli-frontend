import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Users,
  UserPlus,
  Briefcase,
  Copy,
  Check,
  Share2,
  Wallet,
  Sparkles,
  Clock,
  CircleCheck,
  ArrowRight,
} from 'lucide-react';
import { getMyReferral, getReferralHistory, getReferralRules } from '../api/referrals';
import { useAuth } from '../context/AuthContext';

const DEFAULT_RULES = {
  signup: {
    client: { referrerPoints: 50, referredPoints: 50 },
    provider: { referrerPoints: 100, referredPoints: 50 },
  },
  clientFirstOrder: { creditPlnEach: 20 },
  providerActivation: { proDays: 30, extraBoosts: 5 },
  pointsRedeemValuePln: 0.1,
};

function StatusBadge({ status, label }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    rewarded: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.completed}`}>
      {label}
    </span>
  );
}

function RewardRuleCard({ icon: Icon, title, steps, accent = 'indigo' }) {
  const accents = {
    indigo: 'from-indigo-50 to-violet-50 border-indigo-200',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200',
    purple: 'from-purple-50 to-fuchsia-50 border-purple-200',
  };
  const iconColors = {
    indigo: 'text-indigo-600 bg-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${accents[accent] || accents.indigo}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-xl ${iconColors[accent]}`}>
          <Icon className="w-5 h-5" aria-hidden />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border text-xs font-bold text-slate-700">
              {i + 1}
            </span>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{step.title}</div>
              <p className="text-sm text-slate-600 mt-0.5">{step.body}</p>
              {step.highlight && (
                <p className="text-sm font-semibold text-indigo-700 mt-1">{step.highlight}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Referrals() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [history, setHistory] = useState([]);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [data, hist, rulesRes] = await Promise.all([
          getMyReferral(),
          getReferralHistory(),
          getReferralRules().catch(() => null),
        ]);
        setReferralData(data);
        setHistory(hist.referrals || []);
        setRules(rulesRes?.rules || data?.rules || hist?.rules || DEFAULT_RULES);
      } catch (error) {
        console.error('Error loading referral data:', error);
        if (user?.referralCode) {
          setReferralData({
            referralCode: user.referralCode,
            shareUrl: `${window.location.origin}/register?ref=${user.referralCode}`,
            stats: {},
            rules: DEFAULT_RULES,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareUrl = referralData?.shareUrl || '';
  const code = referralData?.referralCode || user?.referralCode || '';
  const stats = referralData?.stats || {};
  const isProvider = user?.role === 'provider';
  const creditPln = rules.clientFirstOrder?.creditPlnEach ?? 20;
  const creditPts = Math.round(creditPln / (rules.pointsRedeemValuePln || 0.1));
  const proDays = rules.providerActivation?.proDays ?? 30;
  const extraBoosts = rules.providerActivation?.extraBoosts ?? 5;

  const clientSteps = useMemo(
    () => [
      {
        title: 'Zaproszony rejestruje się jako klient',
        body: 'Twój znajomy zakłada konto z Twoim linkiem lub kodem.',
        highlight: `Ty: +${rules.signup?.client?.referrerPoints ?? 50} pkt • On: +${rules.signup?.client?.referredPoints ?? 50} pkt`,
      },
      {
        title: 'Pierwsze ukończone zlecenie',
        body: 'Gdy zaproszony klient zakończy pierwsze zlecenie z płatnością w Helpfli (potwierdzenie odbioru).',
        highlight: `Oboje: +${creditPln} zł kredytu (${creditPts} pkt) w portfelu`,
      },
    ],
    [rules, creditPln, creditPts]
  );

  const providerSteps = useMemo(
    () => [
      {
        title: 'Zaproszony rejestruje się jako wykonawca',
        body: 'Wykonawca tworzy konto z Twoim kodem polecającym.',
        highlight: `Ty: +${rules.signup?.provider?.referrerPoints ?? 100} pkt • On: +${rules.signup?.provider?.referredPoints ?? 50} pkt`,
      },
      {
        title: 'Ukończenie profilu (onboarding)',
        body: 'Gdy wykonawca dokończy konfigurację profilu i będzie widoczny dla klientów.',
        highlight: `Ty: +${proDays} dni PRO (lub przedłużenie) + ${extraBoosts} darmowych wyróżnień ofert`,
      },
    ],
    [rules, proDays, extraBoosts]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[40vh] text-slate-500">
        Ładowanie programu poleceń…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white p-6 md:p-8 shadow-lg">
        <div className="relative z-10 max-w-xl">
          <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide mb-2">
            Program poleceń Helpfli
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Polecaj i zarabiaj realne korzyści</h1>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            Zapraszaj klientów i wykonawców. Punkty przy rejestracji, a potem większe nagrody —
            {isProvider ? ' kredyt 20 zł za klientów lub PRO za wykonawców.' : ' w tym 20 zł kredytu po pierwszym zleceniu zaproszonego klienta.'}
          </p>
        </div>
        <Gift className="absolute right-4 bottom-4 w-24 h-24 text-white/10 md:w-32 md:h-32" aria-hidden />
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Zaproszonych" value={stats.totalReferrals ?? 0} icon={Users} />
        <StatCard label="Klientów" value={stats.clientsReferred ?? 0} icon={UserPlus} tone="blue" />
        <StatCard label="Wykonawców" value={stats.providersReferred ?? 0} icon={Briefcase} tone="purple" />
        <StatCard label="Punkty (rejestracja)" value={stats.totalSignupPoints ?? 0} icon={Sparkles} tone="green" suffix="pkt" />
        <StatCard label="Kredyt zleceń" value={stats.totalCreditPlnEarned ?? 0} icon={Wallet} tone="emerald" suffix="zł" />
        <StatCard label="Oczekuje (klienci)" value={stats.pendingClientMilestones ?? 0} icon={Clock} tone="amber" />
        {isProvider && (
          <StatCard label="Oczekuje (wykonawcy)" value={stats.pendingProviderMilestones ?? 0} icon={Clock} tone="amber" />
        )}
        <StatCard label="Nagrody PRO" value={stats.providerRewardsGranted ?? 0} icon={CircleCheck} tone="green" />
      </div>

      {/* Kod i udostępnianie */}
      {code && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            Twój kod i link
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Wyślij link rejestracyjny — kod zostanie uzupełniony automatycznie.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-wide text-slate-900">
              {code}
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(code, 'code')}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'code' ? 'Skopiowano' : 'Kopiuj kod'}
            </button>
          </div>

          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Link do udostępnienia</label>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied === 'link' ? 'Skopiowano' : 'Kopiuj link'}
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Nagrody w punktach trafiają do jednego portfela (
            <Link to="/account/wallet" className="text-indigo-600 font-medium hover:underline">
              Konto → Portfel
            </Link>
            ). 1 pkt = {(rules.pointsRedeemValuePln ?? 0.1).toFixed(2)} zł przy płatnościach w Helpfli.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <ShareButton
              label="WhatsApp"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                const text = `Dołącz do Helpfli — mój kod: ${code}\n${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
            />
            <ShareButton
              label="Facebook"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const text = `Dołącz do Helpfli — kod ${code}`;
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
                  '_blank'
                );
              }}
            />
            <ShareButton
              label="Kopiuj wiadomość"
              className="bg-slate-600 hover:bg-slate-700 text-white"
              onClick={() => {
                copyToClipboard(`Dołącz do Helpfli!\nKod: ${code}\n${shareUrl}`, 'msg');
              }}
            />
          </div>
        </section>
      )}

      {/* Zasady nagród */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Zasady nagród</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <RewardRuleCard
            icon={UserPlus}
            title="Polecasz klienta"
            accent="emerald"
            steps={clientSteps}
          />
          <RewardRuleCard
            icon={Briefcase}
            title="Polecasz wykonawcę"
            accent="purple"
            steps={providerSteps}
          />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">Ważne</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Punkty przy rejestracji przyznawane są od razu po poprawnym kodzie.</li>
            <li>Kredyt {creditPln} zł (={creditPts} pkt) za klienta — dopiero po pierwszym ukończonym zleceniu w systemie Helpfli.</li>
            <li>Nagroda za wykonawcę — po ukończeniu onboardingu przez zaproszoną osobę.</li>
            <li>1 punkt = {(rules.pointsRedeemValuePln ?? 0.1).toFixed(2).replace('.', ',')} zł przy płatności za zlecenie.</li>
          </ul>
        </div>
      </section>

      {/* Portfel */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-indigo-950">Wykorzystaj punkty i kredyt</h3>
          <p className="text-sm text-indigo-800/90 mt-1">
            Saldo, historia i rabat przy kolejnych zleceniach — w portfelu punktów.
          </p>
        </div>
        <Link
          to="/account/wallet"
          className="inline-flex items-center gap-2 shrink-0 min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
        >
          Portfel punktów
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Historia */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Historia poleceń</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Jeszcze nikt nie skorzystał z Twojego kodu. Udostępnij link powyżej.
          </p>
        ) : (
          <ul className="space-y-3">
            {history.map((ref) => (
              <li
                key={ref._id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">
                      {ref.referred?.name || 'Użytkownik'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          ref.referredRole === 'provider'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ref.referredRole === 'provider' ? 'Wykonawca' : 'Klient'}
                      </span>
                      <StatusBadge
                        status={ref.status}
                        label={
                          ref.status === 'rewarded'
                            ? 'Nagroda przyznana'
                            : ref.status === 'pending'
                              ? 'W trakcie'
                              : 'Zarejestrowany'
                        }
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{ref.milestoneLabel}</p>
                  </div>
                  <div className="text-sm text-right shrink-0 space-y-1">
                    {ref.signupPointsReferrer > 0 && (
                      <div className="font-semibold text-indigo-600">+{ref.signupPointsReferrer} pkt (rejestracja)</div>
                    )}
                    {ref.creditGranted && (
                      <div className="font-semibold text-emerald-600">
                        +{ref.creditPln} zł ({ref.creditPoints} pkt)
                      </div>
                    )}
                    {ref.providerReferralGranted && (
                      <div className="font-semibold text-purple-600">
                        +{ref.proDaysAdded || proDays} dni PRO, +{ref.extraBoosts || extraBoosts} wyróżnień
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      {new Date(ref.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'slate', suffix = '' }) {
  const tones = {
    slate: 'text-slate-900',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-emerald-600',
    emerald: 'text-teal-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
        <Icon className="w-3.5 h-3.5" aria-hidden />
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${tones[tone] || tones.slate}`}>
        {value}
        {suffix && <span className="text-sm font-semibold ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

function ShareButton({ label, className, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${className}`}>
      {label}
    </button>
  );
}
