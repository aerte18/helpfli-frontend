import { useEffect, useState } from "react";

function AdminVerifications() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("pending_review");
  const token = localStorage.getItem("token");

  const load = async () => {
    const res = await fetch(`http://localhost:5002/api/admin/verifications?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { load(); }, [status]);

  const act = async (id, action, body) => {
    const res = await fetch(`http://localhost:5002/api/admin/verifications/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) load();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Weryfikacje – Admin</h1>

      <div className="mb-4 flex gap-2">
        {['pending_review','verified','rejected','unverified','suspended'].map(s => (
          <button 
            key={s} 
            onClick={()=>setStatus(s)} 
            className={`px-3 py-1 rounded ${status===s?'bg-indigo-600 text-white':'bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {items.map(it => (
          <div key={it._id} className="border rounded p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">
                  {it.user?.name} <span className="text-sm text-gray-500">({it.user?.email})</span>
                </div>
                <div className="text-sm text-gray-600">
                  Firma: {it.businessName || '—'} | NIP/REGON: {it.taxId || '—'}
                </div>
                <div className="text-sm text-gray-600">
                  Telefon: {it.phoneNumber || '—'} | Email: {it.emailVerified?'✔':'✖'} | Tel: {it.phoneVerified?'✔':'✖'}
                </div>
                {it.rejectionReason && (
                  <div className="text-sm text-red-600">Powód odrzucenia: {it.rejectionReason}</div>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                it.status==='verified'? 'bg-green-100 text-green-700':
                it.status==='pending_review'? 'bg-amber-100 text-amber-700':
                it.status==='rejected' || it.status==='suspended'? 'bg-red-100 text-red-700':
                'bg-gray-100 text-gray-700'
              }`}>
                {it.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {it.status === 'pending_review' && (
                <>
                  <button 
                    onClick={()=>act(it._id,'approve')} 
                    className="px-3 py-2 rounded bg-emerald-600 text-white"
                  >
                    Zatwierdź
                  </button>
                  <button 
                    onClick={()=>{
                      const reason = prompt('Powód odrzucenia:');
                      if (reason !== null) act(it._id,'reject',{ reason });
                    }} 
                    className="px-3 py-2 rounded bg-red-600 text-white"
                  >
                    Odrzuć
                  </button>
                </>
              )}
              {it.status !== 'suspended' && (
                <button 
                  onClick={()=>act(it._id,'suspend')} 
                  className="px-3 py-2 rounded bg-orange-600 text-white"
                >
                  Zawieś
                </button>
              )}
              {it.status === 'suspended' && (
                <button 
                  onClick={()=>act(it._id,'unsuspend')} 
                  className="px-3 py-2 rounded bg-gray-800 text-white"
                >
                  Odwies
                </button>
              )}
              <button 
                onClick={()=>{
                  const note = prompt('Notatka admina:');
                  if (note) act(it._id,'note',{ note });
                }} 
                className="px-3 py-2 rounded bg-gray-200"
              >
                Dodaj notatkę
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminVerifications;

























