import { useEffect, useState } from 'react';
import { getMyReferral, getReferralHistory } from '../api/referrals';
import { useAuth } from '../context/AuthContext';

export default function Referrals() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [data, hist] = await Promise.all([
          getMyReferral(),
          getReferralHistory()
        ]);
        setReferralData(data);
        setHistory(hist.referrals || []);
      } catch (error) {
        console.error('Error loading referral data:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = referralData?.shareUrl || '';

  if (loading) return <div className="max-w-4xl mx-auto p-4">Ładowanie…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Program polecający</h1>
        <p className="text-indigo-100">
          Zaproś znajomych i otrzymaj 50 punktów za każdego zaproszonego użytkownika!
        </p>
      </div>

      {/* Statystyki */}
      {referralData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Zaproszonych</div>
            <div className="text-2xl font-bold">{referralData.stats?.totalReferrals || 0}</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Klientów</div>
            <div className="text-2xl font-bold text-blue-600">{referralData.stats?.clientsReferred || 0}</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Wykonawców</div>
            <div className="text-2xl font-bold text-purple-600">{referralData.stats?.providersReferred || 0}</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Oczekujących</div>
            <div className="text-2xl font-bold">{referralData.stats?.pendingReferrals || 0}</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Zarobione punkty</div>
            <div className="text-2xl font-bold text-green-600">{referralData.stats?.totalRewards || 0}</div>
          </div>
        </div>
      )}

      {/* Kod referencyjny */}
      {referralData && (
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Twój kod referencyjny</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 border rounded-xl p-4 font-mono text-lg font-bold">
              {referralData.referralCode}
            </div>
            <button
              onClick={() => copyToClipboard(referralData.referralCode)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {copied ? '✓ Skopiowano' : 'Kopiuj'}
            </button>
          </div>
          
          <div className="mt-4">
            <label className="text-sm text-gray-600 mb-2 block">Link do udostępnienia</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-gray-50 border rounded-xl p-3 text-sm"
              />
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {copied ? '✓' : 'Kopiuj link'}
              </button>
            </div>
          </div>

          {/* Przyciski udostępniania */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                const text = `Dołącz do Helpfli używając mojego kodu: ${referralData.referralCode}\n${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              📱 WhatsApp
            </button>
            <button
              onClick={() => {
                const text = `Dołącz do Helpfli używając mojego kodu: ${referralData.referralCode}\n${shareUrl}`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, '_blank');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              📘 Facebook
            </button>
            <button
              onClick={() => {
                const text = `Dołącz do Helpfli używając mojego kodu: ${referralData.referralCode}\n${shareUrl}`;
                navigator.clipboard.writeText(text);
                alert('Tekst skopiowany do schowka!');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              📋 Email
            </button>
          </div>
        </div>
      )}

      {/* Nagrody */}
      <div className="bg-white border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Jak działają nagrody?</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-semibold">Rejestracja klienta</div>
              <div className="text-sm text-gray-600">Otrzymujesz <span className="font-semibold text-indigo-600">50 punktów</span>, klient otrzymuje 50 punktów</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-semibold">Rejestracja wykonawcy</div>
              <div className="text-sm text-gray-600">Otrzymujesz <span className="font-semibold text-purple-600">100 punktów</span>, wykonawca otrzymuje 50 punktów</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-semibold">Pierwsze zlecenie</div>
              <div className="text-sm text-gray-600">Dodatkowe 50 punktów dla obu po pierwszym zleceniu</div>
            </div>
          </div>
          {user?.role === 'provider' && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold flex-shrink-0">
                4
              </div>
              <div>
                <div className="font-semibold">10 zrealizowanych zleceń</div>
                <div className="text-sm text-gray-600">500 punktów dla Ciebie, gdy zaproszony provider zrealizuje 10 zleceń</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Co można zrobić z punktami */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Co możesz zrobić z punktami?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💰</span>
              <div className="font-semibold">Rabaty przy płatnościach</div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-1">• 1 punkt = 0,10 zł rabatu</p>
              <p className="mb-1">• Minimum 100 punktów do użycia</p>
              <p>• Możesz użyć przy tworzeniu zlecenia</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <div className="font-semibold">Opłacanie dopłat</div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-1">• Opłać dopłatę za priorytetowe zlecenie</p>
              <p className="mb-1">• Opłać dopłatę za ekspresową usługę</p>
              <p>• Opłać dopłatę za wykonawcę premium</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏆</span>
              <div className="font-semibold">Poziomy lojalności</div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-1">• <span className="font-medium">500 pkt</span> - Srebrny tier (5% zniżki)</p>
              <p className="mb-1">• <span className="font-medium">2000 pkt</span> - Złoty tier (10% zniżki + priorytetowa obsługa)</p>
              <p>• <span className="font-medium">5000 pkt</span> - Platynowy tier (15% zniżki + priorytetowa obsługa)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎖️</span>
              <div className="font-semibold">Odznaki i osiągnięcia</div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-1">• Odblokuj specjalne odznaki</p>
              <p className="mb-1">• Zwiększ swoją widoczność</p>
              <p>• Pokazuj osiągnięcia w profilu</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-indigo-100 rounded-xl">
          <div className="text-sm font-medium text-indigo-900 mb-1">
            💡 Wskazówka
          </div>
          <div className="text-sm text-indigo-800">
            {user?.role === 'client' 
              ? 'Używaj punktów przy tworzeniu zleceń, aby zmniejszyć koszt usługi. Im więcej punktów, tym większy rabat!'
              : 'Im więcej punktów zdobędziesz, tym wyższy tier i większe zniżki na opłaty platformowe. Polecaj znajomych, aby szybciej osiągnąć wyższe poziomy!'
            }
          </div>
        </div>
      </div>

      {/* Historia */}
      {history.length > 0 && (
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Historia poleceń</h2>
          <div className="space-y-2">
            {history.map((ref) => (
              <div key={ref._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-semibold">{ref.referred?.name || 'Użytkownik'}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      ref.referredRole === 'provider' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ref.referredRole === 'provider' ? '👷 Wykonawca' : '👤 Klient'}
                    </span>
                    <span>
                      {ref.status === 'completed' ? 'Zarejestrowany' : ref.status === 'rewarded' ? 'Nagrody przyznane' : 'Oczekuje'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    ref.referredRole === 'provider' ? 'text-purple-600' : 'text-indigo-600'
                  }`}>
                    +{ref.referrerReward?.points || 0} pkt
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
