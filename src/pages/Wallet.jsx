import { useEffect, useState } from "react";
import { getMyPoints, redeemPoints } from "../api/subscriptions";
import WelcomeCreditBanner from "../components/WelcomeCreditBanner";

const REASON_FALLBACK = {
  welcome_first_order: "Bonus powitalny",
  referral_signup: "Polecenie — rejestracja",
  referral_signup_client: "Polecenie — rejestracja",
  referral_signup_provider: "Polecenie — rejestracja (wykonawca)",
  referral_client_first_order_referrer: "Polecenie — pierwsze zlecenie",
  referral_client_first_order_referred: "Bonus za polecenie",
  manual_redeem: "Wykorzystanie punktów",
  redeem: "Wykorzystanie punktów",
};

function labelForReason(h) {
  return h.reasonLabel || REASON_FALLBACK[h.reason] || h.reason || "Punkty";
}

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [balancePln, setBalancePln] = useState(0);
  const [redeemValue, setRedeemValue] = useState(0.1);
  const [history, setHistory] = useState([]);
  const [redeem, setRedeem] = useState(0);

  const load = async () => {
    const data = await getMyPoints();
    setBalance(data.balance ?? 0);
    setBalancePln(data.balancePln ?? (data.balance || 0) * (data.redeemValuePln || 0.1));
    setRedeemValue(data.redeemValuePln ?? 0.1);
    setHistory(data.history || []);
  };

  useEffect(() => { load(); }, []);

  const onRedeem = async () => {
    const v = Number(redeem);
    if (!v || v <= 0) return alert("Podaj dodatnią liczbę punktów do wykorzystania");
    try {
      await redeemPoints(-v, "manual_redeem");
      await load();
      setRedeem(0);
      alert("Wykorzystano punkty.");
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <WelcomeCreditBanner className="mb-6" />
      <h1 className="text-2xl font-bold mb-4">Portfel punktów</h1>
      <div className="rounded-xl border bg-white p-4 mb-6">
        <div className="text-sm text-gray-600">Saldo</div>
        <div className="text-3xl font-bold">{balance} pkt</div>
        <p className="text-sm text-emerald-700 mt-1 font-medium">
          ≈ {balancePln.toFixed(2)} zł do wykorzystania przy płatnościach
        </p>
        <p className="text-xs text-gray-500 mt-2">
          1 pkt = {redeemValue.toFixed(2)} zł · Bonus powitalny i polecenia trafiają tutaj jako punkty
        </p>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <input type="number" value={redeem} onChange={e => setRedeem(e.target.value)} className="border rounded-xl px-3 py-2 w-40" placeholder="Ile punktów?" />
          <button onClick={onRedeem} className="rounded-xl px-4 py-2 bg-violet-600 text-white">Wykorzystaj</button>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="font-semibold mb-2">Historia</div>
        <div className="text-sm text-gray-600">najnowsze na górze</div>
        <ul className="mt-3 divide-y">
          {history.length === 0 && (
            <li className="py-4 text-sm text-gray-500">Brak operacji — zdobądź punkty przez polecenia lub bonus powitalny.</li>
          )}
          {history.map(h => (
            <li key={h._id} className="py-2 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <div className="text-sm">{labelForReason(h)}</div>
              <div className={`${h.delta>=0?"text-emerald-700":"text-rose-700"} font-semibold`}>{h.delta>0?`+${h.delta}`:h.delta} pkt</div>
              <div className="text-gray-500 text-sm">{h.createdAt ? new Date(h.createdAt).toLocaleString('pl-PL') : '—'}</div>
              <div className="text-gray-800 text-sm">{h.balanceAfter != null ? `${h.balanceAfter} pkt` : ''}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
