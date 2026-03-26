import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';

export default function ProviderQuotes() {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const load = async () => {
    const res = await fetch(apiUrl(`/api/ai/provider/quotes?status=pending,quoted`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setItems(data.items || []);
  };
  useEffect(()=>{ load(); },[]);

  const respond = async (draftId, quoteId, action, amount, message) => {
    setBusyId(quoteId);
    try {
      const body = { action, amount, message };
      const res = await fetch(apiUrl(`/api/ai/drafts/${draftId}/quotes/${quoteId}/respond`), {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd odpowiedzi');
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusyId(null); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Zapytania o wycenę</h1>
      {items.length === 0 && <div className="text-sm text-gray-600">Brak zapytań.</div>}
      <div className="space-y-3">
        {items.map(q => (
          <div key={q._id} className="border rounded-2xl p-4 bg-white">
            <div className="text-sm text-gray-600">Klient: {q.client?.name}</div>
            <div className="font-medium mt-1">{q.draft?.serviceCandidate?.name || 'Usługa'}</div>
            <div className="text-sm">{q.draft?.description}</div>
            <div className="text-xs text-gray-500 mt-1">{q.draft?.location?.text || 'Brak lokalizacji'}</div>

            {q.draft?.attachments?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {q.draft.attachments.map(att => (
                  <div key={att._id} className="border rounded p-1">
                    {att.type === 'image' ? <img src={att.url} className="w-full h-24 object-cover rounded" /> :
                      att.type === 'video' ? <video src={att.url} className="w-full h-24 object-cover rounded" controls /> :
                      <div className="text-xs">{att.filename}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <input type="number" min={1} step={1} id={`amt_${q._id}`}
                className="border rounded p-2 w-40" placeholder="Kwota (zł)"
                disabled={busyId===q._id}/>
              <input type="text" id={`msg_${q._id}`} className="border rounded p-2 flex-1"
                placeholder="Krótka wiadomość" disabled={busyId===q._id}/>
              <button
                onClick={()=>{
                  const zl = parseFloat(document.getElementById(`amt_${q._id}`).value);
                  const msg = document.getElementById(`msg_${q._id}`).value;
                  if (!zl || zl<1) return alert('Podaj kwotę (zł)');
                  respond(q.draft?._id, q._id, 'quote', Math.round(zl*100), msg);
                }}
                disabled={busyId===q._id}
                className="px-3 py-2 rounded bg-emerald-600 text-white"
              >
                {busyId===q._id ? 'Wysyłam…' : 'Wyceń'}
              </button>
              <button
                onClick={()=>respond(q.draft?._id, q._id, 'decline', null, 'Brak dostępności')}
                disabled={busyId===q._id}
                className="px-3 py-2 rounded bg-gray-200"
              >
                Odrzuć
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">Status: {q.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



















