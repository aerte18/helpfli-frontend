import { useEffect, useState } from "react";
import PromoCodeInput from "../components/PromoCodeInput";

export default function BillingBenefits() {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setMe(await res.json());
      } catch {}
    })();
  }, [token]);

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 p-4 border rounded-xl bg-white">
          <div className="text-sm text-gray-500 mb-1">Twoje punkty</div>
          <div className="text-3xl font-bold">{me?.loyaltyPoints ?? 0} pkt</div>
          <div className="text-xs text-gray-500 mt-2">1 pkt = 0,10 zł rabatu • min. 100 pkt do użycia</div>
        </div>
        <div className="md:col-span-2 p-4 border rounded-xl bg-white">
          <div className="font-semibold mb-2">Masz kod rabatowy?</div>
          <PromoCodeInput onValidate={(p)=>alert(`Aktywny kod: ${p.code} (-${p.discountPercent||0}% / -${p.discountFlat||0} zł)`)} />
          <div className="text-xs text-gray-500 mt-2">Kod zadziała przy podsumowaniu zamówienia (ekran tworzenia zlecenia).</div>
        </div>
      </section>

      <section className="p-4 border rounded-xl bg-white">
        <h2 className="text-xl font-semibold mb-2">Dodatkowe opcje (dopłaty)</h2>
        <ul className="list-disc ml-5 text-sm">
          <li><b>Ekspres</b> – +20 zł (w planach Plus/Pro część „ekspresów” za darmo)</li>
          <li><b>Gwarancja Helpfli</b> – +5% wartości bazowej</li>
          <li><b>Wykonawca premium</b> – +15 zł</li>
        </ul>
        <div className="text-xs text-gray-500 mt-2">Dopłaty wybierasz podczas tworzenia zlecenia – zobaczysz je w podglądzie ceny.</div>
      </section>

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
        </section>
      )}
    </div>
  );
}





























