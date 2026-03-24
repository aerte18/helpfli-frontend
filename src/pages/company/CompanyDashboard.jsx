import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourcePoolManagement from '../../components/company/ResourcePoolManagement';
import CompanyWallet from '../../components/company/CompanyWallet';
import CompanyInvoices from '../../components/company/CompanyInvoices';
import WorkflowManagement from '../../components/company/WorkflowManagement';
import RolesManagement from '../../components/company/RolesManagement';
import AuditLog from '../../components/company/AuditLog';
import TeamPerformance from '../../components/company/TeamPerformance';
import { getCompanyRoles, assignCustomRole, getCompanySubscription, companyAiChat } from '../../api/companies';
import { Sparkles, ChevronDown, ChevronUp, Send } from 'lucide-react';

const CompanyDashboard = () => {
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
  const navigate = useNavigate();

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
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${company._id}/invite`, {
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
        alert('Zaproszenie zostało wysłane!');
        setShowInviteModal(false);
        setInviteEmail('');
        fetchCompanyData(); // Odśwież dane
      }
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego członka z firmy?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${company._id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas usuwania członka');
      }

      alert('Członek został usunięty z firmy');
      fetchCompanyData(); // Odśwież dane
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const fetchJoinRequests = async () => {
    if (!company?._id || !canManageCompany) return;
    
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${company._id}/join-requests?status=pending`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${company._id}/join-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Prośba została zaakceptowana');
        fetchJoinRequests();
        fetchCompanyData();
      } else {
        const errorData = await response.json();
        alert(`Błąd: ${errorData.message || 'Nie udało się zaakceptować prośby'}`);
      }
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt('Podaj powód odrzucenia (opcjonalnie):');
    if (reason === null) return; // Użytkownik anulował

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${company._id}/join-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || '' })
      });

      if (response.ok) {
        alert('Prośba została odrzucona');
        fetchJoinRequests();
      } else {
        const errorData = await response.json();
        alert(`Błąd: ${errorData.message || 'Nie udało się odrzucić prośby'}`);
      }
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${company._id}/members/${userId}/role-old`, {
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

      alert('Rola została zmieniona');
      fetchCompanyData(); // Odśwież dane
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleAssignCustomRole = async (userId, roleId) => {
    try {
      await assignCustomRole(company._id, userId, roleId);
      alert('Rola została przypisana');
      fetchCompanyData(); // Odśwież dane
      fetchRoles(); // Odśwież listę ról
    } catch (err) {
      alert(`Błąd: ${err.message}`);
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="h-16 w-16 text-gray-400 mx-auto mb-4 text-6xl">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nie należysz do żadnej firmy</h2>
          <p className="text-gray-600 mb-6">
            Aby zarządzać zespołem wykonawców, musisz najpierw utworzyć lub dołączyć do firmy.
          </p>
          <button 
            onClick={() => navigate('/company/create')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Utwórz firmę
          </button>
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
