import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ ownerType: '', status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      const params = new URLSearchParams();
      if (filter.ownerType) params.append('ownerType', filter.ownerType);
      if (filter.status) params.append('status', filter.status);

      const res = await fetch(`${API}/api/admin/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInvoices(data.invoices || []);
      } else {
        setError(data.message || 'Błąd pobierania faktur');
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Błąd pobierania faktur');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `${(amount / 100).toFixed(2)} PLN`;
    }
    return amount || '0.00 PLN';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Faktury</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Utwórz fakturę
        </button>
      </div>

      {/* Filtry */}
      <div className="bg-white rounded-xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ właściciela
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Wszystkie</option>
              <option value="draft">Szkic</option>
              <option value="issued">Wystawiona</option>
              <option value="paid">Opłacona</option>
              <option value="overdue">Przeterminowana</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ ownerType: '', status: '' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Wyczyść filtry
            </button>
          </div>
        </div>
      </div>

      {/* Lista faktur */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Ładowanie faktur...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Brak faktur
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numer faktury
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Właściciel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kwota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data wystawienia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Termin płatności
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber || `#${invoice._id.slice(-6)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.owner?.name || '-'}
                      {invoice.owner?.email && (
                        <div className="text-xs text-gray-500">{invoice.owner.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.ownerType === 'company' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {invoice.ownerType === 'company' ? 'Firma' : 'Użytkownik'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatAmount(invoice.summary?.total || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : invoice.status === 'issued'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.status === 'paid' ? 'Opłacona' :
                         invoice.status === 'overdue' ? 'Przeterminowana' :
                         invoice.status === 'issued' ? 'Wystawiona' :
                         invoice.status === 'draft' ? 'Szkic' : invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issuedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invoice.ownerType === 'company' ? (
                        <a
                          href={`/api/companies/${invoice.owner?._id}/invoices/${invoice._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Pobierz PDF
                        </a>
                      ) : (
                        <a
                          href={`/api/billing/invoices/${invoice._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Pobierz PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal tworzenia faktury - placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Utwórz fakturę</h2>
            <p className="text-gray-600 mb-4">
              Funkcja tworzenia faktur przez admina będzie dostępna wkrótce.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

