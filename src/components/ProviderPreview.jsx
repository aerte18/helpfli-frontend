import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { getProviderMini } from "../api/providers";
import { getProviderTrustBadges } from "../utils/providerTrustBadges";

function useAuthToken(){ try{ return localStorage.getItem("token") || ""; }catch{ return ""; } }

export default function ProviderPreview({ providerId, open, onClose, offer }) {
  const navigate = useNavigate();
  const token = useAuthToken();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !providerId) return;
    (async () => {
      try {
        setErr(""); setData(null);
        const d = await getProviderMini({ token, providerId });
        setData(d);
      } catch (e) {
        setErr(e.message || "Błąd");
      }
    })();
  }, [open, providerId, token]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Profil wykonawcy</div>
          <button className="text-sm opacity-70 hover:opacity-100" onClick={onClose}>Zamknij</button>
        </div>

        {err && <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 p-2 text-sm">{err}</div>}
        {!data && !err && <div className="text-sm opacity-70">Ładowanie…</div>}

        {data && (
          <div className="space-y-4">
            {/* Szczegóły oferty - jeśli są dostępne */}
            {offer && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-3">Szczegóły oferty</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700 font-medium">Kwota:</span>
                    <span className="text-2xl font-bold text-indigo-900">{offer.amount || offer.price} zł</span>
                  </div>
                  {offer.message && (
                    <div className="mt-2">
                      <span className="text-indigo-700 font-medium block mb-1">Wiadomość:</span>
                      <p className="text-indigo-900 bg-white p-2 rounded border border-indigo-200">{offer.message}</p>
                    </div>
                  )}
                  {offer.completionDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700 font-medium">Termin realizacji:</span>
                      <span className="text-indigo-900">
                        {new Date(offer.completionDate).toLocaleDateString('pl-PL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {offer.pricing?.badge && (
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-700 font-medium">Ocena ceny:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        offer.pricing.badge === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        offer.pricing.badge === 'fair' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                        offer.pricing.badge === 'low' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-rose-100 text-rose-800 border-rose-200'
                      } border`}>
                        {offer.pricing.badge === 'optimal' ? 'Optymalna oferta' :
                         offer.pricing.badge === 'fair' ? 'Uczciwa oferta' :
                         offer.pricing.badge === 'low' ? 'Niska cena' :
                         'Wysoka cena'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <img src={data.avatar || "https://via.placeholder.com/64"} alt="" className="w-14 h-14 rounded-full object-cover" />
              <div>
                <div className="font-semibold">{data.name}</div>
                <div className="text-sm opacity-70 mb-1">
                  Poziom: <b>{data.level}</b>
                  {data.providerTier && <> • Pakiet: <b className="uppercase">{data.providerTier}</b></>}
                  {data.hasHelpfliGuarantee && <> • <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px]"><ShieldCheck className="w-3 h-3 shrink-0" aria-hidden /> Gwarancja Helpfli+</span></>}
                </div>
                <div className="text-sm">⭐ {data.ratingAvg} ({data.ratingCount})</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Zleceń ukończonych" value={data.completedOrders} />
              <Metric label="Akceptacja ofert" value={`${data.acceptanceRate}%`} />
              <Metric label="Na czas" value={`${data.onTimeRate}%`} />
              <Metric label="Czas odpowiedzi" value={`${data.responseTimeMin} min`} />
            </div>

            {((Array.isArray(data.badges) && data.badges.length > 0) ||
              getProviderTrustBadges({
                ratingAvg: data.ratingAvg,
                ratingCount: data.ratingCount,
                completedOrders: data.completedOrders,
              }).length > 0) && (
              <div className="flex flex-wrap gap-2">
                {Array.isArray(data.badges) && data.badges.map((b, i) => {
                  const map = {
                    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    top_ai:   "bg-indigo-50 text-indigo-700 border-indigo-200",
                  };
                  const label = b === "verified" ? "Verified / KYC"
                              : b === "top_ai" ? "TOP AI"
                              : b;
                  const cls = map[b] || "bg-neutral-50";
                  return <span key={i} className={`text-xs px-2 py-1 rounded-full border ${cls}`}>{label}</span>;
                })}
                {getProviderTrustBadges({
                  ratingAvg: data.ratingAvg,
                  ratingCount: data.ratingCount,
                  completedOrders: data.completedOrders,
                }).map((b) => (
                  <span
                    key={b.key}
                    title={b.title}
                    className="text-xs px-2 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200"
                  >
                    {b.key === 'top_rated' && '⭐ '}
                    {b.key === 'new_provider' && '🆕 '}
                    {b.key === 'experienced' && '✓ '}
                    {b.label}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                className="rounded-xl px-4 py-2 bg-black text-white"
                onClick={() => {
                  onClose();
                  if (!offer && providerId) {
                    navigate(`/provider/${providerId}`);
                  }
                }}
              >
                {offer ? 'Zamknij' : 'Wybierz'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border p-3 bg-neutral-50">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}


