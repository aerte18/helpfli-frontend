// Centralne rozliczenia dla firm
import { apiUrl } from "@/lib/apiUrl";
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBillingSummary, getCompanyOrderInvoices, getCompanyHelpfliInvoices } from '../../api/companies';

export default function CompanyBilling({ companyId: propCompanyId }) {
  const { companyId: paramCompanyId } = useParams();
  const companyId = propCompanyId || paramCompanyId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [summary, setSummary] = useState(null);
  const [orderInvoices, setOrderInvoices] = useState(null);
  const [helpfliInvoices, setHelpfliInvoices] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId, dateRange, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { from: dateRange.from, to: dateRange.to };
      
      if (activeTab === 'summary') {
        const data = await getBillingSummary(companyId, params);
        setSummary(data);
      } else if (activeTab === 'invoices') {
        const data = await getCompanyOrderInvoices(companyId, params);
        setOrderInvoices(data);
      } else if (activeTab === 'helpfli-invoices') {
        const data = await getCompanyHelpfliInvoices(companyId, params);
        setHelpfliInvoices(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !summary && !orderInvoices && activeTab === 'summary') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rozliczenia</h1>
          <p className="text-gray-600 mt-1">
            Centralne rozliczenia firmy. Faktury są wystawiane przez KSeF.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams({
                  from: dateRange.from,
                  to: dateRange.to,
                  format: 'csv'
                });
                const res = await fetch(apiUrl(`/api/companies/${companyId}/billing/summary?${params}`), { credentials: 'include' }
                );
                if (!res.ok) {
                  throw new Error('Błąd eksportu CSV');
                }
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `helpfli_rozliczenia_firmy_${companyId}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              } catch (e) {
                alert(e.message || 'Błąd eksportu CSV');
              }
            }}
            className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Eksportuj do CSV
          </button>
          <Link
            to={`/company/${companyId}/settings`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Wróć do ustawień
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', label: 'Podsumowanie' },
            { id: 'invoices', label: 'Faktury zleceń' },
            { id: 'helpfli-invoices', label: 'Faktury Helpfli' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Od:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <label className="text-sm font-medium text-gray-700">Do:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Całkowity przychód</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {((summary.summary?.totalRevenue || 0) / 100).toFixed(2)} PLN
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Opłaty platformowe</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {((summary.summary?.platformFees || 0) / 100).toFixed(2)} PLN
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Przychód netto</div>
              <div className="text-2xl font-bold text-green-600 mt-2">
                {((summary.summary?.netRevenue || 0) / 100).toFixed(2)} PLN
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Procent opłat</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {summary.summary?.feePercentage?.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>

          {/* By Provider */}
          {summary.byProvider && summary.byProvider.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Rozliczenia per wykonawca</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wykonawca</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Przychód</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opłaty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Netto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Płatności</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.byProvider.map((provider, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {provider.providerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((provider.totalRevenue || 0) / 100).toFixed(2)} PLN
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((provider.platformFees || 0) / 100).toFixed(2)} PLN
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {((provider.netRevenue || 0) / 100).toFixed(2)} PLN
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.paymentCount || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && orderInvoices && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Faktury zleceń od wykonawców</h3>
          {orderInvoices.invoices && orderInvoices.invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zlecenie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wykonawca</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faktura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data wrzucenia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderInvoices.invoices.map((inv) => (
                    <tr key={inv.orderId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{inv.orderService}</div>
                        <div className="text-xs text-gray-500">{inv.orderDescription?.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.provider.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inv.client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`${import.meta.env.VITE_API_URL || ''}${inv.invoice.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {inv.invoice.filename || 'Faktura.pdf'}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inv.invoice.uploadedAt).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          inv.invoice.sentToClient 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {inv.invoice.sentToClient ? 'Wysłana' : 'Oczekuje'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Brak faktur zleceń w wybranym okresie
            </div>
          )}
        </div>
      )}

      {activeTab === 'helpfli-invoices' && helpfliInvoices && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Faktury Helpfli (subskrypcje, boosty)</h3>
          {helpfliInvoices.invoices && helpfliInvoices.invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numer faktury</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kwota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data wystawienia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {helpfliInvoices.invoices.map((inv) => (
                    <tr key={inv.paymentId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.purpose === 'subscription' ? 'Subskrypcja' : 'Promocja/Boost'}
                        {inv.subscriptionPlanKey && (
                          <div className="text-xs text-gray-500">{inv.subscriptionPlanKey}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.user?.name || inv.user?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((inv.invoice.total || inv.amount) / 100).toFixed(2)} {inv.invoice.currency || 'PLN'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inv.invoice.issuedAt).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          inv.invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : inv.invoice.status === 'issued'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.invoice.status === 'paid' ? 'Opłacona' : 
                           inv.invoice.status === 'issued' ? 'Wystawiona' : 
                           inv.invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Brak faktur Helpfli w wybranym okresie
            </div>
          )}
        </div>
      )}
    </div>
  );
}








