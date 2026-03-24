import { useState } from 'react';

export default function DraftAttachments({ draftId, attachments, onUpdated }) {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const [busy, setBusy] = useState(false);

  const upload = async (files) => {
    if (!files?.length) return;
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/ai/drafts/${draftId}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd uploadu');
      onUpdated?.(data.attachments);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (attId) => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/ai/drafts/${draftId}/attachments/${attId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd usuwania');
      onUpdated?.(data.attachments);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input type="file" multiple accept="image/*,video/*" disabled={busy}
          onChange={e=>upload([...e.target.files])}/>
        <span className="text-xs text-gray-500">Obsługujemy zdjęcia i wideo (do ~30 MB)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {(attachments||[]).map(att => (
          <div key={att._id} className="border rounded p-2 relative">
            {att.type === 'image' ? (
              <img src={att.url} alt={att.filename} className="w-full h-28 object-cover rounded" loading="lazy" />
            ) : att.type === 'video' ? (
              <video src={att.url} className="w-full h-28 object-cover rounded" controls />
            ) : (
              <div className="text-xs">{att.filename}</div>
            )}
            <button
              onClick={()=>remove(att._id)}
              className="absolute top-1 right-1 bg-white/90 border rounded px-2 text-xs"
            >Usuń</button>
          </div>
        ))}
      </div>
    </div>
  );
}










