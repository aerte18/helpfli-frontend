import { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/toast/ToastProvider";

const PRICE_PER_DAY = { 2: 3000, 7: 2000 };

function fmtPLN(g){ return (g/100).toFixed(2).replace('.', ',') + ' zł'; }
function daysBetween(a,b){ if(!a||!b) return 0; const s=new Date(a), e=new Date(b); const ms=Math.max(0,e.setHours(0,0,0,0)-s.setHours(0,0,0,0)); return Math.floor(ms/86400000)+1; }

export default function ProviderSponsored(){
  const token = localStorage.getItem('token');
  const { push } = useToast();
  const [list, setList] = useState([]);
  const [service, setService] = useState('*');
  const [pos2, setPos2] = useState(true);
  const [pos7, setPos7] = useState(false);
  const [startAt, setStartAt] = useState(()=> new Date().toISOString().slice(0,10));
  const [endAt, setEndAt] = useState(()=> { const d=new Date(); d.setDate(d.getDate()+6); return d.toISOString().slice(0,10); });

  const positions = useMemo(()=>{ const arr=[]; if(pos2) arr.push(2); if(pos7) arr.push(7); return arr; },[pos2,pos7]);
  const days = useMemo(()=> daysBetween(startAt,endAt), [startAt,endAt]);
  const amount = useMemo(()=> positions.reduce((s,p)=> s + (PRICE_PER_DAY[p]||0)*Math.max(0,days), 0), [positions, days]);

  const load = async ()=>{
    const r = await fetch('/api/sponsor/me', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setList(await r.json());
  };

  useEffect(()=>{
    load();
    const q = new URLSearchParams(window.location.search);
    if (q.get('paid')==='1'){
      push({ title:'Kampania opłacona', description:'Została dodana do harmonogramu.', variant:'success' });
      window.history.replaceState({},'',window.location.pathname);
      load();
    }
    if (q.get('canceled')==='1'){
      push({ title:'Płatność anulowana', description:'Kampania nie została utworzona.', variant:'error' });
      window.history.replaceState({},'',window.location.pathname);
    }
  },[]);

  const pay = async ()=>{
    if (!positions.length){ push({ title:'Wybierz sloty (#2/#7)', variant:'error' }); return; }
    if (days<1 || days>62){ push({ title:'Zakres 1–62 dni', variant:'error' }); return; }
    const r = await fetch('/api/sponsor/checkout',{
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ service, positions, startAt, endAt })
    });
    const d = await r.json();
    if (!r.ok || !d.url){ push({ title:'Błąd płatności', description:d.message||'Spróbuj ponownie', variant:'error' }); return; }
    window.location.href = d.url;
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Sloty sponsorowane</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="font-semibold mb-2">Nowa kampania</div>
          <div className="space-y-3 text-sm">
            <label className="block">
              <div className="text-gray-600 mb-1">Usługa (opcjonalnie)</div>
              <input value={service} onChange={e=>setService(e.target.value)} className="w-full rounded-xl border px-3 py-2" placeholder='np. "hydraulik" lub "*" (wszystkie)' />
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={pos2} onChange={e=>setPos2(e.target.checked)} />
                <span>Pozycja #2 (30 zł/dzień)</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={pos7} onChange={e=>setPos7(e.target.checked)} />
                <span>Pozycja #7 (20 zł/dzień)</span>
              </label>
            </div>
            <div className="flex gap-3">
              <label className="flex-1">
                <div className="text-gray-600 mb-1">Start</div>
                <input type="date" value={startAt} onChange={e=>setStartAt(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </label>
              <label className="flex-1">
                <div className="text-gray-600 mb-1">Koniec</div>
                <input type="date" value={endAt} onChange={e=>setEndAt(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
              </label>
            </div>
            <div className="rounded-xl border p-3 bg-gray-50">
              <div>Dni: <b>{days}</b></div>
              <div>Kwota: <b>{fmtPLN(amount)}</b></div>
            </div>
            <button className="btn" onClick={pay}>Opłać kampanię</button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="font-semibold mb-2">Moje kampanie</div>
          <div className="text-xs text-gray-500 mb-2">Aktywne i zaplanowane</div>
          <div className="space-y-2">
            {list.length===0 && <div className="text-sm text-gray-500">Brak kampanii.</div>}
            {list.map(c=> (
              <div key={c._id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Sloty: {c.positions?.map(p=>`#${p}`).join(', ')} • {c.service || '*'}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>{c.isActive ? 'aktywna/zaplanowana' : 'nieaktywna'}</div>
                </div>
                <div className="text-sm text-gray-600">{new Date(c.startAt).toLocaleDateString()} – {new Date(c.endAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">* Sloty wstrzykują się w listing na pozycje #2 i/lub #7 z cappingiem 1 wyśw./dzień/użytkownik (logowane w tle).</div>
    </div>
  );
}





























