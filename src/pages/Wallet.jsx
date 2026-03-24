import { useEffect, useState } from "react";
import { getMyPoints, redeemPoints } from "../api/subscriptions";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [redeem, setRedeem] = useState(0);

  const load = async () => {
    const { balance, history } = await getMyPoints();
    setBalance(balance);
    setHistory(history);
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
      <h1 className="text-2xl font-bold mb-4">Portfel punktów</h1>
      <div className="rounded-xl border bg-white p-4 mb-6">
        <div className="text-sm text-gray-600">Saldo</div>
        <div className="text-3xl font-bold">{balance} pkt</div>
        <div className="mt-4 flex gap-2">
          <input type="number" value={redeem} onChange={e => setRedeem(e.target.value)} className="border rounded-xl px-3 py-2 w-40" placeholder="Ile punktów?" />
          <button onClick={onRedeem} className="rounded-xl px-4 py-2 bg-violet-600 text-white">Wykorzystaj</button>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="font-semibold mb-2">Historia</div>
        <div className="text-sm text-gray-600">najnowsze na górze</div>
        <ul className="mt-3 divide-y">
          {history.map(h => (
            <li key={h._id} className="py-2 grid grid-cols-4 gap-2 items-center">
              <div>{h.reason}</div>
              <div className={`${h.delta>=0?"text-emerald-700":"text-rose-700"} font-semibold`}>{h.delta>0?`+${h.delta}`:h.delta} pkt</div>
              <div className="text-gray-500">{new Date(h.createdAt).toLocaleString()}</div>
              <div className="text-gray-800">{h.balanceAfter} pkt</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}




























