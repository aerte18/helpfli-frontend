import { useEffect, useState } from "react";
import PromoCodeInput from "../components/PromoCodeInput";

export default function ClientBilling() {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState(null);
  const [plans, setPlans] = useState([]);
  const [sub, setSub] = useState(null);
  const [msg, setMsg] = useState("");

  const fetchAll = async () => {
    const [meRes, plansRes, subRes] = await Promise.all([
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` }}),
      fetch("/api/subscriptions/plans"),
      fetch("/api/subscriptions/me", { headers: { Authorization: `Bearer ${token}` }})
    ]);
    setMe(await meRes.json());
    setPlans(await plansRes.json());
    setSub(await subRes.json());
  };

  useEffect(() => { fetchAll(); }, []);

  const subscribe = async (planKey) => {
    const res = await fetch("/api/subscriptions/subscribe", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planKey })
    });
    const data = await res.json();
    setMsg(data.message || "Zaktualizowano subskrypcję");
    fetchAll();
  };

  const cancel = async () => {
    const res = await fetch("/api/subscriptions/cancel", {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMsg(data.message || "Anulowano auto-odnowienie");
    fetchAll();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Opłaty i korzyści</h1>

      {msg && <div className="rounded-xl border bg-emerald-50 text-emerald-700 px-4 py-2">{msg}</div>}

      {/* Sekcja 1: Punkty */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 p-4 border rounded-xl bg-white">
          <div className="text-sm text-gray-500 mb-1">Twoje punkty</div>
          <div className="text-3xl font-bold">{me?.loyaltyPoints ?? 0} pkt</div>
          <div className="text-xs text-gray-500 mt-2">
            1 pkt = 0,10 zł rabatu • min. 100 pkt do użycia
          </div>
        </div>

        {/* Sekcja 2: Kod rabatowy */}
        <div className="md:col-span-2 p-4 border rounded-xl bg-white">
          <div className="font-semibold mb-2">Masz kod rabatowy?</div>
          <PromoCodeInput onValidate={(p)=>alert(`Aktywny kod: ${p.code} (-${p.discountPercent || 0}% / -${p.discountFlat || 0} zł)`)} />
          <div className="text-xs text-gray-500 mt-2">
            Kod zadziała przy podsumowaniu zamówienia (na ekranie tworzenia zlecenia).
          </div>
        </div>
      </section>

      {/* Sekcja 3: Subskrypcje */}
      <section className="p-4 border rounded-xl bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Subskrypcja klienta</h2>
          {sub ? (
            <div className="text-sm">
              Aktywny plan: <b>{sub.planKey}</b> • do {new Date(sub.validUntil).toLocaleDateString()}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Brak aktywnej subskrypcji</div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {plans.map(p => (
            <div key={p.key} className="border rounded-xl p-4 flex flex-col">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="text-3xl font-bold my-2">{p.priceMonthly} zł/mies</div>
              <ul className="text-sm list-disc ml-5 mb-3 flex-1">
                {p.perks.map((perk,i)=>(<li key={i}>{perk}</li>))}
              </ul>
              <button className="btn" onClick={()=>subscribe(p.key)}>
                {sub?.planKey === p.key ? "Odnowij / Zmień" : "Wybierz"}
              </button>
            </div>
          ))}
        </div>

        {sub && (
          <button className="btn-secondary mt-4" onClick={cancel}>
            Anuluj auto-odnowienie
          </button>
        )}
      </section>

      {/* Sekcja 4: Informacja o dopłatach */}
      <section className="p-4 border rounded-xl bg-white">
        <h2 className="text-xl font-semibold mb-2">Dodatkowe opcje (dopłaty)</h2>
        <ul className="list-disc ml-5 text-sm">
          <li><b>Pilne zlecenie</b> – bezpłatne (wykonawcom zaleca się doliczyć 10% więcej za szybką reakcję)</li>
          <li><b>Gwarancja Helpfli</b> – +5% wartości bazowej</li>
          <li><b>Wykonawca premium</b> – +15 zł</li>
          <li><b>Podbicie oferty</b> – +5 zł (wyróżnienie oferty na 24h, w pakietach PRO bezpłatne)</li>
        </ul>
        <div className="text-xs text-gray-500 mt-2">
          Dopłaty wybierasz podczas tworzenia zlecenia – zobaczysz je w podglądzie ceny.
        </div>
      </section>

      {/* Sekcja 5: Historia (skrót) */}
      {me?.loyaltyHistory?.length > 0 && (
        <section className="p-4 border rounded-xl bg-white">
          <h2 className="text-xl font-semibold mb-2">Historia punktów (skrót)</h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr><th>Data</th><th>Zmiana</th><th>Powód</th></tr>
              </thead>
              <tbody>
                {me.loyaltyHistory.slice(-10).reverse().map((h,idx)=>(
                  <tr key={idx}>
                    <td>{new Date(h.ts).toLocaleString()}</td>
                    <td className={h.delta>=0 ? "text-emerald-600" : "text-rose-600"}>{h.delta>0?`+${h.delta}`:h.delta} pkt</td>
                    <td className="capitalize">{h.reason?.replaceAll("_"," ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-2">Pełna historia – wkrótce w osobnej zakładce.</div>
        </section>
      )}
    </div>
  );
}





























