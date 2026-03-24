import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function CompanyWallet({ companyId, canManage }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchWallet();
      fetchTransactions();
    }
  }, [companyId]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const data = await api(`/api/companies/${companyId}/wallet`);
      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const data = await api(`/api/companies/${companyId}/wallet/transactions?limit=50`);
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/companies/${companyId}/wallet/deposit`, {
        method: 'POST',
        body: {
          amount: parseFloat(depositAmount),
          description: description || 'Doładowanie portfela'
        }
      });
      await fetchWallet();
      await fetchTransactions();
      setShowDepositModal(false);
      setDepositAmount('');
      setDescription('');
      alert('Portfel został doładowany');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/companies/${companyId}/wallet/withdraw`, {
        method: 'POST',
        body: {
          amount: parseFloat(withdrawAmount),
          description: description || 'Wypłata z portfela'
        }
      });
      await fetchWallet();
      await fetchTransactions();
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setDescription('');
      alert('Wypłata zakończona pomyślnie');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const formatAmount = (amount) => {
    return (amount / 100).toFixed(2) + ' zł';
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      deposit: 'Wpłata',
      withdrawal: 'Wypłata',
      payment: 'Płatność',
      refund: 'Zwrot',
      fee: 'Opłata',
      subscription: 'Subskrypcja',
      order_payment: 'Płatność za zlecenie',
      order_revenue: 'Przychód z zlecenia'
    };
    return labels[type] || type;
  };

  const getTransactionColor = (amount) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading && !wallet) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600">{error || 'Błąd pobierania portfela'}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Portfel Firmowy</h2>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Doładuj
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Wypłać
            </button>
          </div>
        )}
      </div>

      {/* Saldo */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <div className="text-sm opacity-90 mb-2">Dostępne środki</div>
        <div className="text-4xl font-bold">{formatAmount(wallet.balance)}</div>
        {wallet.balance < 0 && (
          <div className="text-sm mt-2 text-yellow-200">
            ⚠️ Ujemne saldo
          </div>
        )}
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Wpłacone</div>
          <div className="text-lg font-semibold text-green-600">
            {formatAmount(wallet.stats?.totalDeposited || 0)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Wypłacone</div>
          <div className="text-lg font-semibold text-red-600">
            {formatAmount(wallet.stats?.totalWithdrawn || 0)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Wydane</div>
          <div className="text-lg font-semibold text-orange-600">
            {formatAmount(wallet.stats?.totalSpent || 0)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Zarobione</div>
          <div className="text-lg font-semibold text-blue-600">
            {formatAmount(wallet.stats?.totalEarned || 0)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 ${
            activeTab === 'overview'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Przegląd
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 ${
            activeTab === 'transactions'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Transakcje
        </button>
      </div>

      {/* Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Brak transakcji
            </div>
          ) : (
            transactions.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {getTransactionTypeLabel(transaction.type)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {transaction.description || '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(transaction.createdAt).toLocaleString('pl-PL')}
                  </div>
                </div>
                <div className={`text-lg font-semibold ${getTransactionColor(transaction.amount)}`}>
                  {transaction.amount > 0 ? '+' : ''}{formatAmount(transaction.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Doładuj portfel</h3>
            <form onSubmit={handleDeposit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kwota (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Doładowanie portfela"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                    setDescription('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Doładuj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Wypłać z portfela</h3>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kwota (zł)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={wallet.balance / 100}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  Dostępne: {formatAmount(wallet.balance)}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Wypłata z portfela"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setDescription('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Wypłać
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}







