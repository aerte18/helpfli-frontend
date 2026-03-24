import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CompanyOnboarding from "../../components/company/CompanyOnboarding";
import ResourcePoolManagement from "../../components/company/ResourcePoolManagement";
import CompanyWallet from "../../components/company/CompanyWallet";
import CompanyInvoices from "../../components/company/CompanyInvoices";
import WorkflowManagement from "../../components/company/WorkflowManagement";
import RolesManagement from "../../components/company/RolesManagement";
import AuditLog from "../../components/company/AuditLog";
import TeamPerformance from "../../components/company/TeamPerformance";
import CompanySettings from "./CompanySettings";
import CompanyAnalytics from "./CompanyAnalytics";
import CompanyBilling from "./CompanyBilling";
import { getCompanyRoles, getCompanySubscription } from "../../api/companies";

export default function CompanyAccount() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [roles, setRoles] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanyData();
  }, []);

  useEffect(() => {
    if (company?._id) {
      fetchRoles();
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
        setCompany(data.companies[0]);
      } else {
        setCompany(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync tab with URL (?tab=x)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search]);

  const companyTabs = [
    { id: "overview", label: "Przegląd", icon: "📊" },
    { id: "profile", label: "Profil firmy", icon: "🏢" },
    { id: "team", label: "Zespół", icon: "👥" },
    { id: "analytics", label: "Analityka", icon: "📈" },
    { id: "billing", label: "Rozliczenia", icon: "💳" },
    { id: "resource-pool", label: "Resource Pool", icon: "💾" },
    { id: "wallet", label: "Portfel", icon: "💰" },
    { id: "invoices", label: "Faktury", icon: "📄" },
    { id: "workflow", label: "Workflow", icon: "⚙️" },
    { id: "roles", label: "Role", icon: "👤" },
    { id: "audit", label: "Audit Log", icon: "📋" },
    { id: "subscriptions", label: "Subskrypcje", icon: "💳" },
    { id: "settings", label: "Ustawienia", icon: "🔧" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie danych firmy...</p>
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
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
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
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
          >
            Utwórz firmę
          </button>
        </div>
      </div>
    );
  }

  const currentUserId = user?._id || user?.id;
  const canManageCompany = currentUserId && (
    company.owner?._id === currentUserId || 
    company.managers?.some(m => m._id === currentUserId)
  );

  const stats = [
    { name: 'Wszyscy członkowie', value: company.teamSize || 1, icon: '👥' },
    { name: 'Wykonawcy', value: company.providers?.length || 0, icon: '👷' },
    { name: 'Zakończone zlecenia', value: company.stats?.completedOrders || 0, icon: '✅' },
    { name: 'Przychody (miesiąc)', value: `${company.stats?.monthlyRevenue || 0}.00 zł`, icon: '💰' },
    { name: 'Średnia ocena', value: company.stats?.avgRating?.toFixed(2) || '0.00', icon: '⭐' },
    { name: 'Aktywne zlecenia', value: company.stats?.activeOrders || 0, icon: '📋' }
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
        {/* Left nav */}
        <aside className="bg-white rounded-2xl shadow">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">
                  {company.name?.charAt(0) || "F"}
                </span>
              </div>
              <div>
                <div className="font-semibold text-sm">{company.name}</div>
                <div className="text-xs text-gray-500">Firma</div>
              </div>
            </div>
          </div>
          <nav className="px-2 pb-3 space-y-1">
            {companyTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  const q = new URLSearchParams(location.search);
                  q.set('tab', tab.id);
                  navigate(`/account/company?${q.toString()}`, { replace: true });
                }}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 ${
                  activeTab === tab.id ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              {companyTabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>

          {/* Content based on active tab */}
          {activeTab === "overview" && (
            <OverviewTab 
              company={company} 
              stats={stats} 
              subscription={subscription}
              canManage={canManageCompany}
              currentUserId={currentUserId}
              onInvite={() => setActiveTab("team")}
            />
          )}
          {activeTab === "profile" && <ProfileTab company={company} />}
          {activeTab === "team" && (
            <TeamTab 
              company={company} 
              canManage={canManageCompany}
              currentUserId={currentUserId}
              roles={roles}
              onRefresh={fetchCompanyData}
            />
          )}
          {activeTab === "analytics" && (
            <CompanyAnalytics companyId={company._id} canView={canManageCompany} />
          )}
          {activeTab === "billing" && (
            <CompanyBilling companyId={company._id} />
          )}
          {activeTab === "resource-pool" && (
            <ResourcePoolManagement 
              companyId={company._id} 
              canManage={canManageCompany}
            />
          )}
          {activeTab === "wallet" && (
            <CompanyWallet 
              companyId={company._id} 
              canManage={canManageCompany}
            />
          )}
          {activeTab === "invoices" && (
            <CompanyInvoices 
              companyId={company._id} 
              canManage={canManageCompany}
            />
          )}
          {activeTab === "workflow" && (
            <WorkflowManagement 
              companyId={company._id} 
              canManage={canManageCompany}
            />
          )}
          {activeTab === "roles" && (
            <RolesManagement 
              companyId={company._id} 
              canManage={canManageCompany}
            />
          )}
          {activeTab === "audit" && (
            <AuditLog 
              companyId={company._id} 
              canView={canManageCompany}
            />
          )}
          {activeTab === "subscriptions" && (
            <SubscriptionsTab subscription={subscription} />
          )}
          {activeTab === "settings" && (
            <CompanySettings companyId={company._id} />
          )}
        </main>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ company, stats, subscription, canManage, currentUserId, onInvite }) {
  return (
    <div className="space-y-4">
      {/* Onboarding */}
      <CompanyOnboarding companyId={company._id} />

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-sm text-gray-500">{stat.name}</div>
                <div className="text-xl font-semibold">{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Szybkie akcje</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onInvite}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Zarządzaj zespołem
          </button>
          <Link
            to="/account/company?tab=analytics"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Zobacz analitykę
          </Link>
          <Link
            to="/account/company?tab=subscriptions"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Zarządzaj planem
          </Link>
        </div>
      </section>
    </div>
  );
}

// Profile Tab
function ProfileTab({ company }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-700">Nazwa firmy</h3>
        <p className="text-lg">{company.name}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700">NIP</h3>
        <p className="text-lg">{company.nip}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700">Email</h3>
        <p className="text-lg">{company.email}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700">Status weryfikacji</h3>
        <p className="text-lg">
          {company.verified ? (
            <span className="text-green-600">✓ Zweryfikowana</span>
          ) : (
            <span className="text-yellow-600">⏰ Oczekuje na weryfikację</span>
          )}
        </p>
      </div>
    </div>
  );
}

// Team Tab
function TeamTab({ company, canManage, currentUserId, roles, onRefresh }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('provider');

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
        onRefresh();
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
      onRefresh();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const getUserCustomRole = (user) => {
    if (!user.companyRoleId) return null;
    return roles.find(r => r._id === user.companyRoleId);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + Zaproś członka
          </button>
        </div>
      )}

      <div className="divide-y">
        {/* Owner */}
        {company.owner && (
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {company.owner.name?.charAt(0) || 'O'}
                </span>
              </div>
              <div>
                <div className="font-medium">
                  {company.owner.name}
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
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
          <div key={manager._id} className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-medium">
                  {manager.name?.charAt(0) || 'M'}
                </span>
              </div>
              <div>
                <div className="font-medium">
                  {manager.name}
                  <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                    Manager
                  </span>
                </div>
                <div className="text-sm text-gray-500">{manager.email}</div>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => handleRemoveMember(manager._id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Usuń
              </button>
            )}
          </div>
        ))}

        {/* Providers */}
        {company.providers?.map((provider) => {
          const customRole = getUserCustomRole(provider);
          return (
            <div key={provider._id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {provider.name?.charAt(0) || 'P'}
                  </span>
                </div>
                <div>
                  <div className="font-medium">
                    {provider.name}
                    <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                      Wykonawca
                    </span>
                    {customRole && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                        {customRole.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{provider.email}</div>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => handleRemoveMember(provider._id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Usuń
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-96">
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Wyślij zaproszenie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subscriptions Tab
function SubscriptionsTab({ subscription }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      {subscription ? (
        <>
          <div>
            <h3 className="font-semibold text-gray-700">Aktywny plan</h3>
            <p className="text-lg">{subscription.planKey || 'Brak planu'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Ważny do</h3>
            <p className="text-lg">
              {subscription.validUntil ? new Date(subscription.validUntil).toLocaleDateString('pl-PL') : 'Brak daty'}
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Brak aktywnej subskrypcji</p>
          <Link
            to="/subscriptions?audience=business"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Wybierz plan biznesowy
          </Link>
        </div>
      )}
    </div>
  );
}
