import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';

const TYPE_LABEL = {
  monthly_global: 'Miesięczny (global)',
  monthly_cities: 'Miesięczny (per miasto)',
  monthly_services_batch: 'Miesięczny (per usługa – zbiorczy/osobne)'
};

export default function AdminReportHistory() {
  const token = localStorage.getItem('token');

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ type: '', month: '', status: '' });
  const [busy, setBusy] = useState(false);

  // modal custom resend
  const [showModal, setShowModal] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [customRecipients, setCustomRecipients] = useState('');
  const [sendingCustom, setSendingCustom] = useState(false);

  // modal service preview
  const [svcModalOpen, setSvcModalOpen] = useState(false);
  const [svcModalLogId, setSvcModalLogId] = useState(null);
  const [svcOptions, setSvcOptions] = useState([]);
  const [svcSelected, setSvcSelected] = useState('');
  const [svcBusy, setSvcBusy] = useState(false);

  const load = async (p = page) => {
    const q = new URLSearchParams({ page: String(p), limit: '20' });
    if (filters.type) q.set('type', filters.type);
    if (filters.month) q.set('month', filters.month);
    if (filters.status) q.set('status', filters.status);
    const res = await fetch(apiUrl(`/api/admin/reports/logs?` + q.toString()), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setItems(data.items || []);
    setPage(data.page || 1);
    setPages(data.pages || 1);
    setTotal(data.total || 0);
  };

  useEffect(()=>{ load(1); /* eslint-disable-next-line */ }, []);

  const previewUrl = (id) => apiUrl(`/api/admin/reports/logs/${id}/preview.pdf`);

  const openSvcModal = async (logId) => {
    setSvcBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/reports/logs/${logId}/services`), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd pobierania usług');
      setSvcOptions(data.items || []);
      setSvcSelected((data.items?.[0]?.key) || '');
      setSvcModalLogId(logId);
      setSvcModalOpen(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setSvcBusy(false);
    }
  };

  const openSvcPreview = () => {
    if (!svcSelected) return;
    const url = apiUrl(`/api/admin/reports/logs/${svcModalLogId}/preview.pdf?variant=single&serviceKey=${encodeURIComponent(svcSelected)}`);
    window.open(url, '_blank');
  };

  const resend = async (id) => {
    if (!confirm('Wysłać ponownie ten raport do oryginalnych odbiorców?')) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/reports/logs/${id}/resend`), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd wysyłki');
      alert('Wysłano ponownie.');
      await load(1);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openCustomModal = (id, defaults = []) => {
    setModalId(id);
    setCustomRecipients((defaults || []).join(','));
    setShowModal(true);
  };

  const resendCustom = async () => {
    if (!modalId) return;
    const rec = customRecipients.split(',').map(s=>s.trim()).filter(Boolean);
    if (!rec.length) { alert('Podaj co najmniej jeden e-mail'); return; }
    setSendingCustom(true);
    try {
      const url = apiUrl(`/api/admin/reports/logs/${modalId}/resend?recipients=${encodeURIComponent(rec.join(','))}`);
      const res = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd wysyłki');
      alert('Wysłano ponownie do wskazanych odbiorców.');
      setShowModal(false);
      setModalId(null);
      await load(1);
    } catch (e) {
      alert(e.message);
    } finally {
      setSendingCustom(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Historia wysyłek raportów</h1>

      <div className="flex flex-wrap gap-3 items-end bg-white border rounded-2xl p-4">
        <label className="text-sm">Typ
          <select className="border rounded p-2 ml-2" value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}>
            <option value="">Wszystkie</option>
            <option value="monthly_global">{TYPE_LABEL.monthly_global}</option>
            <option value="monthly_cities">{TYPE_LABEL.monthly_cities}</option>
            <option value="monthly_services_batch">{TYPE_LABEL.monthly_services_batch}</option>
          </select>
        </label>
        <label className="text-sm">Miesiąc
          <input type="month" className="border rounded p-2 ml-2" value={filters.month} onChange={e=>setFilters({...filters, month:e.target.value})}/>
        </label>
        <label className="text-sm">Status
          <select className="border rounded p-2 ml-2" value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}>
            <option value="">Wszystkie</option>
            <option value="sent">Wysłane</option>
            <option value="failed">Błąd</option>
          </select>
        </label>
        <button onClick={()=>load(1)} className="px-3 py-2 rounded bg-indigo-600 text-white">Filtruj</button>
      </div>

      <div className="bg-white border rounded-2xl overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">Data</th>
              <th className="p-2">Typ</th>
              <th className="p-2">Miesiąc</th>
              <th className="p-2">Odbiorcy</th>
              <th className="p-2">Załączniki</th>
              <th className="p-2">Status</th>
              <th className="p-2">Wywołanie</th>
              <th className="p-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=> (
              <tr key={it._id} className="border-t">
                <td className="p-2">{new Date(it.sentAt || it.createdAt).toLocaleString()}</td>
                <td className="p-2">{TYPE_LABEL[it.type] || it.type}</td>
                <td className="p-2">{it.month}</td>
                <td className="p-2">{it.recipients?.length ? <span title={it.recipients.join(', ')}>{it.recipients.slice(0,3).join(', ')}{it.recipients.length>3?'…':''}</span> : <span className="text-gray-500">—</span>}</td>
                <td className="p-2">{it.attachments?.length ? (<span title={(it.attachments||[]).map(a=>`${a.filename} (${Math.round((a.size||0)/1024)} kB)`).join('\n')}>{it.attachments.length} plik(i)</span>) : <span className="text-gray-500">—</span>}</td>
                <td className="p-2">{it.status === 'sent' ? <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">Wysłane</span> : <span className="px-2 py-1 rounded bg-rose-100 text-rose-700" title={it.error}>Błąd</span>}</td>
                <td className="p-2 text-gray-600">{it.trigger === 'cron' ? 'CRON' : `Ręcznie${it.triggeredBy?.name ? ' – '+it.triggeredBy.name : ''}`}</td>
                <td className="p-2 space-x-2">
                  {it.type === 'monthly_services_batch' ? (
                    <>
                      <a href={apiUrl(`/api/admin/reports/logs/${it._id}/preview.pdf`)} target="_blank" rel="noreferrer" className="px-3 py-1 rounded border">Podgląd (zbiorczy)</a>
                      <button onClick={()=>openSvcModal(it._id)} disabled={svcBusy} className="px-3 py-1 rounded border">Podgląd (usługa)</button>
                      <button disabled={busy} onClick={()=>resend(it._id)} className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-60">Wyślij ponownie</button>
                      <button onClick={()=>openCustomModal(it._id, it.recipients || [])} className="px-3 py-1 rounded bg-emerald-600 text-white">Wyślij do…</button>
                    </>
                  ) : (
                    <>
                      <a href={previewUrl(it._id)} target="_blank" rel="noreferrer" className="px-3 py-1 rounded border">Podgląd PDF</a>
                      <button disabled={busy} onClick={()=>resend(it._id)} className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-60">Wyślij ponownie</button>
                      <button onClick={()=>openCustomModal(it._id, it.recipients || [])} className="px-3 py-1 rounded bg-emerald-600 text-white">Wyślij do…</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (<tr><td className="p-6 text-center text-gray-500" colSpan={8}>Brak wpisów</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Razem: {total}</span>
        <div className="ml-auto flex gap-2">
          <button disabled={page<=1} onClick={()=>{ setPage(p=>p-1); load(page-1); }} className="px-3 py-1 rounded border bg-white disabled:opacity-50">Prev</button>
          <span className="text-sm">Strona {page}/{pages}</span>
          <button disabled={page>=pages} onClick={()=>{ setPage(p=>p+1); load(page+1); }} className="px-3 py-1 rounded border bg-white disabled:opacity-50">Next</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="text-lg font-semibold mb-2">Ponowna wysyłka – własni odbiorcy</div>
            <p className="text-sm text-gray-600 mb-3">Podaj adresy e-mail, oddzielone przecinkami.</p>
            <textarea className="w-full border rounded p-2 h-28" placeholder="np. admin@helpfli.test, ops@helpfli.test" value={customRecipients} onChange={e=>setCustomRecipients(e.target.value)} />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={()=>{ setShowModal(false); setModalId(null); }} className="px-3 py-2 rounded border">Anuluj</button>
              <button onClick={resendCustom} disabled={sendingCustom} className="px-3 py-2 rounded bg-emerald-600 text-white">{sendingCustom ? 'Wysyłanie…' : 'Wyślij'}</button>
            </div>
          </div>
        </div>
      )}

      {svcModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="text-lg font-semibold mb-2">Podgląd PDF – wybierz usługę</div>
            <p className="text-sm text-gray-600 mb-3">Lista Top usług dla tego miesiąca.</p>
            <select className="border rounded p-2 w-full" value={svcSelected} onChange={e=>setSvcSelected(e.target.value)}>
              {svcOptions.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.name} — zam: {opt.orders}, PLN: {opt.revenuePLN.toFixed(2)}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={()=>{ setSvcModalOpen(false); setSvcModalLogId(null); }} className="px-3 py-2 rounded border">Zamknij</button>
              <button onClick={openSvcPreview} className="px-3 py-2 rounded bg-indigo-600 text-white">Otwórz podgląd</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
