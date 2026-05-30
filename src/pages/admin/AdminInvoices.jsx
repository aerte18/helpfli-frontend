import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isPlatformInvoicingEnabled } from '../../utils/platformInvoicing';

const PURPOSE_LABELS = {
  subscription: 'Subskrypcja',
  promotion: 'Boost / promocja',
  order: 'Zlecenie',
};

export default function AdminInvoices() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [invoices, setInvoices] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ ownerType: '', status: '' });
  const [uploadingId, setUploadingId] = useState(null);
  const [invoiceNumbers, setInvoiceNumbers] = useState({});
  const [files, setFiles] = useState({});

  useEffect(() => {
    if (tab === 'issued') loadInvoices();
    else loadPending();
  }, [filter, tab]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter.ownerType) params.append('ownerType', filter.ownerType);
      if (filter.status) params.append('status', filter.status);

      const res = await fetch(apiUrl(`/api/admin/invoices?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoices(data.invoices || []);
      } else {
        setError(data.message || 'Błąd pobierania faktur');
      }
    } catch (err) {
      setError(err.message || 'Błąd pobierania faktur');
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    try {
      setPendingLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/admin/payments/pending-invoices'), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPending(data.payments || []);
      } else {
        setError(data.message || 'Błąd pobierania kolejki');
      }
    } catch (err) {
      setError(err.message || 'Błąd pobierania kolejki');
    } finally {
      setPendingLoading(false);
      setLoading(false);
    }
  };

  const attachInvoice = async (paymentId) => {
    const file = files[paymentId];
    if (!file) {
      alert('Wybierz plik PDF faktury');
      return;
    }
    setUploadingId(paymentId);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('invoice', file);
      if (invoiceNumbers[paymentId]) {
        formData.append('invoiceNumber', invoiceNumbers[paymentId]);
      }
      const res = await fetch(apiUrl(`/api/admin/payments/${paymentId}/attach-invoice`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Błąd wysyłki faktury');
      alert(data.message || 'Faktura wysłana');
      setFiles((f) => ({ ...f, [paymentId]: null }));
      loadPending();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const formatAmount = (amount) => {
    if (typeof amount === 'number') return `${(amount / 100).toFixed(2)} PLN`;
    return amount || '0.00 PLN';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const payerOf = (p) => p.subscriptionUser || p.client || p.provider;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Faktury Helpfli</h1>
        {!isPlatformInvoicingEnabled() && (
          <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
            Fakturowanie u klientów wyszarzone — włącz po założeniu firmy (NIP w env)
          </span>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'pending' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600'
          }`}
        >
          Do wystawienia {pending.length > 0 && `(${pending.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab('issued')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'issued' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600'
          }`}
        >
          Wystawione
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {tab === 'pending' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Płatności, przy których klient zaznaczył „Chcę fakturę VAT”. Wrzuć PDF — system wyśle maila i oznaczy jako wysłane.
          </p>
          {pendingLoading ? (
            <p className="text-gray-500">Ładowanie kolejki…</p>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
              Brak płatności oczekujących na fakturę
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => {
                const payer = payerOf(p);
                return (
                  <div key={p._id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {PURPOSE_LABELS[p.purpose] || p.purpose} — {formatAmount(p.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {payer?.name || payer?.email || '—'} • {payer?.email}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(p.createdAt)}
                          {p.subscriptionPlanKey && ` • plan: ${p.subscriptionPlanKey}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                      <input
                        type="text"
                        placeholder="Nr faktury (opcj.)"
                        value={invoiceNumbers[p._id] || ''}
                        onChange={(e) => setInvoiceNumbers((n) => ({ ...n, [p._id]: e.target.value }))}
                        className="px-3 py-2 border rounded-lg text-sm w-full sm:w-40"
                      />
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => setFiles((f) => ({ ...f, [p._id]: e.target.files?.[0] || null }))}
                        className="flex-1 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white"
                      />
                      <button
                        type="button"
                        disabled={uploadingId === p._id}
                        onClick={() => attachInvoice(p._id)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {uploadingId === p._id ? 'Wysyłanie…' : 'Wyślij fakturę'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'issued' && (
        <>
          <div className="bg-white rounded-xl border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ właściciela</label>
                <select
                  value={filter.ownerType}
                  onChange={(e) => setFilter({ ...filter, ownerType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Wszystkie</option>
                  <option value="user">Użytkownicy</option>
                  <option value="company">Firmy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Wszystkie</option>
                  <option value="draft">Szkic</option>
                  <option value="issued">Wystawiona</option>
                  <option value="sent">Wysłana</option>
                  <option value="paid">Opłacona</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Ładowanie…</p>
          ) : invoices.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Brak faktur</div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odbiorca</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kwota</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="px-4 py-3 text-sm font-medium">{inv.invoiceNumber || '—'}</td>
                        <td className="px-4 py-3 text-sm">{inv.owner?.name || inv.owner?.email || '—'}</td>
                        <td className="px-4 py-3 text-sm">{formatAmount(inv.summary?.total)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            inv.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {inv.status === 'sent' ? 'Wysłana' : inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inv.issuedAt || inv.createdAt)}</td>
                        <td className="px-4 py-3 text-sm">
                          {inv.pdfUrl ? (
                            <a
                              href={`${import.meta.env.VITE_API_URL || ''}${inv.pdfUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              Pobierz
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
