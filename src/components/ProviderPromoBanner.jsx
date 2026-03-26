import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const isActive = (d) => d && new Date(d) > new Date();
const leftDays = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

export default function ProviderPromoBanner() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(apiUrl("/api/promo/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) setData(await r.json());
      } catch (err) {
        console.error('ProviderPromoBanner fetch error:', err);
      }
    })();
  }, [token]);

  if (!data) return null;

  const p = data.promo || {};
  const hasAny =
    isActive(p.highlightUntil) || isActive(p.topBadgeUntil) || isActive(p.aiTopTagUntil);
  const daysTop = leftDays(p.topBadgeUntil);
  const nearEnd = daysTop !== null && daysTop >= 0 && daysTop <= 3;

  return (
    <div className="mb-4">
      {!hasAny ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <div className="font-semibold">Zwiększ widoczność profilu</div>
          <p className="text-sm text-indigo-900/80">
            Włącz <b>TOP</b> lub <b>Wyróżnienie</b> i zyskaj dodatkowe punkty w rankingu.
          </p>
          <div className="mt-2 flex gap-2">
            <Link to="/provider/promote" className="btn">Promuj profil</Link>
            <Link to="/provider/promote" className="btn-secondary">Zobacz cennik</Link>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl px-4 py-3 border ${nearEnd ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Promocja aktywna</div>
                             <div className="text-sm text-gray-700">
                 {isActive(p.topBadgeUntil) && <>Badge <b>TOP</b> do: <b>{new Date(p.topBadgeUntil).toLocaleString()}</b>. </>}
                 {isActive(p.aiTopTagUntil) && <>AI poleca do: <b>{new Date(p.aiTopTagUntil).toLocaleString()}</b>. </>}
                 {isActive(p.highlightUntil) && <>Wyróżnienie do: <b>{new Date(p.highlightUntil).toLocaleString()}</b>. </>}
               </div>
               {p.autoRenew && (
                 <div className="mt-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                   Auto-renew ON
                 </div>
               )}
               {nearEnd && (
                 <div className="text-sm mt-1">Kończy się za <b>{daysTop}</b> dni — przedłuż, aby nie stracić pozycji.</div>
               )}
            </div>
            <div className="flex gap-2">
              <Link to="/provider/promote" className="btn">Przedłuż</Link>
              {!p.autoRenew && (
                <Link to="/provider/promote" className="btn-secondary">Włącz auto-odnawianie</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
