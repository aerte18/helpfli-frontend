import { apiUrl } from "@/lib/apiUrl";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourcePoolManagement from '../../components/company/ResourcePoolManagement';
import CompanyWallet from '../../components/company/CompanyWallet';
import CompanyInvoices from '../../components/company/CompanyInvoices';
import WorkflowManagement from '../../components/company/WorkflowManagement';
import RolesManagement from '../../components/company/RolesManagement';
import AuditLog from '../../components/company/AuditLog';
import TeamPerformance from '../../components/company/TeamPerformance';
import { useToast } from '../../components/toast/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import {
  getCompanyRoles,
  assignCustomRole,
  getCompanySubscription,
  companyAiChat,
  getCompanyOrderShortlist,
  getCompanyOrderSlaStatus,
  sendCompanyOrderFollowup,
  runCompanyOrderAutoFollowup
} from '../../api/companies';
import { Sparkles, ChevronDown, ChevronUp, Send } from 'lucide-react';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const { push: toast } = useToast();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('provider');
  const [roles, setRoles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [companyAiOpen, setCompanyAiOpen] = useState(false);
  const [companyAiMessages, setCompanyAiMessages] = useState([]);
  const [companyAiInput, setCompanyAiInput] = useState('');
  const [companyAiLoading, setCompanyAiLoading] = useState(false);
  const [shortlistOrderId, setShortlistOrderId] = useState('');
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState('');
  const [shortlistData, setShortlistData] = useState(null);
  const [shortlistExpandedOfferId, setShortlistExpandedOfferId] = useState(null);
  const [shortlistRecommendationFilter, setShortlistRecommendationFilter] = useState('all');
  const [slaStatus, setSlaStatus] = useState(null);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [autoFollowupLoading, setAutoFollowupLoading] = useState(false);
  const navigate = useNavigate();
  const recommendationPriority = { strong_match: 3, good_match: 2, review_required: 1 };
  const shortlistRecommendationStats = (shortlistData?.shortlist || []).reduce((acc, row) => {
    const key = row?.recommendation || 'review_required';
    acc.total += 1;
    if (key === 'strong_match') acc.strong += 1;
    else if (key === 'good_match') acc.good += 1;
    else acc.review += 1;
    return acc;
  }, { total: 0, strong: 0, good: 0, review: 0 });
  const recommendationRate = (value) => {
    if (!shortlistRecommendationStats.total) return '0%';
    return `${Math.round((Number(value || 0) / shortlistRecommendationStats.total) * 100)}%`;
  };
  const shortlistRows = (shortlistData?.shortlist || [])
    .filter((row) => shortlistRecommendationFilter === 'all' || row?.recommendation === shortlistRecommendationFilter)
    .slice()
    .sort((a, b) => {
      const prioDiff = (recommendationPriority[b?.recommendation] || 0) - (recommendationPriority[a?.recommendation] || 0);
      if (prioDiff !== 0) return prioDiff;
      return Number(b?.score || 0) - Number(a?.score || 0);
    });

  useEffect(() => {
    // Pobierz ID użytkownika z localStorage lub z API
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user._id || user.id);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    fetchCompanyData();
  }, []);

  useEffect(() => {
    if (company?._id) {
      fetchSubscription();
    }
  }, [company?._id]);

  const fetchSubscription = async () => {
    if (!company?._id) return;
    try {
      const data = await getCompanySubscription(company._id);
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching company subscription:', err);
      setSubscription(null);
    }
  };

  useEffect(() => {
    if (company?._id) {
      fetchRoles();
      fetchJoinRequests();
    }
  }, [company?._id]);

  const fetchRoles = async () => {
    try {
      const data = await getCompanyRoles(company._id);
      if (data.success) {
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/companies`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania danych firmy');
      }

      const data = await response.json();
      if (data.success && data.companies.length > 0) {
        setCompany(data.companies[0]); // Pierwsza firma użytkownika
      } else {
        // Użytkownik nie ma firmy
        setCompany(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/companies/${company._id}/invite`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (!response.ok) {
        throw new Error('Błąd podczas wysyłania zaproszenia');
      }

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Zaproszenie zostało wysłane', variant: 'success' });
        setShowInviteModal(false);
        setInviteEmail('');
        fetchCompanyData(); // Odśwież dane
      }
    } catch (err) {
      toast({ title: 'Błąd wysyłki zaproszenia', description: err.message, variant: 'error' });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego członka z firmy?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/companies/${company._id}/members/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas usuwania członka');
      }

      toast({ title: 'Członek został usunięty z firmy', variant: 'success' });
      fetchCompanyData(); // Odśwież dane
    } catch (err) {
      toast({ title: 'Błąd usuwania członka', description: err.message, variant: 'error' });
    }
  };

  const fetchJoinRequests = async () => {
    if (!company?._id || !canManageCompany) return;
    
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/companies/${company._id}/join-requests?status=pending`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Błąd pobierania próśb:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/companies/${company._id}/join-requests/${requestId}/approve`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({ title: 'Prośba została zaakceptowana', variant: 'success' });
        fetchJoinRequests();
        fetchCompanyData();
      } else {
        const errorData = await response.json();
        toast({ title: 'Błąd akceptacji prośby', description: errorData.message || 'Nie udało się zaakceptować prośby', variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Błąd akceptacji prośby', description: err.message, variant: 'error' });
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt('Podaj powód odrzucenia (opcjonalnie):');
    if (reason === null) return; // Użytkownik anulował

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/companies/${company._id}/join-requests/${requestId}/reject`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || '' })
      });

      if (response.ok) {
        toast({ title: 'Prośba została odrzucona', variant: 'success' });
        fetchJoinRequests();
      } else {
        const errorData = await response.json();
        toast({ title: 'Błąd odrzucenia prośby', description: errorData.message || 'Nie udało się odrzucić prośby', variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Błąd odrzucenia prośby', description: err.message, variant: 'error' });
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/companies/${company._id}/members/${userId}/role-old`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Błąd podczas zmiany roli');
      }

      toast({ title: 'Rola została zmieniona', variant: 'success' });
      fetchCompanyData(); // Odśwież dane
    } catch (err) {
      toast({ title: 'Błąd zmiany roli', description: err.message, variant: 'error' });
    }
  };

  const handleAssignCustomRole = async (userId, roleId) => {
    try {
      await assignCustomRole(company._id, userId, roleId);
      toast({ title: 'Rola została przypisana', variant: 'success' });
      fetchCompanyData(); // Odśwież dane
      fetchRoles(); // Odśwież listę ról
    } catch (err) {
      toast({ title: 'Błąd przypisania roli', description: err.message, variant: 'error' });
    }
  };

  const getUserCustomRole = (user) => {
    if (!user.companyRoleId) return null;
    return roles.find(r => r._id === user.companyRoleId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie danych firmy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Błąd</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Powrót do strony głównej
          </button>
        </div>
      </div>
    );
  }

  if (!company) {
    const isProvider = user?.role === 'provider';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-16 w-16 text-gray-400 mx-auto mb-4 text-6xl">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isProvider ? 'Nie należysz do żadnego zespołu' : 'Nie należysz do żadnej firmy'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isProvider
              ? 'Jako wykonawca możesz dołączyć do firmy wieloosobowej — wyślij prośbę lub poczekaj na zaproszenie od właściciela.'
              : 'Aby zarządzać zespołem wykonawców, musisz najpierw utworzyć firmę wieloosobową.'}
          </p>
          {isProvider ? (
            <button
              onClick={() => navigate('/company/join')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Dołącz do zespołu
            </button>
          ) : (
            <button
              onClick={() => navigate('/company/create')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Utwórz firmę wieloosobową
            </button>
          )}
        </div>
      </div>
    );
  }

  const stats = [
    { name: 'Wszyscy członkowie', value: company.teamSize, icon: '👥' },
    { name: 'Wykonawcy', value: company.providers?.length || 0, icon: '👷' },
    { name: 'Managerzy', value: company.managers?.length || 0, icon: '👔' },
    { name: 'Zakończone zlecenia', value: company.stats?.completedOrders || 0, icon: '📊' }
  ];

  const canManageCompany = currentUserId && company && (
    company.owner?._id === currentUserId || 
    company.managers?.some(m => m._id === currentUserId)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-gray-600">NIP: {company.nip}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center">
                    {company.verified ? (
                      <span className="text-green-500 mr-1">✅</span>
                    ) : (
                      <span className="text-yellow-500 mr-1">⏰</span>
                    )}
                    <span className={`text-sm ${company.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {company.verified ? 'Zweryfikowana' : 'Oczekuje na weryfikację'}
                    </span>
                  </div>
                  {subscription && (subscription.planKey === 'BUSINESS_FREE' || subscription.planKey === 'BUSINESS_STANDARD' || subscription.planKey === 'BUSINESS_PRO') ? (
                    <div className="flex items-center">
                      <span className="text-indigo-500 mr-1">🏢</span>
                      <span className="text-sm text-indigo-600 font-medium">
                        {subscription.planKey === 'BUSINESS_PRO' ? 'BUSINESS PRO' : 
                         subscription.planKey === 'BUSINESS_STANDARD' ? 'BUSINESS STANDARD' : 
                         'BUSINESS FREE'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">ℹ️</span>
                      <span className="text-sm text-gray-600">
                        Plan biznesowy nieaktywny
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => navigate('/provider-home')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <span className="mr-2">📋</span>
                  Panel zleceń
                </button>
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Zaproś członka
                </button>
                <button 
                  onClick={() => navigate(`/company/${company._id}/settings`)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <span className="mr-2">⚙️</span>
                  Ustawienia
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Asystent AI dla firmy – MVP */}
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setCompanyAiOpen(!companyAiOpen)}
            className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-indigo-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Asystent AI dla firmy</h3>
                <p className="text-sm text-gray-700">Podsumowania zespołu, obciążenie, wskazówki – tylko dla Ciebie i Twojej firmy.</p>
              </div>
            </div>
            {companyAiOpen ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-indigo-600" />}
          </button>
          {companyAiOpen && (
            <div className="border-t border-indigo-200 bg-white/80 p-4">
              <div className="h-64 overflow-y-auto space-y-3 mb-4 rounded-lg bg-gray-50 p-3">
                {companyAiMessages.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">Zadaj pytanie, np. „Podsumuj zespół”, „Ile mamy zleceń w realizacji?”, „Gdzie są faktury?”</p>
                )}
                {companyAiMessages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-gray-900 border border-indigo-100'}`}>
                      {m.content}
                    </div>
                    {m.role === 'assistant' && m.actionCard && (
                      <button
                        type="button"
                        onClick={() => navigate(m.actionCard.path)}
                        className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        → {m.actionCard.label}
                      </button>
                    )}
                  </div>
                ))}
                {companyAiLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-3 py-2 text-sm bg-indigo-50 text-gray-500">Piszę...</div>
                  </div>
                )}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const text = companyAiInput.trim();
                  if (!text || !company?._id || companyAiLoading) return;
                  setCompanyAiMessages((prev) => [...prev, { role: 'user', content: text }]);
                  setCompanyAiInput('');
                  setCompanyAiLoading(true);
                  try {
                    const history = companyAiMessages.map((m) => ({ role: m.role, content: m.content }));
                    const data = await companyAiChat(company._id, text, history);
                    setCompanyAiMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'Brak odpowiedzi.', actionCard: data.actionCard }]);
                  } catch (err) {
                    setCompanyAiMessages((prev) => [...prev, { role: 'assistant', content: 'Błąd: ' + (err.message || 'Spróbuj ponownie.') }]);
                  } finally {
                    setCompanyAiLoading(false);
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={companyAiInput}
                  onChange={(e) => setCompanyAiInput(e.target.value)}
                  placeholder="Pytanie do Asystenta..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={companyAiLoading}
                />
                <button type="submit" disabled={companyAiLoading || !companyAiInput.trim()} className="rounded-lg bg-indigo-600 text-white p-2 hover:bg-indigo-700 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Resource Pool Management */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">AI Shortlista ofert (Firma PRO)</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${subscription?.planKey === 'BUSINESS_PRO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {subscription?.planKey === 'BUSINESS_PRO' ? 'BUSINESS PRO aktywny' : 'Wymaga BUSINESS PRO'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Wklej ID zlecenia, a AI przygotuje shortlistę najlepszych ofert (score + ryzyka) według polityki zakupowej firmy.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!company?._id || !shortlistOrderId.trim()) return;
              setShortlistLoading(true);
              setShortlistError('');
              try {
                const result = await getCompanyOrderShortlist(company._id, shortlistOrderId.trim(), 5);
                setShortlistData(result);
                setShortlistExpandedOfferId(null);
              } catch (err) {
                setShortlistData(null);
                setShortlistExpandedOfferId(null);
                setShortlistError(err.message || 'Nie udało się pobrać shortlisty');
              } finally {
                setShortlistLoading(false);
              }
            }}
            className="flex flex-col sm:flex-row gap-2 mb-4"
          >
            <input
              type="text"
              value={shortlistOrderId}
              onChange={(e) => setShortlistOrderId(e.target.value)}
              placeholder="ID zlecenia (orderId)"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={shortlistLoading || !shortlistOrderId.trim()}
              className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {shortlistLoading ? 'Analizuję...' : 'Generuj shortlistę'}
            </button>
          </form>
          {shortlistError && (
            <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {shortlistError}
            </div>
          )}
          {shortlistData?.shortlist?.length > 0 && (
            <div className="overflow-x-auto">
              <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Razem</div>
                  <div className="text-sm font-semibold text-slate-900">{shortlistRecommendationStats.total}</div>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-indigo-600">Strong match</div>
                  <div className="text-sm font-semibold text-indigo-800">
                    {shortlistRecommendationStats.strong} <span className="text-xs font-medium text-indigo-600">({recommendationRate(shortlistRecommendationStats.strong)})</span>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-blue-600">Good match</div>
                  <div className="text-sm font-semibold text-blue-800">
                    {shortlistRecommendationStats.good} <span className="text-xs font-medium text-blue-600">({recommendationRate(shortlistRecommendationStats.good)})</span>
                  </div>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-rose-600">Review required</div>
                  <div className="text-sm font-semibold text-rose-800">
                    {shortlistRecommendationStats.review} <span className="text-xs font-medium text-rose-600">({recommendationRate(shortlistRecommendationStats.review)})</span>
                  </div>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <select
                  value={shortlistRecommendationFilter}
                  onChange={(e) => setShortlistRecommendationFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="all">Wszystkie rekomendacje</option>
                  <option value="strong_match">Strong match</option>
                  <option value="good_match">Good match</option>
                  <option value="review_required">Review required</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    if (!company?._id || !shortlistOrderId.trim()) return;
                    try {
                      const data = await getCompanyOrderSlaStatus(company._id, shortlistOrderId.trim());
                      setSlaStatus(data?.sla || null);
                    } catch (err) {
                      setShortlistError(err.message || 'Nie udało się pobrać statusu SLA');
                    }
                  }}
                  className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Sprawdź SLA
                </button>
                <button
                  type="button"
                  disabled={followupLoading}
                  onClick={async () => {
                    if (!company?._id || !shortlistOrderId.trim()) return;
                    setFollowupLoading(true);
                    try {
                      const data = await sendCompanyOrderFollowup(company._id, shortlistOrderId.trim());
                      const sent = data?.followup?.notificationsSent ?? 0;
                      const considered = data?.followup?.offersConsidered ?? 0;
                      setShortlistError('');
                      toast({ title: `Follow-up wysłany: ${sent}/${considered} ofert`, variant: 'success' });
                    } catch (err) {
                      setShortlistError(err.message || 'Nie udało się wysłać follow-up');
                    } finally {
                      setFollowupLoading(false);
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {followupLoading ? 'Wysyłam follow-up...' : 'Wyślij follow-up'}
                </button>
                <button
                  type="button"
                  disabled={autoFollowupLoading}
                  onClick={async () => {
                    if (!company?._id || !shortlistOrderId.trim()) return;
                    setAutoFollowupLoading(true);
                    try {
                      const data = await runCompanyOrderAutoFollowup(company._id, shortlistOrderId.trim());
                      const triggered = Boolean(data?.autoFollowup?.triggered);
                      if (!triggered) {
                        const reason = data?.autoFollowup?.reason || 'brak warunków';
                        toast({ title: 'Auto follow-up nie został uruchomiony', description: reason, variant: 'warning' });
                      } else {
                        toast({ title: `Auto follow-up uruchomiony: ${data?.autoFollowup?.notificationsSent || 0} powiadomień`, variant: 'success' });
                      }
                      setShortlistError('');
                    } catch (err) {
                      setShortlistError(err.message || 'Nie udało się uruchomić auto follow-up');
                    } finally {
                      setAutoFollowupLoading(false);
                    }
                  }}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {autoFollowupLoading ? 'Uruchamiam auto follow-up...' : 'Auto-check + follow-up'}
                </button>
                {slaStatus && (
                  <div className={`rounded-lg px-2 py-1 text-xs font-medium ${slaStatus.breached ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    SLA {slaStatus.breached ? 'przekroczone' : 'OK'}
                    {slaStatus.breachType ? ` (${slaStatus.breachType === 'first_offer' ? 'brak pierwszej oferty' : 'brak oferty kwalifikowanej'})` : ''}
                    {' · '}elapsed: {slaStatus.elapsedHours}h
                    {' · '}1. oferta: {slaStatus.timeToFirstOfferHours ?? '—'}h / {slaStatus.firstOfferThresholdHours}h
                    {' · '}1. kwalifikowana: {slaStatus.timeToFirstQualifiedHours ?? '—'}h / {slaStatus.thresholdHours}h
                    {' · '}kwalifikowane: {slaStatus.qualifiedOffers}
                  </div>
                )}
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Wykonawca</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">Cena</th>
                    <th className="py-2 pr-3">AI quality</th>
                    <th className="py-2 pr-3">Dlaczego ten ranking</th>
                    <th className="py-2 pr-3">Ryzyka</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlistRows.map((row, index) => (
                    <tr key={row.offerId} className="border-b border-gray-100 align-top">
                      <td className="py-2 pr-3 font-semibold text-gray-800">{index + 1}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-gray-900">{row.providerName}</div>
                        <div className="text-xs text-gray-500">{row.providerEmail || '—'}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">
                          {row.score}%
                        </span>
                      </td>
                      <td className="py-2 pr-3">{row.amount ? `${row.amount} PLN` : '—'}</td>
                      <td className="py-2 pr-3">{row.quality ? `${row.quality}%` : '—'}</td>
                      <td className="py-2 pr-3 text-xs text-slate-700">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <div className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${row.policyQualified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {row.policyQualified ? 'Policy fit' : 'Do weryfikacji'}
                            </div>
                            <div className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${
                              row.recommendation === 'strong_match'
                                ? 'bg-indigo-100 text-indigo-700'
                                : row.recommendation === 'good_match'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-rose-100 text-rose-700'
                            }`}>
                              {row.recommendation === 'strong_match'
                                ? 'Strong match'
                                : row.recommendation === 'good_match'
                                  ? 'Good match'
                                  : 'Review required'}
                            </div>
                          </div>
                          <div>
                            {Array.isArray(row.fitReasons) && row.fitReasons.length > 0 ? row.fitReasons.slice(0, 2).join(' • ') : 'Brak dodatkowych uzasadnień'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const id = String(row.offerId || '');
                              setShortlistExpandedOfferId((prev) => (prev === id ? null : id));
                            }}
                            className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
                          >
                            {shortlistExpandedOfferId === String(row.offerId || '') ? 'Ukryj score breakdown' : 'Pokaż score breakdown'}
                          </button>
                          {shortlistExpandedOfferId === String(row.offerId || '') && (
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                              <div>Quality: +{row?.scoreBreakdown?.qualityScore ?? 0}</div>
                              <div>Rating: +{row?.scoreBreakdown?.ratingScore ?? 0}</div>
                              <div>Price fit: +{row?.scoreBreakdown?.priceFitScore ?? 0}</div>
                              <div>Policy fit: {row?.scoreBreakdown?.policyFitScore ?? 0}</div>
                              <div>Risk penalty: -{row?.scoreBreakdown?.riskPenalty ?? 0}</div>
                              <div className="mt-1 font-semibold">Rekomendacja: {row?.recommendation || 'review_required'}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-xs text-amber-700">
                        {Array.isArray(row.risks) && row.risks.length > 0 ? row.risks.join(' • ') : 'Brak krytycznych ryzyk'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shortlistRows.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-500">Brak ofert dla wybranego filtra rekomendacji.</div>
              )}
            </div>
          )}
        </div>

        {/* Resource Pool Management */}
        <div className="mb-6">
          {subscription && (subscription.planKey === 'BUSINESS_STARTER' || subscription.planKey === 'BUSINESS_PRO') ? (
            <ResourcePoolManagement 
              companyId={company._id} 
              canManage={
                currentUserId && (
                  company.owner?._id === currentUserId || 
                  company.managers?.some(m => m._id === currentUserId)
                )
              }
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Resource Pool</h2>
                  <p className="text-gray-600 mb-4">
                    Resource Pool pozwala na wspólne zarządzanie limitami AI Concierge i odpowiedziami dla całego zespołu. Pilne zlecenia są bezpłatne dla wszystkich.
                    Dostępne we wszystkich planach biznesowych (BUSINESS_FREE, BUSINESS_STANDARD, BUSINESS_PRO).
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Dostępne funkcje bez planu biznesowego:</h3>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                      <li>✅ Zarządzanie zespołem (dodawanie/usuwanie członków)</li>
                      <li>✅ Portfel firmowy i faktury</li>
                      <li>✅ Automatyzacja workflow</li>
                      <li>✅ Role i uprawnienia</li>
                      <li>✅ Audit log</li>
                      <li>✅ Analityka zespołu</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => navigate('/subscriptions?audience=business')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                  >
                    Wybierz plan biznesowy →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Company Wallet */}
        <div className="mb-6">
          <CompanyWallet 
            companyId={company._id} 
            canManage={
              currentUserId && (
                company.owner?._id === currentUserId || 
                company.managers?.some(m => m._id === currentUserId)
              )
            }
          />
        </div>

        {/* Company Invoices */}
        <div className="mb-6">
          <CompanyInvoices 
            companyId={company._id} 
            canManage={
              currentUserId && (
                company.owner?._id === currentUserId || 
                company.managers?.some(m => m._id === currentUserId)
              )
            }
          />
        </div>

        {/* Workflow Management */}
        <div className="mb-6">
          <WorkflowManagement 
            companyId={company._id} 
            canManage={
              currentUserId && (
                company.owner?._id === currentUserId || 
                company.managers?.some(m => m._id === currentUserId)
              )
            }
          />
        </div>

        {/* Roles & Permissions */}
        <div className="mb-6">
          <RolesManagement 
            companyId={company._id} 
            canManage={
              currentUserId && (
                company.owner?._id === currentUserId || 
                company.managers?.some(m => m._id === currentUserId)
              )
            }
          />
        </div>

        {/* Audit Log */}
        <div className="mb-6">
          <AuditLog 
            companyId={company._id} 
            canView={canManageCompany}
          />
        </div>

        {/* Team Performance Analytics */}
        <div className="mb-6">
          <TeamPerformance 
            companyId={company._id} 
            canView={canManageCompany}
          />
        </div>

        {/* Team Members */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Zespół</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {/* Owner */}
            {company.owner && (
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {company.owner.name?.charAt(0) || 'O'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {company.owner.name}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Właściciel
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{company.owner.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Managers */}
            {company.managers?.map((manager) => (
              <div key={manager._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-medium">
                        {manager.name?.charAt(0) || 'M'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {manager.name}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Manager
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{manager.email}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <select 
                    value="manager"
                    onChange={(e) => handleChangeRole(manager._id, e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="manager">Manager</option>
                    <option value="provider">Wykonawca</option>
                  </select>
                  <button 
                    onClick={() => handleRemoveMember(manager._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}

            {/* Providers */}
            {company.providers?.map((provider) => {
              const customRole = getUserCustomRole(provider);
              return (
                <div key={provider._id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {provider.name?.charAt(0) || 'P'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {provider.name}
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Wykonawca
                        </span>
                        {customRole && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {customRole.name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{provider.email}</div>
                    </div>
                  </div>
                  {canManageCompany && (
                    <div className="flex space-x-2">
                      <select 
                        value={provider.companyRoleId || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignCustomRole(provider._id, e.target.value);
                          } else {
                            handleAssignCustomRole(provider._id, null);
                          }
                        }}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="">Brak custom roli</option>
                        {roles.map(role => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                      </select>
                      <select 
                        value="provider"
                        onChange={(e) => handleChangeRole(provider._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="provider">Wykonawca</option>
                        <option value="manager">Manager</option>
                      </select>
                      <button 
                        onClick={() => handleRemoveMember(provider._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Zaproś nowego członka</h3>
                <form onSubmit={handleInviteUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rola
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="provider">Wykonawca</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Wyślij zaproszenie
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
