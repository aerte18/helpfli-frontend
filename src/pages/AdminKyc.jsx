import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';

export default function AdminKyc() {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const [items, setItems] = useState([]);

  const load = async () => {
    const res = await fetch(apiUrl(`/api/kyc/admin/list?status=submitted`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await fetch(apiUrl(`/api/kyc/admin/${id}/approve`), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    load();
  };
  const reject = async (id) => {
    const reason = prompt('Powód odrzucenia:', 'Nieczytelny dokument');
    await fetch(apiUrl(`/api/kyc/admin/${id}/reject`), { 
      method: 'POST', 
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason })
    });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-4">KYC – do weryfikacji</h1>
      {items.length === 0 && <p>Brak zgłoszeń.</p>}
      {items.map(u => (
        <div key={u._id} className="border rounded p-4 mb-3">
          <div className="font-medium">{u.name} • {u.email}</div>
          <div className="text-sm text-gray-600">Typ: {u.kyc?.type} • Status: {u.kyc?.status}</div>
          <div className="mt-3 flex gap-2">
            <button onClick={()=>approve(u._id)} className="px-3 py-1 rounded bg-emerald-600 text-white">Zatwierdź</button>
            <button onClick={()=>reject(u._id)} className="px-3 py-1 rounded bg-rose-600 text-white">Odrzuć</button>
          </div>
        </div>
      ))}
    </div>
  );
}



















