import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from 'react';

export default function KycWizard() {
  const API = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'individual', firstName: '', lastName: '', idNumber: '', companyName: '', nip: '' });
  const [files, setFiles] = useState({ idFront: null, idBack: null, selfie: null, companyDoc: null });
  const [message, setMessage] = useState('');

  const fetchMe = async () => {
    const res = await fetch(apiUrl(`/api/kyc/me`), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setMe(data);
    // preset form z backendu
    const k = data?.kyc || {};
    setForm(f => ({
      ...f,
      type: k.type || 'individual',
      firstName: k.firstName || '',
      lastName: k.lastName || '',
      idNumber: k.idNumber || '',
      companyName: k.companyName || '',
      nip: k.nip || '',
    }));
  };

  useEffect(() => { fetchMe(); }, []);

  const saveData = async () => {
    setSaving(true); setMessage('');
    const res = await fetch(apiUrl(`/api/kyc/save`), {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMessage(data.message || 'Błąd zapisu');
    setMessage('Dane zapisane');
    fetchMe();
  };

  const uploadDocs = async () => {
    setSaving(true); setMessage('');
    const fd = new FormData();
    if (files.idFront) fd.append('idFront', files.idFront);
    if (files.idBack) fd.append('idBack', files.idBack);
    if (files.selfie) fd.append('selfie', files.selfie);
    if (form.type === 'company' && files.companyDoc) fd.append('companyDoc', files.companyDoc);

    const res = await fetch(apiUrl(`/api/kyc/upload`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMessage(data.message || 'Błąd uploadu');
    setMessage('Pliki zapisane');
    fetchMe();
  };

  const submit = async () => {
    setSaving(true); setMessage('');
    const res = await fetch(apiUrl(`/api/kyc/submit`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMessage(data.message || 'Błąd wysyłki');
    setMessage('Wniosek wysłany do weryfikacji');
    fetchMe();
  };

  if (!me) return <div>Ładowanie…</div>;
  const status = me?.kyc?.status || 'not_started';
  const disabled = status === 'submitted' || status === 'verified';

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
    <div className="p-6 sm:p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Weryfikacja KYC</h1>
      <p className="mb-6 text-sm text-gray-600">
        Status: <span className="font-medium text-gray-900">{status}</span>
        {me?.kyc?.rejectionReason ? <span className="text-rose-600"> – {me.kyc.rejectionReason}</span> : null}
      </p>

      {/* Krok 1 – dane */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Krok 1: Dane wnioskodawcy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className={labelClass}>Typ</span>
            <select className={inputClass} value={form.type} disabled={disabled}
              onChange={e=>setForm({...form, type:e.target.value})}>
              <option value="individual">Osoba fizyczna</option>
              <option value="company">Firma</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Imię</span>
            <input className={inputClass} disabled={disabled}
              value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} placeholder="Imię"/>
          </label>
          <label className="block">
            <span className={labelClass}>Nazwisko</span>
            <input className={inputClass} disabled={disabled}
              value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} placeholder="Nazwisko"/>
          </label>
          <label className="block">
            <span className={labelClass}>Nr dokumentu (opcjonalnie)</span>
            <input className={inputClass} disabled={disabled}
              value={form.idNumber} onChange={e=>setForm({...form, idNumber:e.target.value})} placeholder="Nr dokumentu"/>
          </label>
          {form.type === 'company' && (
            <>
              <label className="block">
                <span className={labelClass}>Nazwa firmy</span>
                <input className={inputClass} disabled={disabled}
                  value={form.companyName} onChange={e=>setForm({...form, companyName:e.target.value})} placeholder="Nazwa firmy"/>
              </label>
              <label className="block">
                <span className={labelClass}>NIP</span>
                <input className={inputClass} disabled={disabled}
                  value={form.nip} onChange={e=>setForm({...form, nip:e.target.value})} placeholder="NIP"/>
              </label>
            </>
          )}
        </div>
        <button
          onClick={saveData}
          disabled={disabled || saving}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Zapisz dane
        </button>
      </section>

      {/* Krok 2 – dokumenty */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Krok 2: Dokumenty</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className={labelClass}>Dowód – przód (jpg/png/pdf)</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={disabled}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
              onChange={e=>setFiles({...files, idFront:e.target.files?.[0] || null})}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Dowód – tył</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={disabled}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
              onChange={e=>setFiles({...files, idBack:e.target.files?.[0] || null})}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Selfie z dokumentem</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              disabled={disabled}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
              onChange={e=>setFiles({...files, selfie:e.target.files?.[0] || null})}
            />
          </label>
          {form.type === 'company' && (
            <label className="block">
              <span className={labelClass}>Dokument firmy (KRS/CEIDG)</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                disabled={disabled}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:font-medium file:cursor-pointer"
                onChange={e=>setFiles({...files, companyDoc:e.target.files?.[0] || null})}
              />
            </label>
          )}
        </div>
        <button
          onClick={uploadDocs}
          disabled={disabled || saving}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Zapisz pliki
        </button>
      </section>

      {/* Krok 3 – wysyłka */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Krok 3: Wyślij do weryfikacji</h2>
        <button
          onClick={submit}
          disabled={disabled || saving}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Wyślij wniosek
        </button>
      </section>

      {message && <p className="mt-6 text-sm text-gray-700">{message}</p>}
    </div>
    </div>
    </div>
  );
}



















