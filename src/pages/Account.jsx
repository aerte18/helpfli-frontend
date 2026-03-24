import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart2, ClipboardList, Wallet, Heart, Star, History, Gift, CreditCard, Settings, Lock, User, Users, TrendingUp, Calendar, Building2, Link2, BadgeCheck, ShieldCheck, Camera, Image, ChevronDown, ChevronUp } from "lucide-react";
import { registerPush } from "../push/registerPush";
import { api } from "../api/client";
import KycBadge from "../components/KycBadge";
import { useAuth } from "../context/AuthContext";
import ManageServices from "./ManageServices";
import PrivacySettings from "../components/PrivacySettings";
import Referrals from "./Referrals";
import CalendarIntegrations from "./integrations/CalendarIntegrations";
import CrmIntegrations from "./integrations/CrmIntegrations";
import { getMyOffers } from "../api/offers";
import ProviderSchedule from "../components/ProviderSchedule";
import CompanyTab from "./CompanyTab";
import NotificationSettings from "../components/NotificationSettings";
import TwoFactorAuth from "../components/TwoFactorAuth";
import ChangePasswordModal from "../components/ChangePasswordModal";
import OrderStatsDashboard from "../components/OrderStatsDashboard";

function useAuthToken() {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

export default function Account() {
  const token = useAuthToken();
  const { user, fetchMe } = useAuth();
  const [pushStatus, setPushStatus] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showTwoFactorAuth, setShowTwoFactorAuth] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Usunięto automatyczne przekierowanie - użytkownik może wybrać zakładkę "Firma" ręcznie

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.role !== 'provider') return;
      
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/provider-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error('Błąd pobierania statystyk:', e);
      }
    };
    fetchStats();
  }, [token, user]);

  // Sync tab with URL (?tab=x)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl === 'notifications') {
      const q = new URLSearchParams(location.search);
      q.set('tab', 'settings');
      navigate({ search: q.toString() }, { replace: true });
      setActiveTab('settings');
      return;
    }
    if (tabFromUrl === 'subscriptions') {
      const audience = user?.company ? 'business' : (user?.role === 'provider' ? 'provider' : 'client');
      navigate(`/account/subscriptions?audience=${audience}`, { replace: true });
      return;
    }
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function enablePush() {
    setPushStatus("Włączanie...");
    
    const VAPID = "BDlNtEgV-XsDrBc2dKPCXwY3AlUO0g-hm0GvaAE75E-wqa6WR3zw2Ggzdty9DVz3PVcIaDxpGibBhhv_I15Oqs8";
    
    const res = await registerPush({ token, vapidPublicKey: VAPID });
    
    if (res.ok) {
      setPushStatus("Powiadomienia włączone ✅");
    } else {
      setPushStatus(`Nie udało się: ${res.reason || "błąd"}`);
    }
  }

  const clientTabs = [
    { id: "overview", label: "Przegląd", icon: BarChart2 },
    { id: "orders", label: "Zlecenia", icon: ClipboardList },
    { id: "billing", label: "Rozliczenia", icon: Wallet },
    { id: "favorites", label: "Ulubieni", icon: Heart },
    { id: "ratings", label: "Oceny", icon: Star },
    { id: "history", label: "Historia", icon: History },
    { id: "referrals", label: "Polecenia", icon: Gift },
    { id: "subscriptions", label: "Subskrypcje", icon: CreditCard },
    { id: "settings", label: "Ustawienia", icon: Settings },
    { id: "privacy", label: "Prywatność", icon: Lock }
  ];

  const providerTabs = [
    { id: "overview", label: "Przegląd", icon: BarChart2 },
    { id: "orders", label: "Oferty", icon: ClipboardList },
    { id: "billing", label: "Rozliczenia", icon: Wallet },
    { id: "profile", label: "Profil", icon: User },
    { id: "ratings", label: "Oceny", icon: Star },
    { id: "stats", label: "Statystyki", icon: TrendingUp },
    { id: "schedule", label: "Harmonogram", icon: Calendar },
    { id: "company", label: "Firma", icon: Building2 },
    { id: "referrals", label: "Polecenia", icon: Gift },
    { id: "integrations", label: "Integracje", icon: Link2 },
    { id: "payments", label: "Płatności", icon: CreditCard },
    { id: "kyc", label: "Weryfikacja", icon: BadgeCheck },
    { id: "subscriptions", label: "Subskrypcje", icon: CreditCard },
    { id: "settings", label: "Ustawienia", icon: Settings },
    { id: "privacy", label: "Prywatność", icon: Lock }
  ];

  const tabs = user?.role === 'provider' ? providerTabs : clientTabs;

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
        {/* Left nav */}
        <aside className="bg-white rounded-2xl shadow">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <div className="font-semibold">{user?.name || "Użytkownik"}</div>
                <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
              </div>
            </div>
          </div>
          <nav className="px-2 pb-3 space-y-1">
            {tabs.map(tab => {
              const isSubscriptions = tab.id === 'subscriptions';
              const subscriptionsAudience = user?.company ? 'business' : (user?.role === 'provider' ? 'provider' : 'client');
              return isSubscriptions ? (
                <Link
                  key={tab.id}
                  to={`/account/subscriptions?audience=${subscriptionsAudience}`}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 ${
                    location.pathname === '/account/subscriptions' ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  {tab.icon && <tab.icon className="w-5 h-5 shrink-0" aria-hidden />}
                  {tab.label}
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const q = new URLSearchParams(location.search);
                    q.set('tab', tab.id);
                    navigate({ search: q.toString() }, { replace: true });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 ${
                    activeTab === tab.id ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  {tab.icon && <tab.icon className="w-5 h-5 shrink-0" aria-hidden />}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            {user?.role === 'provider' && (
              <Link to="/provider-home" className="text-slate-600 hover:underline">
                Panel wykonawcy
              </Link>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === "overview" && <OverviewTab user={user} stats={stats} />}
          {activeTab === "orders" && <OrdersTab user={user} />}
          {activeTab === "billing" && <BillingTab user={user} />}
          {activeTab === "favorites" && user?.role === 'client' && <FavoritesTab />}
          {activeTab === "ratings" && <RatingsTab user={user} />}
          {activeTab === "history" && user?.role === 'client' && <HistoryTab />}
          {activeTab === "profile" && user?.role === 'provider' && <ProfileTab user={user} fetchMe={fetchMe} />}
          {activeTab === "stats" && user?.role === 'provider' && <StatsTab stats={stats} />}
          {activeTab === "schedule" && user?.role === 'provider' && <ProviderSchedule />}
          {activeTab === "company" && user?.role === 'provider' && <CompanyTab user={user} />}
          {activeTab === "referrals" && <Referrals />}
          {activeTab === "integrations" && user?.role === 'provider' && (
            <div className="space-y-6">
              <CalendarIntegrations />
              <CrmIntegrations />
              {/* Integracja księgowa ukryta – faktury wystawiane poza systemem i załączane do zlecenia, brak synchronizacji faktur z Helpfli */}
            </div>
          )}
          {activeTab === "payments" && user?.role === 'provider' && <PaymentsTab user={user} fetchMe={fetchMe} />}
          {activeTab === "kyc" && user?.role === 'provider' && <KycTab user={user} />}
          {activeTab === "settings" && (
            <SettingsTab
              user={user}
              pushStatus={pushStatus}
              enablePush={enablePush}
              showChangePasswordModal={showChangePasswordModal}
              setShowChangePasswordModal={setShowChangePasswordModal}
              showTwoFactorAuth={showTwoFactorAuth}
              setShowTwoFactorAuth={setShowTwoFactorAuth}
              fetchMe={fetchMe}
            />
          )}
          {activeTab === "privacy" && <PrivacySettings />}
        </main>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ user, stats }) {
  return (
    <div className="space-y-4">
      {/* Order Stats Dashboard */}
      <OrderStatsDashboard userRole={user?.role} userId={user?.id || user?._id} />
      
      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {user?.role === 'client' ? (
          <>
            <KPI label="Zlecenia" value={stats?.orders || "0"} />
            <KPI label="Aktywne" value={stats?.activeOrders || "0"} />
            <KPI label="Wykonane" value={stats?.completedOrders || "0"} />
            <KPI label="Ulubieni" value={stats?.favorites || "0"} />
          </>
        ) : (
          <>
            <KPI label="Zlecenia" value={stats?.orders || "0"} />
            <KPI label="Oczekujące" value={stats?.pendingOrders || "0"} />
            <KPI label="Wykonane" value={stats?.completedOrders || "0"} />
            <KPI label="Ocena" value={stats?.rating || "0.0"} />
          </>
        )}
      </section>

      {/* Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Ostatnie zlecenia">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Naprawa kranu</div>
                <div className="text-sm text-gray-500">2 dni temu</div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Wykonane</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Montaż mebli</div>
                <div className="text-sm text-gray-500">1 tydzień temu</div>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">W trakcie</span>
            </div>
          </div>
        </Card>

        <Card title="Szybkie akcje">
          <div className="space-y-2">
            {user?.role === 'client' && (
              <Link to="/create-order" className="block w-full p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                <div className="font-medium">Utwórz nowe zlecenie</div>
                <div className="text-sm text-gray-600">Znajdź wykonawcę</div>
              </Link>
            )}
            {user?.role === 'provider' && !user?.company && (
              <>
                <Link to="/company/create" className="block w-full p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  <div className="font-medium flex items-center gap-2"><Building2 className="w-4 h-4 shrink-0" aria-hidden /> Zarejestruj firmę</div>
                  <div className="text-sm text-gray-600">Zarządzaj zespołem wykonawców</div>
                </Link>
                <Link to="/account?tab=company" className="block w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <div className="font-medium flex items-center gap-2"><Users className="w-4 h-4 shrink-0" aria-hidden /> Dołącz do firmy</div>
                  <div className="text-sm text-gray-600">Dołącz do istniejącej firmy</div>
                </Link>
              </>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

// Orders Tab
function OrdersTab({ user }) {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showDemo, setShowDemo] = useState(true); // Domyślnie pokazuj przykładowe zlecenia

  // Ustaw filtr na podstawie parametru ?status= z URL (np. z OrderStatsDashboard)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (!status) return;
    if (user?.role === 'client') {
      // Dla klienta akceptujemy tylko statusy z listy przycisków
      const allowed = ['all', 'open', 'collecting_offers', 'accepted', 'in_progress', 'completed'];
      if (allowed.includes(status) && status !== filter) {
        setFilter(status);
      }
    } else if (user?.role === 'provider') {
      const allowed = ['all', 'offered', 'accepted', 'in_progress', 'completed'];
      if (allowed.includes(status) && status !== filter) {
        setFilter(status);
      }
    }
  }, [location.search, user?.role, filter]);

  const DEMO_ORDERS = [
    {
      _id: "demo-order-1",
      status: "open",
      createdAt: new Date().toISOString(),
      service: "Hydraulik",
      serviceDetails: "Naprawa kranu",
      description: "Kran w kuchni przecieka. Potrzebuję szybkiej naprawy.",
      location: { city: "Warszawa" },
      budget: 200,
      client: { name: "Jan Klient" },
      provider: null,
      offers: [],
      __demo: true,
    },
    {
      _id: "demo-order-2",
      status: "collecting_offers",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      service: "Elektryk",
      serviceDetails: "Wymiana gniazdka",
      description: "Iskrzy gniazdko w salonie. Proszę o diagnozę i wymianę.",
      location: { city: "Kraków" },
      budget: 150,
      client: { name: "Jan Klient" },
      provider: null,
      offers: [
        {
          _id: "demo-offer-1",
          amount: 180,
          price: 180,
          message: "Wymienię gniazdko na nowe, bezpieczne. Dojazd wliczony w cenę.",
          status: "submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          providerId: "demo-provider-1",
          providerMeta: {
            name: "Jan Kowalski",
            ratingAvg: 4.8,
            ratingCount: 24,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          pricing: {
            badge: "optimal"
          },
          __demo: true
        },
        {
          _id: "demo-offer-2",
          amount: 150,
          price: 150,
          message: "Szybka wymiana gniazdka. Materiały w cenie.",
          status: "submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          providerId: "demo-provider-2",
          providerMeta: {
            name: "Piotr Nowak",
            ratingAvg: 4.5,
            ratingCount: 12,
            level: "standard",
            badges: ["verified"]
          },
          pricing: {
            badge: "fair"
          },
          __demo: true
        },
        {
          _id: "demo-offer-3",
          amount: 220,
          price: 220,
          message: "Profesjonalna wymiana z gwarancją. Dojazd + materiały premium.",
          status: "submitted",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          providerId: "demo-provider-3",
          providerMeta: {
            name: "Marek Wiśniewski",
            ratingAvg: 4.9,
            ratingCount: 45,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          pricing: {
            badge: "high"
          },
          hasGuarantee: true,
          __demo: true
        }
      ],
      __demo: true,
    },
    {
      _id: "demo-order-3",
      status: "accepted",
      paymentStatus: "unpaid",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      service: "Złota rączka",
      serviceDetails: "Montaż karnisza",
      description: "Montaż karnisza w sypialni + drobne poprawki mocowań.",
      location: { city: "Gdańsk" },
      budget: 180,
      client: { name: "Jan Klient" },
      provider: { name: "Wykonawca" },
      offers: [],
      __demo: true,
    },
    {
      _id: "demo-order-4",
      status: "funded",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      service: "Malarz",
      serviceDetails: "Malowanie pokoju",
      description: "Malowanie pokoju dziennego (ok. 25m²). Kolor biały, matowy. Wymagane przygotowanie powierzchni.",
      location: { city: "Wrocław", address: "ul. Kwiatowa 15" },
      budget: 800,
      client: { name: "Jan Klient" },
      provider: { 
        name: "Marek Malarz",
        ratingAvg: 4.7,
        ratingCount: 18
      },
      acceptedOfferId: "demo-offer-funded",
      offers: [
        {
          _id: "demo-offer-funded",
          amount: 750,
          price: 750,
          message: "Malowanie z pełnym przygotowaniem powierzchni. Materiały premium w cenie.",
          status: "accepted",
          providerId: "demo-provider-funded",
          providerMeta: {
            name: "Marek Malarz",
            ratingAvg: 4.7,
            ratingCount: 18,
            level: "pro",
            badges: ["verified"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    {
      _id: "demo-order-5",
      status: "in_progress",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      service: "Elektryk",
      serviceDetails: "Instalacja oświetlenia",
      description: "Instalacja nowego oświetlenia sufitowego w salonie. Wymiana starego żyrandola na nowoczesne LED.",
      location: { city: "Poznań", address: "ul. Słoneczna 8" },
      budget: 450,
      client: { name: "Jan Klient" },
      provider: { 
        name: "Piotr Elektryk",
        ratingAvg: 4.9,
        ratingCount: 32
      },
      acceptedOfferId: "demo-offer-in-progress",
      offers: [
        {
          _id: "demo-offer-in-progress",
          amount: 420,
          price: 420,
          message: "Profesjonalna instalacja z certyfikatem. Dojazd i materiały wliczone.",
          status: "accepted",
          providerId: "demo-provider-in-progress",
          providerMeta: {
            name: "Piotr Elektryk",
            ratingAvg: 4.9,
            ratingCount: 32,
            level: "pro",
            badges: ["verified", "top_ai"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
    {
      _id: "demo-order-6",
      status: "completed",
      paymentStatus: "succeeded",
      paidInSystem: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      service: "Hydraulik",
      serviceDetails: "Wymiana baterii",
      description: "Wymiana starej baterii umywalkowej na nową. Podłączenie wody i odpływu.",
      location: { city: "Łódź", address: "ul. Główna 22" },
      budget: 300,
      client: { name: "Jan Klient" },
      provider: { 
        name: "Tomasz Hydraulik",
        ratingAvg: 4.8,
        ratingCount: 28
      },
      acceptedOfferId: "demo-offer-completed",
      offers: [
        {
          _id: "demo-offer-completed",
          amount: 280,
          price: 280,
          message: "Szybka wymiana z gwarancją. Bateria premium w cenie.",
          status: "accepted",
          providerId: "demo-provider-completed",
          providerMeta: {
            name: "Tomasz Hydraulik",
            ratingAvg: 4.8,
            ratingCount: 28,
            level: "pro",
            badges: ["verified"]
          },
          __demo: true
        }
      ],
      __demo: true,
    },
  ];

  // Przykładowe zlecenia DEMO dla providera (z perspektywy providera)
  const DEMO_PROVIDER_ORDERS = [
    {
      order: {
        _id: "demo-provider-order-1",
        status: "collecting_offers",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        service: "Elektryk",
        serviceDetails: "Wymiana gniazdka",
        description: "Iskrzy gniazdko w salonie. Proszę o diagnozę i wymianę.",
        location: { city: "Kraków" },
        budget: 150,
        client: { name: "Jan Klient" },
        __demo: true,
      },
      offer: {
        _id: "demo-provider-offer-1",
        amount: 180,
        price: 180,
        message: "Wymienię gniazdko na nowe, bezpieczne. Dojazd wliczony w cenę.",
        status: "submitted",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
        __demo: true
      }
    },
    {
      order: {
        _id: "demo-provider-order-2",
        status: "accepted",
        paymentStatus: "unpaid",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        service: "Złota rączka",
        serviceDetails: "Montaż karnisza",
        description: "Montaż karnisza w sypialni + drobne poprawki mocowań.",
        location: { city: "Gdańsk" },
        budget: 180,
        client: { name: "Jan Klient" },
        acceptedOfferId: "demo-provider-offer-2",
        __demo: true,
      },
      offer: {
        _id: "demo-provider-offer-2",
        amount: 180,
        price: 180,
        message: "Profesjonalny montaż z gwarancją.",
        status: "accepted",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        __demo: true
      }
    },
    {
      order: {
        _id: "demo-provider-order-3",
        status: "funded",
        paymentStatus: "succeeded",
        paidInSystem: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        service: "Malarz",
        serviceDetails: "Malowanie pokoju",
        description: "Malowanie pokoju dziennego (ok. 25m²). Kolor biały, matowy.",
        location: { city: "Wrocław" },
        budget: 800,
        client: { name: "Jan Klient" },
        acceptedOfferId: "demo-provider-offer-3",
        __demo: true,
      },
      offer: {
        _id: "demo-provider-offer-3",
        amount: 750,
        price: 750,
        message: "Malowanie z pełnym przygotowaniem powierzchni. Materiały premium w cenie.",
        status: "accepted",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        __demo: true
      }
    },
    {
      order: {
        _id: "demo-provider-order-4",
        status: "in_progress",
        paymentStatus: "succeeded",
        paidInSystem: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        service: "Elektryk",
        serviceDetails: "Instalacja oświetlenia",
        description: "Instalacja nowego oświetlenia sufitowego w salonie.",
        location: { city: "Poznań" },
        budget: 450,
        client: { name: "Jan Klient" },
        acceptedOfferId: "demo-provider-offer-4",
        __demo: true,
      },
      offer: {
        _id: "demo-provider-offer-4",
        amount: 420,
        price: 420,
        message: "Profesjonalna instalacja z certyfikatem. Dojazd i materiały wliczone.",
        status: "accepted",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        __demo: true
      }
    },
    {
      order: {
        _id: "demo-provider-order-5",
        status: "completed",
        paymentStatus: "succeeded",
        paidInSystem: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        service: "Hydraulik",
        serviceDetails: "Wymiana baterii",
        description: "Wymiana starej baterii umywalkowej na nową.",
        location: { city: "Łódź" },
        budget: 300,
        client: { name: "Jan Klient" },
        acceptedOfferId: "demo-provider-offer-5",
        __demo: true,
      },
      offer: {
        _id: "demo-provider-offer-5",
        amount: 280,
        price: 280,
        message: "Szybka wymiana z gwarancją. Bateria premium w cenie.",
        status: "accepted",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
        __demo: true
      }
    },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        // Pobierz wszystkie zlecenia - filtrowanie po stronie klienta (podobnie jak dla providera)
        const API = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API}/api/orders/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.orders || data.items || []);
          setOrders(Array.isArray(items) ? items : []);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Błąd pobierania zleceń:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []); // Usunięto filter z zależności - pobieramy wszystkie zlecenia raz

  // Pobierz oferty dla providera
  useEffect(() => {
    const fetchOffers = async () => {
      if (user?.role !== 'provider') return;
      try {
        const token = localStorage.getItem('token');
        const data = await getMyOffers({ token });
        setOffers(data || []);
      } catch (error) {
        console.error('Błąd pobierania ofert:', error);
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchOffers();
  }, [user]);

  // Provider: budujemy widok "zleceń" głównie z ofert (bo to jest naturalny pipeline providera)
  const providerItems = (() => {
    if (user?.role !== 'provider') return [];

    const byOrderId = new Map();

    // 1) Oferty providera (najlepsze źródło, bo wiemy, że "złożył ofertę")
    for (const off of (offers || [])) {
      const rawOrder = off?.orderId;
      let order = null;
      let orderId = null;

      if (rawOrder && typeof rawOrder === 'object') {
        // Mamy spopulowany obiekt zlecenia
        orderId = rawOrder._id ? String(rawOrder._id) : null;
        order = rawOrder;
      } else if (typeof rawOrder === 'string') {
        // Backend zwrócił tylko ID – zbuduj minimalny obiekt, żeby pokazać w liście
        orderId = rawOrder;
        order = { _id: rawOrder, status: off.status, createdAt: off.createdAt };
      }

      if (!orderId) continue;
      // jeśli jest wiele ofert do jednego order (nie powinno), bierz najnowszą
      const prev = byOrderId.get(orderId);
      if (!prev || new Date(off.createdAt || 0) > new Date(prev.offer?.createdAt || 0)) {
        byOrderId.set(orderId, { order, offer: off });
      }
    }

    // 2) Fallback: zlecenia gdzie provider już przypisany, ale z jakiegoś powodu oferta nie przyszła
    for (const o of (orders || [])) {
      const orderId = o?._id ? String(o._id) : null;
      if (!orderId) continue;
      if (byOrderId.has(orderId)) continue;
      // tylko jeśli faktycznie to moje przypisane zlecenie (provider)
      const providerId = typeof o.provider === 'string' ? o.provider : o.provider?._id;
      if (providerId && user?._id && String(providerId) === String(user._id)) {
        byOrderId.set(orderId, { order: o, offer: null });
      }
    }

    const arr = Array.from(byOrderId.values());
    // sort: ostatnia aktywność (order updatedAt/createdAt lub offer createdAt)
    arr.sort((a, b) => {
      const ad = new Date(a.order?.updatedAt || a.order?.createdAt || a.offer?.createdAt || 0).getTime();
      const bd = new Date(b.order?.updatedAt || b.order?.createdAt || b.offer?.createdAt || 0).getTime();
      return bd - ad;
    });
    return arr;
  })();

  const getProviderStage = ({ order, offer }) => {
    // "Złożone" = mam ofertę, ale zlecenie nie jest jeszcze zaakceptowane na mnie
    const status = order?.status;
    const acceptedOfferId = order?.acceptedOfferId?._id || order?.acceptedOfferId;
    const myOfferId = offer?._id || offer?.id;
    const isAccepted = acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);

    if (isAccepted) {
      if (status === 'in_progress') return 'in_progress';
      if (status === 'completed' || status === 'rated' || status === 'released' || status === 'done') return 'completed';
      return 'accepted';
    }

    // jeśli order jest już w statusie accepted/in_progress/completed, a moja oferta nie jest accepted → klient wybrał innego
    if (['accepted', 'funded', 'in_progress', 'completed', 'rated', 'released', 'done'].includes(status)) return 'lost';

    // open/collecting_offers
    return 'offered';
  };

  const providerFilteredItems = (() => {
    if (user?.role !== 'provider') return [];
    if (filter === 'all') return providerItems;
    return providerItems.filter((it) => getProviderStage(it) === filter);
  })();

  // Filtrowanie przykładowych zleceń DEMO dla providera
  const filteredDemoProviderOrders = useMemo(() => {
    if (!showDemo || user?.role !== 'provider') return [];
    if (filter === 'all') return DEMO_PROVIDER_ORDERS;
    return DEMO_PROVIDER_ORDERS.filter((item) => {
      const stage = getProviderStage(item);
      return stage === filter;
    });
  }, [showDemo, user?.role, filter]);

  // Funkcja pomocnicza do filtrowania zleceń
  const filterOrderByStatus = (order, filterStatus) => {
    if (filterStatus === 'all') return true;
    
    const status = order.status;
    if (filterStatus === 'open') {
      return status === 'open' || status === 'draft';
    }
    if (filterStatus === 'collecting_offers') {
      return status === 'collecting_offers';
    }
    if (filterStatus === 'accepted') {
      return status === 'accepted';
    }
    if (filterStatus === 'in_progress') {
      return status === 'in_progress' || status === 'funded';
    }
    if (filterStatus === 'completed') {
      return status === 'completed' || status === 'released' || status === 'rated' || status === 'done';
    }
    return true;
  };

  // Filtrowanie zleceń dla klienta
  const clientFilteredOrders = (() => {
    if (user?.role !== 'client') return [];
    if (filter === 'all') return orders;
    
    return orders.filter((order) => filterOrderByStatus(order, filter));
  })();

  // Filtrowanie przykładowych zleceń DEMO
  const filteredDemoOrders = useMemo(() => {
    if (!showDemo || user?.role !== 'client') return [];
    if (filter === 'all') {
      return DEMO_ORDERS;
    }
    return DEMO_ORDERS.filter((order) => filterOrderByStatus(order, filter));
  }, [showDemo, user?.role, filter]);

  const getStatusBadge = (order) => {
    const status = order.status;
    const paymentStatus = order.paymentStatus;
    
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      collecting_offers: 'bg-indigo-100 text-indigo-800',
      accepted: 'bg-orange-100 text-orange-800',
      funded: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-emerald-100 text-emerald-800',
      rated: 'bg-gray-100 text-gray-800',
      released: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      disputed: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      open: 'Otwarte',
      collecting_offers: 'Oferty złożone',
      accepted: 'Oferta zaakceptowana',
      funded: 'Opłacone',
      in_progress: 'W realizacji',
      completed: 'Zakończone',
      rated: 'Ocenione',
      released: 'Wypłacone',
      cancelled: 'Anulowane',
      disputed: 'Spór'
    };
    
    // Jeśli status to accepted ale nie jest opłacone, pokaż dodatkową informację
    let label = labels[status] || status;
    if (status === 'accepted' && paymentStatus !== 'succeeded' && !order.paidInSystem) {
      label = 'Oczekuje na płatność';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const getProviderBadge = ({ order, offer }) => {
    const stage = getProviderStage({ order, offer });
    const map = {
      offered: { text: 'Oferta złożona', cls: 'bg-indigo-100 text-indigo-800' },
      accepted: { text: 'Zaakceptowane', cls: 'bg-green-100 text-green-800' },
      in_progress: { text: 'W realizacji', cls: 'bg-purple-100 text-purple-800' },
      completed: { text: 'Zakończone', cls: 'bg-emerald-100 text-emerald-800' },
      lost: { text: 'Klient wybrał innego', cls: 'bg-red-100 text-red-800' },
    };
    const x = map[stage] || { text: '—', cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${x.cls}`}>{x.text}</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return 'Brak ceny';
    return `${amount} zł`;
  };

  const getOrderTitle = (order) => {
    return order.service || order.description || 'Zlecenie';
  };

  const getOtherPartyName = (order) => {
    if (user?.role === 'client') {
      return order.provider?.name || 'Wykonawca';
    } else {
      return order.client?.name || 'Klient';
    }
  };

  const getOrderLocation = (order) => {
    if (order.location?.address) return order.location.address;
    if (order.location?.city) return order.location.city;
    if (order.location) return order.location;
    return 'Lokalizacja nieznana';
  };

  const getOfferStatusBadge = (offer, order) => {
    // Sprawdź czy oferta została zaakceptowana przez klienta
    const acceptedOfferId = order?.acceptedOfferId?._id || order?.acceptedOfferId;
    const myOfferId = offer._id || offer.id;
    const isAccepted = acceptedOfferId && myOfferId && String(acceptedOfferId) === String(myOfferId);
    
    // Jeśli zlecenie ma zaakceptowaną ofertę, ale to nie moja - klient wybrał innego
    const isRejected = (acceptedOfferId && !isAccepted && order?.status !== 'open' && order?.status !== 'collecting_offers') || offer.status === 'rejected';
    
    // Status oferty z backendu
    const offerStatus = offer.status;
    
    // Określ status na podstawie logiki biznesowej
    let status = offerStatus;
    let text = 'Oczekuje';
    let color = 'bg-blue-100 text-blue-800';
    
    if (isAccepted) {
      // Moja oferta została zaakceptowana
      if (order?.status === 'completed' || order?.status === 'rated') {
        text = 'Zakończone';
        color = 'bg-emerald-100 text-emerald-800';
      } else if (order?.status === 'in_progress') {
        text = 'W realizacji';
        color = 'bg-purple-100 text-purple-800';
      } else if (order?.status === 'funded' || order?.paymentStatus === 'succeeded' || order?.paidInSystem) {
        text = 'Opłacone';
        color = 'bg-green-100 text-green-800';
      } else {
        text = 'Zaakceptowana';
        color = 'bg-green-100 text-green-800';
      }
    } else if (isRejected) {
      // Klient wybrał innego dostawcę - zgodnie z flow
      text = 'Klient wybrał innego';
      color = 'bg-red-100 text-red-800';
    } else if (offerStatus === 'expired') {
      text = 'Wygasła';
      color = 'bg-gray-100 text-gray-800';
    } else if (offerStatus === 'withdrawn' || offerStatus === 'cancelled') {
      text = 'Anulowana';
      color = 'bg-gray-100 text-gray-800';
    } else {
      // Domyślnie - oczekuje
      text = 'Oczekuje';
      color = 'bg-blue-100 text-blue-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <Card title={user?.role === 'provider' ? 'Moje oferty' : 'Moje zlecenia'}>
        {/* Filtry + Zapytaj AI (dla providera) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(user?.role === 'provider'
              ? ['all', 'offered', 'accepted', 'in_progress', 'completed']
              : ['all', 'open', 'collecting_offers', 'accepted', 'in_progress', 'completed']
            ).map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                }}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter === status
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {user?.role === 'provider'
                  ? (status === 'all' ? 'Wszystkie' :
                     status === 'offered' ? 'Złożone' :
                     status === 'accepted' ? 'Zaakceptowane' :
                     status === 'in_progress' ? 'W realizacji' : 'Zakończone')
                  : (status === 'all' ? 'Wszystkie' :
                     status === 'open' ? 'Otwarte' :
                     status === 'collecting_offers' ? 'Oferty złożone' :
                     status === 'accepted' ? 'Oferta zaakceptowana' :
                     status === 'in_progress' ? 'W realizacji' : 'Zakończone')
                }
              </button>
            ))}
          </div>
          {user?.role === 'provider' && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('openProviderAi', { detail: { prefill: 'Jak zwiększyć szansę na wygraną oferty?' } }))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
            >
              <span>✨</span>
              Zapytaj Asystenta AI
            </button>
          )}
        </div>

        {/* Lista zleceń */}
        {(user?.role === 'provider' ? (loading || offersLoading) : loading) ? (
          <div className="text-center py-8 text-gray-500">Ładowanie...</div>
        ) : (user?.role === 'provider' ? providerFilteredItems.length === 0 : clientFilteredOrders.length === 0) && (!showDemo || (user?.role === 'provider' ? filteredDemoProviderOrders.length === 0 : filteredDemoOrders.length === 0)) ? (
          <div className="text-center py-8 text-gray-500">
            <div>{user?.role === 'provider' ? 'Brak ofert do wyświetlenia' : 'Brak zleceń do wyświetlenia'}</div>
            {user?.role === 'client' && (
              <div className="mt-2 text-xs text-gray-400">
                Demo zleceń: {filteredDemoOrders.length} | Pokazuj demo: {showDemo ? 'tak' : 'nie'} | Filtr: {filter}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/create-order"
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                {user?.role === 'provider' ? 'Przejdź do zleceń' : 'Utwórz zlecenie'}
              </Link>
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {showDemo ? "Ukryj przykładowe" : "Pokaż przykładowe"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Przycisk pokaż/ukryj przykładowe (gdy są rzeczywiste zlecenia) */}
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="px-3 py-1 rounded-lg text-sm bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {showDemo ? "Ukryj przykładowe" : "Pokaż przykładowe"}
              </button>
            </div>
            {/* Przykładowe zlecenia DEMO dla klienta (gdy włączone) */}
            {showDemo && filteredDemoOrders.length > 0 && user?.role === 'client' && (
              <>
                {filteredDemoOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-4 border rounded-lg bg-white/70"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-slate-900">{getOrderTitle(order)}</div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            DEMO
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getOtherPartyName(order)} • {order.service}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getOrderLocation(order)} • {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-slate-900">
                          {formatAmount(order.budget || order.amountTotal)}
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(order)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/orders/${order._id}?tab=chat`;
                        }}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Czat
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/orders/${order._id}?tab=details`;
                        }}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Szczegóły
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {/* Przykładowe zlecenia DEMO dla providera (gdy włączone) */}
            {showDemo && filteredDemoProviderOrders.length > 0 && user?.role === 'provider' && (
              <>
                {filteredDemoProviderOrders.map(({ order, offer }) => {
                  const price = offer?.amount || offer?.price || order?.amountTotal || order?.budget;
                  const detailsTab = offer ? 'my_offer' : 'details';
                  return (
                    <div
                      key={order._id}
                      className="p-4 border rounded-lg bg-white/70"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-slate-900">{getOrderTitle(order)}</div>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              DEMO
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {order.client?.name || 'Klient'} • {order.service}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getOrderLocation(order)} • {formatDate(order.createdAt)}
                          </div>
                          {offer && (
                            <div className="text-xs text-indigo-600 mt-1">
                              Twoja oferta: {price} zł
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-slate-900">
                            {formatAmount(price || order.budget)}
                          </div>
                          <div className="mt-1">
                            {getProviderBadge({ order, offer })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/orders/${order._id}?tab=chat`;
                          }}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Czat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/orders/${order._id}?tab=${detailsTab}`;
                          }}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Szczegóły
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {/* Rzeczywiste zlecenia */}
            {(user?.role === 'provider'
              ? providerFilteredItems.map(({ order, offer }) => {
                  const price = offer?.amount || offer?.price || order?.amountTotal || order?.budget;
                  const detailsTab = offer ? 'my_offer' : 'details';
                  return (
                    <div
                      key={order._id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all"
                      onClick={() => (window.location.href = `/orders/${order._id}?tab=${detailsTab}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{getOrderTitle(order)}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {getOtherPartyName(order)} • {order.service}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getOrderLocation(order)} • {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-slate-900">
                            {formatAmount(price)}
                          </div>
                          <div className="mt-1">
                            {getProviderBadge({ order, offer })}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/orders/${order._id}?tab=chat`;
                          }}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Czat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/orders/${order._id}?tab=${detailsTab}`;
                          }}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Szczegóły
                        </button>
                      </div>
                    </div>
                  );
                })
              : clientFilteredOrders.map((order) => {
                  // Określ aktualny etap i jego opis (spójny z OrderProgressBar)
                  const getStageDescription = () => {
                    if (order.status === 'open' || order.status === 'draft') {
                      return 'Otwarte - zlecenie oczekuje na oferty od wykonawców';
                    }
                    if (order.status === 'collecting_offers') {
                      const count = order.offers?.length || 0;
                      return `Oferty złożone - otrzymano ${count} ${count === 1 ? 'oferta' : count < 5 ? 'oferty' : 'ofert'}, wybierz najlepszą`;
                    }
                    if (order.status === 'accepted') {
                      if (order.paymentStatus === 'succeeded' || order.paidInSystem) {
                        return 'Oferta zaakceptowana i opłacona - wykonawca może rozpocząć pracę';
                      }
                      return 'Oferta zaakceptowana - oczekuje na płatność';
                    }
                    if (order.status === 'funded') {
                      return 'Opłacone - środki zabezpieczone w systemie';
                    }
                    if (order.status === 'in_progress') {
                      return 'W realizacji - wykonawca pracuje nad zleceniem';
                    }
                    if (order.status === 'completed') {
                      return 'Zakończone - potwierdź odbiór i oceń wykonawcę';
                    }
                    if (order.status === 'released' || order.status === 'rated') {
                      return 'Zakończone - wszystko gotowe';
                    }
                    return 'Zlecenie w trakcie realizacji';
                  };

                  return (
                    <div 
                      key={order._id} 
                      className="p-4 border rounded-lg bg-white hover:bg-gray-50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-slate-900">{getOrderTitle(order)}</div>
                            {order.serviceDetails && (
                              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                                {order.serviceDetails}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-1 line-clamp-2">
                            {order.description || 'Brak opisu'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {getOtherPartyName(order)} • {order.service} • {getOrderLocation(order)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(order.createdAt)}
                          </div>
                          {/* Opis etapu */}
                          <div className="mt-2 text-xs text-indigo-600 font-medium">
                            {getStageDescription()}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-slate-900">
                            {formatAmount(order.budget || order.amountTotal)}
                          </div>
                          <div className="mt-1">
                            {getStatusBadge(order)}
                          </div>
                        </div>
                      </div>

                      {/* Szybkie akcje */}
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/orders/${order._id}?tab=chat`;
                          }}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Czat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/orders/${order._id}?tab=details`;
                          }}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Szczegóły
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// Billing Tab (Client + Provider)
function BillingTab({ user }) {
  const [billingData, setBillingData] = useState({ transactions: [], stats: {}, loading: true });
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ page, limit: 10 });
        if (filter !== 'all') params.append('status', filter);
        
        const API = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API}/api/revenue/user?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setBillingData({ ...data, loading: false });
        } else {
          setBillingData({ transactions: [], stats: {}, loading: false });
        }
      } catch (error) {
        console.error('Błąd pobierania rozliczeń:', error);
        setBillingData({ transactions: [], stats: {}, loading: false });
      }
    };

    fetchBillingData();
  }, [page, filter]);

  const formatAmount = (amount) => `${amount?.toFixed(2) || '0.00'} zł`;
  const formatDate = (date) => new Date(date).toLocaleDateString('pl-PL');
  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status === 'paid' ? 'Opłacone' : 
         status === 'pending' ? 'Oczekuje' :
         status === 'failed' ? 'Nieudane' : 'Zwrócone'}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      priority_fee: 'Dopłata za priorytet',
      boost_fee: 'Boost oferty',
      commission: 'Prowizja Helpfli',
      subscription: 'Subskrypcja',
      escrow: 'Escrow'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Opłacone">
          <div className="text-2xl font-bold text-green-600">
            {formatAmount(billingData.stats.totalPaid)}
          </div>
          <div className="text-sm text-gray-500">
            {billingData.stats.countPaid} transakcji
          </div>
        </Card>
        <Card title="Oczekujące">
          <div className="text-2xl font-bold text-yellow-600">
            {formatAmount(billingData.stats.totalPending)}
          </div>
          <div className="text-sm text-gray-500">
            {billingData.stats.countPending} transakcji
          </div>
        </Card>
        <Card title="Zwrócone">
          <div className="text-2xl font-bold text-gray-600">
            {formatAmount(billingData.stats.totalRefunded)}
          </div>
          <div className="text-sm text-gray-500">
            Zwroty i anulowania
          </div>
        </Card>
      </div>

      {/* Filtry */}
      <Card title="Historia transakcji">
        <div className="mb-4">
          <div className="flex gap-2">
            {['all', 'paid', 'pending', 'failed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter === status 
                    ? 'bg-indigo-100 text-indigo-700 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Wszystkie' :
                 status === 'paid' ? 'Opłacone' :
                 status === 'pending' ? 'Oczekujące' : 'Nieudane'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista transakcji */}
        {billingData.loading ? (
          <div className="text-center py-8 text-gray-500">Ładowanie...</div>
        ) : billingData.transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Brak transakcji do wyświetlenia
          </div>
        ) : (
          <div className="space-y-3">
            {billingData.transactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">
                      {getTypeLabel(transaction.type)}
                      {transaction.orderId && (
                        <span className="text-gray-500 ml-2">
                          • {transaction.orderId.service || 'Usługa'}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(transaction.createdAt)}
                    {transaction.orderId && (
                      <span className="ml-2">
                        • Zlecenie #{transaction.orderId._id?.slice(-6)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {formatAmount(transaction.amount / 100)}
                  </div>
                  {transaction.orderId && (
                    <Link 
                      to={`/orders/${transaction.orderId._id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Otwórz zlecenie
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginacja */}
        {billingData.pagination && billingData.pagination.pages > 1 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
              >
                Poprzednia
              </button>
              <span className="px-3 py-1 text-sm">
                {page} z {billingData.pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= billingData.pagination.pages}
                className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
              >
                Następna
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Ratings Tab (Both roles)
function RatingsTab({ user }) {
  const [data, setData] = useState({ avg: 0, count: 0, ratings: [] });
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    const id = user?._id || user?.id;
    if (!id) return;
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/ratings/avg/${id}`)
      .then(r => r.json())
      .then(setData)
      .catch(()=>{});
  }, [user]);

  const filtered = data.ratings.filter(r => {
    if (filter === 'positive') return r.rating >= 4;
    if (filter === 'neutral') return r.rating === 3;
    if (filter === 'negative') return r.rating <= 2;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card title="Twoje oceny">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xl">★</span>
            <span className="text-2xl font-bold">{Number(data.avg || 0).toFixed(2)}</span>
            <span className="text-sm text-gray-600">({data.count} ocen)</span>
          </div>
          <div className="flex items-center gap-2">
            {['all','positive','neutral','negative'].map(k => (
              <button key={k} onClick={()=>setFilter(k)} className={`px-3 py-1 rounded-lg text-sm ${filter===k?'bg-gray-100 font-medium':'hover:bg-gray-50'}`}>
                {k==='all'?'Wszystkie':k==='positive'?'Pozytywne':k==='neutral'?'Neutralne':'Negatywne'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 divide-y">
          {filtered.length ? filtered.map((r, i) => (
            <div key={i} className="py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">{'★'.repeat(r.rating)}</span>
                <span className="text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <div className="text-gray-700 mt-1">{r.comment}</div>}
            </div>
          )) : (
            <div className="text-sm text-gray-600">Brak ocen do wyświetlenia.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Favorites Tab (Client only)
function FavoritesTab() {
  return (
    <div className="space-y-4">
      <Card title="Ulubieni wykonawcy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">JK</span>
              </div>
              <div>
                <div className="font-medium">Jan Kowalski</div>
                <div className="text-sm text-gray-500">Hydraulik</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" aria-hidden />
                <span className="text-sm">4.8 (24 opinie)</span>
              </div>
              <button className="text-red-500 hover:text-red-700 p-1" aria-label="Ulubiony"><Heart className="w-4 h-4 shrink-0" aria-hidden /></button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// History Tab (Client only)
function HistoryTab() {
  return (
    <div className="space-y-4">
      <Card title="Historia zleceń">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">Naprawa kranu</div>
              <div className="text-sm text-gray-500">Jan Kowalski • 150 zł</div>
            </div>
            <div className="text-sm text-gray-500">2 dni temu</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Profile Tab (Provider only)
function ProfileTab({ user, fetchMe }) {
  const API = import.meta.env.VITE_API_URL || '';
  const isIndividual = !user?.isB2B && !user?.b2b && !user?.company && user?.kyc?.type !== 'company';
  const canCreateCompany = isIndividual && user?.role === 'provider';

  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [priceNote, setPriceNote] = useState(user?.priceNote || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const avatarUrl = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${API}${user.avatar}`)
    : null;

  useEffect(() => {
    setHeadline(user?.headline || '');
    setBio(user?.bio || '');
    setPriceNote(user?.priceNote || '');
  }, [user?.headline, user?.bio, user?.priceNote]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ headline, bio, priceNote }),
      });
      if (res.ok) {
        setProfileSaved(true);
        fetchMe?.();
        setTimeout(() => setProfileSaved(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Nie udało się zapisać profilu');
      }
    } catch (err) {
      console.error(err);
      alert('Błąd podczas zapisywania profilu');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API}/api/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        fetchMe?.();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Nie udało się zmienić zdjęcia');
      }
    } catch (err) {
      console.error(err);
      alert('Błąd podczas przesyłania zdjęcia');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Profil wykonawcy">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-indigo-600 font-semibold text-xl">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </label>
            {avatarUploading && (
              <span className="text-sm text-gray-500">Przesyłanie...</span>
            )}
            <div>
              <h3 className="text-lg font-semibold">{user?.name || "Wykonawca"}</h3>
              <p className="text-gray-600">{user?.service || "Hydraulik"} • {user?.location || "Warszawa"}</p>
              <div className="flex items-center gap-2 mt-2">
                {user?.verified && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Zweryfikowany</span>
                )}
                {user?.level === 'pro' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">PRO</span>
                )}
                {user?.b2b && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Firma</span>
                )}
                {user?.company && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">Firma</span>
                )}
              </div>
            </div>
          </div>

          {/* Formularz opisu profilu – widoczny dla klienta na stronie profilu */}
          <form onSubmit={handleSaveProfile} className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Opis profilu (widoczny dla klientów)</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nagłówek (max 60 znaków)</label>
              <input
                type="text"
                maxLength={60}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="np. Doświadczony hydraulik z 10-letnim stażem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-xs text-gray-500">{headline.length}/60</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opis o sobie</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Opisz swoją działalność, doświadczenie i podejście do klienta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Informacja o cenach</label>
              <textarea
                rows={2}
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                placeholder="np. Ceny od 80 zł za wizytę. Wycena bezpłatna."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {profileSaving ? 'Zapisywanie...' : 'Zapisz opis'}
              </button>
              {profileSaved && (
                <span className="text-sm text-green-600">Zapisano ✓</span>
              )}
            </div>
          </form>

          {/* Informacja dla osoby fizycznej o możliwości założenia firmy */}
          {canCreateCompany && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-xl">💼</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Załóż firmę (działalność gospodarczą)</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Jako osoba fizyczna nie możesz wystawiać faktur VAT. Założenie firmy pozwoli Ci wystawiać faktury
                    i po rozliczeniu załączać je do zleceń przez platformę.
                  </p>
                  <Link
                    to="/company/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Building2 className="w-4 h-4 shrink-0" aria-hidden />
                    <span>Zarejestruj firmę</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">4.8</div>
              <div className="text-sm text-gray-600">Ocena</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm text-gray-600">Opinie</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-gray-600">Zlecenia</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-gray-600">Lata</div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Zarządzanie usługami">
        <ManageServices />
      </Card>

      <Card title="Portfolio (zdjęcia realizacji)">
        <p className="text-gray-600 mb-4">
          Dodaj zdjęcia wykonanych projektów – klienci zobaczą je na Twoim profilu i łatwiej wybiorą Cię do zlecenia.
        </p>
        <Link
          to={`/provider/${user?._id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Image className="w-4 h-4" aria-hidden />
          <span>Zarządzaj portfolio i dodaj zdjęcia</span>
        </Link>
      </Card>
    </div>
  );
}

// Stats Tab (Provider only)
function StatsTab({ stats }) {
  const packageType = stats?.package || 'PROV_FREE';
  const isFree = packageType === 'PROV_FREE';
  const isStandard = packageType === 'PROV_STD';
  const isPro = packageType === 'PROV_PRO';
  
  if (isFree) {
    return (
      <div className="space-y-4">
        <Card title="Statystyki">
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center"><BarChart2 className="w-14 h-14 text-indigo-500" aria-hidden /></div>
            <h3 className="text-xl font-semibold mb-2">Statystyki niedostępne w planie FREE</h3>
            <p className="text-gray-600 mb-4">
              Widzisz tylko podstawowe liczby. W pakietach <b>Standard</b> i <b>Pro</b> odblokujesz pełny widok wyników, skuteczności i przychodu.
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li>• Standard: rozszerzone statystyki zleceń i skuteczności ofert</li>
              <li>• Pro: pełne analizy, porównanie z rynkiem i raport PDF</li>
            </ul>
            <Link 
              to="/account/subscriptions" 
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Zobacz pakiety PRO dla wykonawców
            </Link>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Podstawowe statystyki (Standard i Pro) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Zlecenia (miesiąc)" value={stats?.basic?.monthlyOffersUsed || "0"} />
        <KPI label="Przychód (miesiąc)" value={`${stats?.basic?.averageOfferPrice || "0"} zł`} />
        <KPI label="Średnia ocena" value={stats?.basic?.successRate || "0"} />
        <KPI label="Wykonane" value={stats?.basic?.wonOffers || "0"} />
      </section>

      {/* Statystyki zaawansowane (tylko Pro) */}
      {isPro && stats?.advanced ? (
        <Card title="Statystyki zaawansowane">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KPI label="Łączne oferty" value={stats.advanced.totalOffers} />
              <KPI label="Zaakceptowane" value={stats.advanced.acceptedOffers} />
              <KPI label="Łączny przychód" value={`${stats.advanced.totalRevenue} zł`} />
              <KPI label="Średnia na ofertę" value={`${stats.advanced.averageRevenuePerOffer} zł`} />
              <KPI label="Konkurencja w regionie" value={stats.advanced.competitionInRegion} />
              <KPI label="Udział w rynku" value={`${stats.advanced.marketShare}%`} />
            </div>
            
            {/* Top usługi w regionie */}
            {stats.advanced.topServices?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Top usługi w regionie</h4>
                <div className="space-y-2">
                  {stats.advanced.topServices.map((service, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{service.service}</span>
                      <span className="font-semibold">{service.count} zleceń</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trend miesięczny */}
            {stats.advanced.monthlyTrend?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Trend miesięczny</h4>
                <div className="space-y-2">
                  {stats.advanced.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{month.month}</span>
                      <span className="font-semibold">{month.offers} ofert, {month.revenue} zł</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Przycisk generowania PDF */}
            <div className="pt-4 border-t">
              <button 
                onClick={() => generatePDF()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                📄 Generuj raport PDF
              </button>
            </div>
          </div>
        </Card>
      ) : isStandard ? (
        <Card title="Statystyki szczegółowe">
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center"><TrendingUp className="w-14 h-14 text-indigo-500" aria-hidden /></div>
            <h3 className="text-xl font-semibold mb-2">Statystyki zaawansowane w pakiecie Pro</h3>
            <p className="text-gray-600 mb-4">
              Uzyskaj dostęp do szczegółowych analiz, porównań z konkurencją i raportów PDF
            </p>
            <Link 
              to="/account/subscriptions" 
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Upgrade do Pro
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

// Funkcja do generowania PDF
function generatePDF() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Musisz być zalogowany!');
    return;
  }
  
  // Pobierz raport PDF
  fetch(`${import.meta.env.VITE_API_URL || ''}/api/provider-stats/pdf`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Błąd generowania raportu');
    }
    return response.blob();
  })
  .then(blob => {
    // Utwórz link do pobrania
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raport_providera_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  })
  .catch(error => {
    console.error('Błąd generowania PDF:', error);
    alert('Błąd generowania raportu: ' + error.message);
  });
}

// KYC Tab (Provider only)
function KycTab({ user }) {
  return (
    <div className="space-y-4">
      <Card title="Weryfikacja KYC">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
              <span>Status:</span>
              <KycBadge status={user?.kyc?.status} />
            </div>
            
            {user?.kyc?.status !== 'verified' && (
              <div className="space-y-3">
              <Link 
                to="/kyc" 
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {user?.kyc?.status === 'not_started' ? 'Rozpocznij weryfikację' : 
                   user?.kyc?.status === 'in_progress' ? 'Kontynuuj weryfikację' :
                   user?.kyc?.status === 'submitted' ? 'Sprawdź status' :
                   user?.kyc?.status === 'rejected' ? 'Popraw i wyślij ponownie' : 'Weryfikuj konto'}
              </Link>
                
                {user?.kyc?.rejectionReason && (
                  <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded">
                    <strong>Powód odrzucenia:</strong> {user.kyc.rejectionReason}
                  </div>
                )}
              </div>
            )}
            
          <div className="text-sm text-gray-600">
              Weryfikacja KYC jest wymagana, aby móc akceptować zlecenia i korzystać z funkcji premium.
            </div>
          </div>
      </Card>
    </div>
  );
}


// Payments Tab (Provider only - Stripe Connect + Preferencje płatności)
function PaymentsTab({ user, fetchMe }) {
  const [loading, setLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [paymentPreference, setPaymentPreference] = useState(user?.providerPaymentPreference || 'system');
  const [savingPaymentPref, setSavingPaymentPref] = useState(false);

  useEffect(() => {
    if (user?.stripeAccountId) {
      setStripeStatus({
        accountId: user.stripeAccountId,
        chargesEnabled: user.stripeConnectStatus?.chargesEnabled || false,
        payoutsEnabled: user.stripeConnectStatus?.payoutsEnabled || false
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.providerPaymentPreference) {
      setPaymentPreference(user.providerPaymentPreference);
    }
  }, [user]);

  const handleSavePaymentPreference = async () => {
    try {
      setSavingPaymentPref(true);
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ providerPaymentPreference: paymentPreference })
      });
      if (res.ok) {
        if (typeof fetchMe === 'function') fetchMe();
        alert('Preferencje płatności zostały zapisane');
      } else {
        const error = await res.json();
        alert(`Błąd: ${error.message || 'Nie udało się zapisać preferencji'}`);
      }
    } catch (error) {
      console.error('Błąd zapisywania preferencji płatności:', error);
      alert('Błąd zapisywania preferencji płatności');
    } finally {
      setSavingPaymentPref(false);
    }
  };

  const handleCreateStripeAccount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/connect/create-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStripeStatus({
          accountId: data.stripeAccountId,
          chargesEnabled: data.status?.chargesEnabled || false,
          payoutsEnabled: data.status?.payoutsEnabled || false
        });
        alert('Konto Stripe zostało utworzone! Teraz musisz ukończyć onboarding.');
        // Otwórz link do onboardingu Stripe
        handleCompleteOnboarding();
      } else {
        const error = await res.json();
        alert(`Błąd: ${error.message || 'Nie udało się utworzyć konta Stripe'}`);
      }
    } catch (error) {
      console.error('Błąd tworzenia konta Stripe:', error);
      alert('Błąd tworzenia konta Stripe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/connect/account-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await res.json();
        alert(`Błąd: ${error.message || 'Nie udało się utworzyć linku do onboardingu'}`);
      }
    } catch (error) {
      console.error('Błąd pobierania linku onboarding:', error);
      alert('Błąd pobierania linku onboarding: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preferencje płatności – jakie zlecenia akceptuję */}
      <Card title="Preferencje płatności">
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Wybierz, jakie zlecenia chcesz akceptować w zależności od metody płatności:
          </div>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="radio"
                name="providerPaymentPreference"
                value="system"
                checked={paymentPreference === 'system'}
                onChange={(e) => setPaymentPreference(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden />
                  <span>Tylko płatność przez Helpfli (z gwarancją)</span>
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Będziesz widział tylko zlecenia z płatnością przez system Helpfli. Klienci otrzymają gwarancję i możliwość sporu.
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="radio"
                name="providerPaymentPreference"
                value="external"
                checked={paymentPreference === 'external'}
                onChange={(e) => setPaymentPreference(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 shrink-0 text-slate-600" aria-hidden />
                  <span>Tylko płatność poza systemem</span>
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Będziesz widział tylko zlecenia z płatnością bezpośrednią. Brak gwarancji Helpfli, ale szybsza realizacja.
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="radio"
                name="providerPaymentPreference"
                value="both"
                checked={paymentPreference === 'both'}
                onChange={(e) => setPaymentPreference(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-600" aria-hidden />
                  <CreditCard className="w-5 h-5 shrink-0 text-slate-600" aria-hidden />
                  <span>Oba – Helpfli i poza systemem</span>
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Będziesz widział wszystkie zlecenia – zarówno z płatnością przez Helpfli, jak i poza systemem.
                </div>
              </div>
            </label>
          </div>
          <button
            onClick={handleSavePaymentPreference}
            disabled={savingPaymentPref || paymentPreference === (user?.providerPaymentPreference || 'system')}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingPaymentPref ? 'Zapisywanie...' : 'Zapisz preferencje'}
          </button>
        </div>
      </Card>

      <Card title="Płatności Stripe">
        <div className="space-y-4">
          {!stripeStatus ? (
            <div>
              <p className="text-gray-600 mb-4">
                Połącz swoje konto Stripe, aby otrzymywać wypłaty za wykonane zlecenia.
              </p>
              <button
                onClick={handleCreateStripeAccount}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Tworzenie konta...' : 'Utwórz konto Stripe'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 font-semibold">✓ Konto Stripe połączone</span>
                </div>
                <div className="text-sm text-gray-600">
                  ID konta: {stripeStatus.accountId}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Płatności włączone:</span>
                  <span className={`font-semibold ${stripeStatus.chargesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {stripeStatus.chargesEnabled ? 'Tak' : 'Nie'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Wypłaty włączone:</span>
                  <span className={`font-semibold ${stripeStatus.payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {stripeStatus.payoutsEnabled ? 'Tak' : 'Nie'}
                  </span>
                </div>
              </div>

              {(!stripeStatus.chargesEnabled || !stripeStatus.payoutsEnabled) && (
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Ładowanie...' : 'Ukończ onboarding Stripe'}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Settings Tab
// Wszystkie kanały włączone – używane przy "Włącz powiadomienia"
const ALL_NOTIFICATION_PREFERENCES = {
  subscriptionExpiry: { email: true, sms: true, push: true, daysBefore: [7, 3, 1] },
  promoExpiring: { email: true, sms: true, push: true },
  orderUpdates: { email: true, sms: true, push: true },
  promotions: { email: true, sms: true, push: true },
  chatMessages: { email: true, sms: true, push: true },
  systemAlerts: { email: true, sms: true, push: true },
};

function SettingsTab({ user, pushStatus, enablePush, showChangePasswordModal, setShowChangePasswordModal, showTwoFactorAuth, setShowTwoFactorAuth, fetchMe }) {
  const [accountForm, setAccountForm] = useState({ name: '', phone: '' });
  const [savingAccount, setSavingAccount] = useState(false);
  const [preferencesReloadTrigger, setPreferencesReloadTrigger] = useState(0);
  const [notificationDetailsExpanded, setNotificationDetailsExpanded] = useState(false);
  const [billingForm, setBillingForm] = useState({
    companyName: '',
    nip: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Polska',
  });
  const [savingBilling, setSavingBilling] = useState(false);
  const [wystawiamFaktury, setWystawiamFaktury] = useState(!!(user?.isB2B || user?.b2b));
  const [savingB2B, setSavingB2B] = useState(false);

  // Inicjalizuj dane konta z user
  useEffect(() => {
    setAccountForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
  }, [user?.name, user?.phone]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    try {
      setSavingAccount(true);
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: accountForm.name.trim(), phone: accountForm.phone.trim() || undefined })
      });
      if (res.ok) {
        if (typeof fetchMe === 'function') fetchMe();
        alert('Dane konta zostały zapisane');
      } else {
        const err = await res.json();
        alert(`Błąd: ${err.message || 'Nie udało się zapisać'}`);
      }
    } catch (err) {
      console.error('Błąd zapisywania danych konta:', err);
      alert('Błąd zapisywania danych');
    } finally {
      setSavingAccount(false);
    }
  };

  // Synchronizuj wystawiamFaktury z user
  useEffect(() => {
    setWystawiamFaktury(!!(user?.isB2B || user?.b2b));
  }, [user?.isB2B, user?.b2b]);

  const handleToggleB2B = async (checked) => {
    if (user?.role !== 'provider' || user?.company) return;
    try {
      setSavingB2B(true);
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isB2B: checked, b2b: checked })
      });
      if (res.ok) {
        if (typeof fetchMe === 'function') fetchMe();
        setWystawiamFaktury(checked);
        alert(checked ? 'Włączono wystawianie faktur' : 'Wyłączono wystawianie faktur');
      } else {
        const err = await res.json();
        alert(`Błąd: ${err.message || 'Nie udało się zapisać'}`);
      }
    } catch (err) {
      console.error('Błąd zapisywania:', err);
      alert('Błąd zapisywania');
    } finally {
      setSavingB2B(false);
    }
  };

  // Inicjalizuj formularz danych do faktur z user.billing
  useEffect(() => {
    const b = user?.billing || {};
    setBillingForm({
      companyName: b.companyName || '',
      nip: b.nip || '',
      street: b.street || '',
      city: b.city || '',
      postalCode: b.postalCode || '',
      country: b.country || 'Polska',
    });
  }, [user?.billing]);

  const handleEnableAllNotifications = async () => {
    await enablePush();
    try {
      await api('/api/notifications/preferences', {
        method: 'PUT',
        body: { preferences: ALL_NOTIFICATION_PREFERENCES },
      });
      setPreferencesReloadTrigger((t) => t + 1);
    } catch (err) {
      console.error('Błąd zapisywania preferencji powiadomień:', err);
    }
  };

  const handleSaveBilling = async (e) => {
    e.preventDefault();
    try {
      setSavingBilling(true);
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/users/me/billing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerType: 'company',
          wantInvoice: true,
          companyName: billingForm.companyName,
          nip: billingForm.nip.replace(/\s/g, ''),
          street: billingForm.street,
          city: billingForm.city,
          postalCode: billingForm.postalCode,
          country: billingForm.country || 'Polska',
        })
      });
      if (res.ok) {
        if (typeof fetchMe === 'function') fetchMe();
        alert('Dane do faktur zostały zapisane');
      } else {
        const err = await res.json();
        alert(`Błąd: ${err.message || 'Nie udało się zapisać'}`);
      }
    } catch (err) {
      console.error('Błąd zapisywania danych do faktur:', err);
      alert('Błąd zapisywania danych');
    } finally {
      setSavingBilling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dane konta - dla providera i klienta */}
      <Card title="Dane konta">
        <p className="text-sm text-gray-600 mb-4">
          Imię i numer telefonu używane do kontaktu przy zleceniach.
        </p>
        <form onSubmit={handleSaveAccount} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwa</label>
            <input
              type="text"
              placeholder="np. Jan Kowalski"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={accountForm.name}
              onChange={(e) => setAccountForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numer telefonu</label>
            <input
              type="tel"
              placeholder="np. 500 123 456"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={accountForm.phone}
              onChange={(e) => setAccountForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={savingAccount}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingAccount ? 'Zapisywanie...' : 'Zapisz dane konta'}
          </button>
        </form>
      </Card>

      {/* Wystawiam faktury – tylko dla providera bez firmy (solo) */}
      {user?.role === 'provider' && !user?.company && (
        <Card title="Wystawiam faktury">
          <p className="text-sm text-gray-600 mb-4">
            Zaznacz, jeśli wystawiasz faktury i masz dane firmy/działalności. Możesz w dowolnym momencie odznaczyć.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wystawiamFaktury}
              onChange={(e) => handleToggleB2B(e.target.checked)}
              disabled={savingB2B}
              className="w-5 h-5 text-indigo-600 rounded"
            />
            <span className="font-medium text-gray-900">Wystawiam faktury i mam dane firmy do faktur</span>
          </label>
          {!wystawiamFaktury && (
            <p className="text-sm text-gray-600 mt-2">
              Odznaczono. Nie będziesz widoczny w filtrach „Firma” i nie wystawisz faktur. Możesz włączyć ponownie w dowolnym momencie.
            </p>
          )}
          {savingB2B && <p className="text-sm text-gray-500 mt-2">Zapisywanie...</p>}
        </Card>
      )}

      {/* Dane do faktur - dla providera z "wystawiam faktury" */}
      {user?.role === 'provider' && (user?.isB2B || user?.b2b) && (
        <Card title="Dane do faktur">
          {user?.role === 'provider' && !user?.company && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-700">Wystawiam faktury i mam dane firmy</span>
              <button
                type="button"
                onClick={() => handleToggleB2B(false)}
                disabled={savingB2B}
                className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
              >
                {savingB2B ? 'Zapisywanie...' : 'Odznacz'}
              </button>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-4">
            Dane firmy / działalności wyświetlane na fakturach. Możesz je edytować w dowolnym momencie.
          </p>
          <form onSubmit={handleSaveBilling} className="space-y-3">
            <input
              type="text"
              placeholder="Nazwa firmy / działalności *"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={billingForm.companyName}
              onChange={(e) => setBillingForm(f => ({ ...f, companyName: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="NIP * (10 cyfr)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={billingForm.nip}
              onChange={(e) => setBillingForm(f => ({ ...f, nip: e.target.value }))}
              maxLength={13}
              required
            />
            <input
              type="text"
              placeholder="Ulica i numer *"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={billingForm.street}
              onChange={(e) => setBillingForm(f => ({ ...f, street: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Kod pocztowy *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={billingForm.postalCode}
                onChange={(e) => setBillingForm(f => ({ ...f, postalCode: e.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Miasto *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={billingForm.city}
                onChange={(e) => setBillingForm(f => ({ ...f, city: e.target.value }))}
                required
              />
            </div>
            <input
              type="text"
              placeholder="Kraj"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={billingForm.country}
              onChange={(e) => setBillingForm(f => ({ ...f, country: e.target.value }))}
            />
            <button
              type="submit"
              disabled={savingBilling}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingBilling ? 'Zapisywanie...' : 'Zapisz dane do faktur'}
            </button>
          </form>
        </Card>
      )}

      <Card title="Powiadomienia">
        <div className="space-y-4">
          <button
            onClick={handleEnableAllNotifications}
            className="rounded-xl px-4 py-3 border hover:bg-gray-50 transition-colors"
            disabled={pushStatus === "Włączanie..."}
          >
            Włącz powiadomienia
          </button>

          {pushStatus && (
            <div className="text-sm">
              {pushStatus}
            </div>
          )}

          <div className="text-sm text-gray-600">
            Otrzymasz powiadomienia o nowych ofertach i akceptacjach. Wszystkie kanały (email, SMS, push) zostaną włączone – szczegóły możesz dostosować poniżej.
          </div>

          <button
            type="button"
            onClick={() => setNotificationDetailsExpanded((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {notificationDetailsExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ukryj szczegóły
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Dostosuj powiadomienia (email, SMS, push)
              </>
            )}
          </button>

          {notificationDetailsExpanded && (
            <div className="pt-4 border-t">
              <NotificationSettings reloadTrigger={preferencesReloadTrigger} />
            </div>
          )}
        </div>
      </Card>

      <Card title="Bezpieczeństwo">
        <div className="space-y-3">
          <button 
            onClick={() => setShowChangePasswordModal(true)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">Zmień hasło</div>
            <div className="text-sm text-gray-600">Zaktualizuj swoje hasło</div>
          </button>
          <button 
            onClick={() => setShowTwoFactorAuth(true)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">Dwuskładnikowa autoryzacja</div>
            <div className="text-sm text-gray-600">Dodaj dodatkową warstwę bezpieczeństwa</div>
          </button>
        </div>
      </Card>

      <ChangePasswordModal 
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        requiresPasswordChange={user?.requiresPasswordChange || false}
      />

      {showTwoFactorAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Dwuskładnikowa autoryzacja</h2>
              <button
                onClick={() => setShowTwoFactorAuth(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <TwoFactorAuth />
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable components
function KPI({ label, value }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
