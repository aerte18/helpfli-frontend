import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function CompanyInvoices({ companyId, canManage }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchInvoices();
    }
  }, [companyId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!companyId) {
        setError('Brak ID firmy');
        setLoading(false);
        return;
      }
      const data = await api(`/api/companies/${companyId}/invoices`);
      if (data.success) {
        setInvoices(data.invoices || []);
      } else {
        setError(data.message || 'Błąd pobierania faktur');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Błąd pobierania faktur');
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      sent: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Szkic',
      issued: 'Wystawiona',
      sent: 'Wysłana',
      paid: 'Opłacona',
      overdue: 'Przeterminowana',
      cancelled: 'Anulowana'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rozliczenia</h2>
          <p className="text-sm text-gray-600 mt-1">
            Faktury są wystawiane przez KSeF. Tutaj możesz przeglądać historię rozliczeń.
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Brak rozliczeń w historii
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice._id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-gray-900">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(invoice.period.startDate).toLocaleDateString('pl-PL')} -{' '}
                    {new Date(invoice.period.endDate).toLocaleDateString('pl-PL')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                  <div className="text-lg font-semibold text-gray-900">
                    {invoice.summary.totalFormatted}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                {invoice.items.length} pozycji
              </div>
              
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  Rozliczenie za okres: {new Date(invoice.period.startDate).toLocaleDateString('pl-PL')} - {new Date(invoice.period.endDate).toLocaleDateString('pl-PL')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}







