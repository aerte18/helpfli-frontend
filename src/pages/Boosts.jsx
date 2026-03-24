import { useEffect, useState } from "react";
import { getBoostOptions, buyBoost } from "../api/subscriptions";

export default function Boosts() {
  const [options, setOptions] = useState([]);
  const [requestInvoice, setRequestInvoice] = useState(false);

  useEffect(() => {
    getBoostOptions().then(setOptions).catch(() => setOptions([]));
  }, []);

  const onBuy = async (code) => {
    try {
      await buyBoost(code, requestInvoice);
      alert("Aktywowano wyróżnienie / boost.");
      setRequestInvoice(false); // Reset checkbox
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Boosty i wyróżnienia</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {options.map(o => (
          <div key={o.code} className="rounded-2xl border bg-white p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="text-xl font-semibold">{o.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Kod: {o.code}</p>
              </div>
              <div className="text-2xl font-bold">{o.pricePLN} zł</div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestInvoice}
                  onChange={(e) => setRequestInvoice(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Chcę fakturę VAT</span>
              </label>
              <button onClick={() => onBuy(o.code)} className="w-full rounded-xl py-2 font-semibold bg-violet-600 text-white hover:bg-violet-700">Kup</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}




























