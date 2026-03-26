import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';

export default function AdminSettings() {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');

  // A) Alerty anomalii
  const [thr, setThr] = useState({ minOrders: 30, absDropPp: 10, relDropPct: 20 });
  const [busy, setBusy] = useState(false);

  // B) Planer raportów per usługa
  const [svcCfg, setSvcCfg] = useState({ enabled: true, limit: 10, lang: 'pl', separate: true, includeCombined: true, recipients: '' });
  const [busySvc, setBusySvc] = useState(false);
  const [month, setMonth] = useState(()=>new Date().toISOString().slice(0,7));

  // C) Cache
  const [cacheInfo, setCacheInfo] = useState({ enabled: true, backend: 'lru', lruSize: 0, redisConnected: false });
  const [cachePrefix, setCachePrefix] = useState('preview:');
  const [flushing, setFlushing] = useState(false);

  const load = async () => {
    // anomaly
    const r1 = await fetch(apiUrl(`/api/admin/settings/anomalyThresholds`), { headers: { Authorization: `Bearer ${token}` }});
    const d1 = await r1.json();
    setThr({ minOrders: 30, absDropPp: 10, relDropPct: 20, ...d1.value });
    // monthlyServiceReports
    const r2 = await fetch(apiUrl(`/api/admin/settings/monthlyServiceReports`), { headers: { Authorization: `Bearer ${token}` }});
    const d2 = await r2.json();
    setSvcCfg({ enabled: d2.value?.enabled !== false, limit: d2.value?.limit ?? 10, lang: d2.value?.lang || 'pl', separate: d2.value?.separate !== false, includeCombined: d2.value?.includeCombined !== false, recipients: d2.value?.recipients || '' });
  };

  const loadCacheInfo = async () => {
    const res = await fetch(apiUrl(`/api/admin/cache/info`), { headers: { Authorization: `Bearer ${token}` }});
    const d = await res.json();
    setCacheInfo(d);
  };

  useEffect(()=>{ load(); loadCacheInfo(); },[]);

  const saveAnomaly = async () => {
    setBusy(true);
    try {
      await fetch(apiUrl(`/api/admin/settings/anomalyThresholds`), { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ value: thr }) });
      alert('Zapisano progi ✅');
    } catch (e) { alert('Błąd zapisu'); } finally { setBusy(false); }
  };

  const saveSvcCfg = async () => {
    setBusySvc(true);
    try {
      await fetch(apiUrl(`/api/admin/settings/monthlyServiceReports`), { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ value: svcCfg }) });
      alert('Zapisano ustawienia planera ✅');
    } catch (e) { alert('Błąd zapisu'); } finally { setBusySvc(false); }
  };

  const sendNow = async () => {
    setBusySvc(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/reports/monthly_services/send-now?month=${month}`), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd wysyłki');
      alert(`Wysłano raporty (${data.sent} załączników)`);
    } catch (e) { alert(e.message); } finally { setBusySvc(false); }
  };

  const flushPrefix = async () => {
    if (!cachePrefix.trim()) { alert('Podaj prefix'); return; }
    setFlushing(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/cache/flush`), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ prefix: cachePrefix.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd czyszczenia');
      alert(`OK. Usunięto (LRU: ${data.lruDeleted}, Redis: ${data.redisDeleted ?? '-'})`);
      await loadCacheInfo();
    } catch (e) { alert(e.message); } finally { setFlushing(false); }
  };

  const flushAll = async () => {
    if (!confirm('Na pewno wyczyścić CAŁY cache? (Redis + LRU)')) return;
    setFlushing(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/cache/flush?all=true`), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd czyszczenia');
      alert('Cache wyczyszczony.');
      await loadCacheInfo();
    } catch (e) { alert(e.message); } finally { setFlushing(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ustawienia (Admin)</h1>

      {/* A) Alerty anomalii */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="font-semibold">Alerty anomalii – spadek % płatności (tydz/tydz)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm">Min. zamówień (tydzień)
            <input type="number" className="border rounded p-2 w-full" value={thr.minOrders} onChange={e=>setThr({...thr, minOrders: parseInt(e.target.value||'0',10)})}/>
          </label>
          <label className="text-sm">Spadek absolutny (pp)
            <input type="number" step="0.1" className="border rounded p-2 w-full" value={thr.absDropPp} onChange={e=>setThr({...thr, absDropPp: parseFloat(e.target.value||'0')})}/>
          </label>
          <label className="text-sm">Spadek względny (%)
            <input type="number" className="border rounded p-2 w-full" value={thr.relDropPct} onChange={e=>setThr({...thr, relDropPct: parseFloat(e.target.value||'0')})}/>
          </label>
        </div>
        <button onClick={saveAnomaly} disabled={busy} className="px-4 py-2 rounded bg-indigo-600 text-white">{busy ? 'Zapisywanie…' : 'Zapisz progi'}</button>
      </div>

      {/* B) Planer raportów per usługa */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="font-semibold">Raporty „per usługa” – planer</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">Włączone
            <select className="border rounded p-2 w-full" value={String(svcCfg.enabled)} onChange={e=>setSvcCfg({...svcCfg, enabled: e.target.value==='true'})}>
              <option value="true">Tak</option>
              <option value="false">Nie</option>
            </select>
          </label>
          <label className="text-sm">Limit usług (Top)
            <input type="number" min={1} max={60} className="border rounded p-2 w-full" value={svcCfg.limit} onChange={e=>setSvcCfg({...svcCfg, limit: parseInt(e.target.value||'1',10)})}/>
          </label>
          <label className="text-sm">Język
            <select className="border rounded p-2 w-full" value={svcCfg.lang} onChange={e=>setSvcCfg({...svcCfg, lang: e.target.value})}>
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="text-sm">Odbiorcy (e-maile, po przecinku)
            <input type="text" className="border rounded p-2 w-full" placeholder="admin@helpfli.test,ops@helpfli.test" value={svcCfg.recipients} onChange={e=>setSvcCfg({...svcCfg, recipients: e.target.value})}/>
          </label>
          <label className="text-sm">Załączniki: osobne PDF per usługa
            <select className="border rounded p-2 w-full" value={String(svcCfg.separate)} onChange={e=>setSvcCfg({...svcCfg, separate: e.target.value==='true'})}>
              <option value="true">Tak</option>
              <option value="false">Nie</option>
            </select>
          </label>
          <label className="text-sm">Załączniki: jeden zbiorczy PDF
            <select className="border rounded p-2 w-full" value={String(svcCfg.includeCombined)} onChange={e=>setSvcCfg({...svcCfg, includeCombined: e.target.value==='true'})}>
              <option value="true">Tak</option>
              <option value="false">Nie</option>
            </select>
          </label>
        </div>
        <div className="flex gap-2 items-end">
          <button onClick={saveSvcCfg} disabled={busySvc} className="px-4 py-2 rounded bg-indigo-600 text-white">{busySvc ? 'Zapisywanie…' : 'Zapisz ustawienia planera'}</button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm">Miesiąc:
              <input type="month" className="border rounded p-2 ml-2" value={month} onChange={e=>setMonth(e.target.value)}/>
            </label>
            <button onClick={sendNow} disabled={busySvc} className="px-4 py-2 rounded bg-emerald-600 text-white">{busySvc ? 'Wysyłanie…' : 'Wyślij teraz'}</button>
          </div>
        </div>
        <p className="text-xs text-gray-500">Harmonogram CRON z ENV (<code>MONTHLY_SERVICES_CRON</code>). Ustawienia powyżej działają bez restartu.</p>
      </div>

      {/* C) Cache */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Cache (podglądy/raporty)</div>
          <button onClick={loadCacheInfo} className="px-3 py-1 rounded border">Odśwież</button>
        </div>
        <div className="text-sm text-gray-600">Status: <b>{cacheInfo.enabled ? 'włączony' : 'wyłączony'}</b>, backend: <b>{cacheInfo.backend}</b>, LRU keys: <b>{cacheInfo.lruSize}</b>, Redis: <b>{cacheInfo.redisConnected ? 'połączony' : 'brak'}</b></div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Prefix
            <input type="text" className="border rounded p-2 ml-2" placeholder="np. preview:, monthly:, svcCards:" value={cachePrefix} onChange={e=>setCachePrefix(e.target.value)} />
          </label>
          <button onClick={flushPrefix} disabled={flushing} className="px-3 py-2 rounded bg-amber-600 text-white">{flushing ? 'Czyszczenie…' : 'Wyczyść po prefixie'}</button>
          <button onClick={flushAll} disabled={flushing} className="px-3 py-2 rounded bg-rose-600 text-white ml-auto">{flushing ? 'Czyszczenie…' : 'Wyczyść CAŁY cache'}</button>
        </div>
        <p className="text-xs text-gray-500">Popularne prefixy: <code>preview:</code>, <code>monthly:</code>, <code>svcCards:</code>, <code>svcList:</code>. Czyszczenie „CAŁY” usuwa pamięć LRU i (jeśli skonfigurowany) Redis DB.</p>
      </div>
    </div>
  );
}
