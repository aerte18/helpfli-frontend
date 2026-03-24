import { useEffect, useMemo, useState } from "react";
import { getRankingConfig, updateRankingConfig, recomputeAllRanking, getRankingAudit } from "../api/admin";

const LIMITS = {
  weightSub:      { min: 0, max: 5, step: 0.1 },
  weightBoosts:   { min: 0, max: 5, step: 0.1 },
  weightRating:   { min: 0, max: 20, step: 0.1 },
  weightCompleted:{ min: 0, max: 5, step: 0.1 },
  thresholdTop:   { min: 0, max: 500, step: 1 },
};

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

export default function AdminRankingConfig() {
  const [form, setForm] = useState({ weightSub: 1, weightBoosts: 1, weightRating: 10, weightCompleted: 0.5, thresholdTop: 60 });
  const [initial, setInitial] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    getRankingConfig().then(cfg => { if (cfg) { setForm(cfg); setInitial(cfg); } });
    getRankingAudit(25).then(setAudit);
  }, []);

  const diff = useMemo(() => {
    if (!initial) return {};
    const d = {};
    Object.keys(form).forEach(k => {
      if (Number(form[k]) !== Number(initial[k])) d[k] = { before: initial[k], after: form[k] };
    });
    return d;
  }, [form, initial]);

  const onChange = (e) => {
    const { name, value } = e.target;
    const lim = LIMITS[name];
    if (!lim) return setForm({ ...form, [name]: value });
    const num = Number(value);
    const valid = !Number.isNaN(num) && num >= lim.min && num <= lim.max;
    setErrors({ ...errors, [name]: valid ? null : `Zakres: ${lim.min} – ${lim.max}` });
    setForm({ ...form, [name]: valid ? num : clamp(num || 0, lim.min, lim.max) });
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const onSave = async () => {
    if (hasErrors) return alert("Popraw wartości poza zakresem.");
    setSaving(true);
    try {
      const payload = { ...form };
      const res = await updateRankingConfig(payload);
      alert("Zapisano konfigurację.");
      setInitial(res.value);
      setAudit(await getRankingAudit(25));
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const onRecompute = async () => {
    if (!window.confirm("Przeliczyć ranking dla wszystkich wykonawców?")) return;
    try {
      const r = await recomputeAllRanking();
      alert(`Przeliczono: ${r.processed} providerów.`);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="bg-white border rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Konfiguracja rankingu</h1>
        <div className="grid gap-4">
          {Object.entries(LIMITS).map(([name, lim]) => (
            <label key={name} className="flex items-center justify-between gap-4">
              <span className="capitalize">{name}</span>
              <div className="flex flex-col items-end">
                <input name={name} type="number" step={lim.step} min={lim.min} max={lim.max} value={form[name]} onChange={onChange} className={`border rounded-xl px-3 py-2 w-40 ${errors[name] ? 'border-rose-500' : ''}`} />
                <span className="text-xs text-gray-500 mt-1">min {lim.min} • max {lim.max}</span>
                {errors[name] && <span className="text-xs text-rose-600">{errors[name]}</span>}
              </div>
            </label>
          ))}
        </div>

        {Object.keys(diff).length > 0 && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm">
            <div className="font-semibold mb-2">Proponowane zmiany:</div>
            <ul className="space-y-1">
              {Object.entries(diff).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="text-gray-600">{k}</span>
                  <span><span className="line-through text-gray-400 mr-2">{v.before}</span>→ <span className="font-semibold">{v.after}</span></span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onSave} disabled={saving || hasErrors} className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">Zapisz</button>
          <button onClick={onRecompute} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Przelicz teraz</button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historia zmian (ostatnie)</h2>
          <button onClick={async () => setAudit(await getRankingAudit(25))} className="text-sm px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200">Odśwież</button>
        </div>
        <ul className="mt-4 divide-y">
          {audit.map(item => (
            <li key={item._id} className="py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm"><span className="font-medium">{item.user?.name || 'Admin'}</span><span className="text-gray-500"> • {new Date(item.createdAt).toLocaleString()}</span></div>
                <div className="text-xs text-gray-500">{item.ip}</div>
              </div>
              <div className="mt-2 text-sm">
                {Object.entries(item.diff || {}).length === 0 ? (
                  <span className="text-gray-500">Brak różnic</span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(item.diff).map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-gray-50 p-2">
                        <div className="text-gray-600">{k}</div>
                        <div className="text-xs"><span className="line-through text-gray-400 mr-2">{String(v.before)}</span><span className="font-semibold">→ {String(v.after)}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
          {audit.length === 0 && <li className="py-3 text-sm text-gray-500">Brak wpisów audytu.</li>}
        </ul>
      </div>
    </div>
  );
}




























