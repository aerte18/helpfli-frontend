import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart2, ClipboardList, Wallet, Heart, Star, History, Gift, CreditCard, Settings, Lock, User, Users, TrendingUp, Building2, Link2, BadgeCheck, ShieldCheck, Camera, Image, ChevronDown, ChevronUp, LogOut, Clock, Trash2 } from "lucide-react";
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
import CompanyTab from "./CompanyTab";
import NotificationSettings from "../components/NotificationSettings";
import TwoFactorAuth from "../components/TwoFactorAuth";
import ChangePasswordModal from "../components/ChangePasswordModal";
import OrderStatsDashboard from "../components/OrderStatsDashboard";
import WelcomeCreditBanner from "../components/WelcomeCreditBanner";
import ProviderGrowthBenefitsPanel from "../components/ProviderGrowthBenefitsPanel";
import {
  getClientOrderPresentation,
  getProviderOrderPresentation,
  getProviderStageKey,
} from "../utils/orderFlowLabels";
import { getStripeConnectStatus } from "../api/payments";

function useAuthToken() {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

export default function Account() {
  const token = useAuthToken();
  const { user, fetchMe, logout } = useAuth();
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
        const res = await fetch(apiUrl(`/api/provider-stats`), {
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

  // Po powrocie ze Stripe Connect: odśwież status konta w DB i w sesji użytkownika
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("stripe_connected") !== "1") return;
    if (!user || user.role !== "provider" || !user.stripeAccountId) return;

    let cancelled = false;
    (async () => {
      try {
        await getStripeConnectStatus();
        if (!cancelled) await fetchMe?.();
      } catch (e) {
        console.error("stripe_connected: sync Connect status failed", e);
      } finally {
        if (cancelled) return;
        params.delete("stripe_connected");
        const search = params.toString();
        navigate({ pathname: location.pathname, search: search ? `?${search}` : "" }, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.search, user?.role, user?.stripeAccountId, fetchMe, navigate, location.pathname]);

  // Sync tab with URL (?tab=x)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl === 'schedule') {
      const q = new URLSearchParams(location.search);
      q.set('tab', 'overview');
      navigate({ search: q.toString() }, { replace: true });
      setActiveTab('overview');
      return;
    }
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
    { id: "company", label: "Zespół", icon: Building2 },
    { id: "referrals", label: "Polecenia", icon: Gift },
    { id: "integrations", label: "Integracje", icon: Link2 },
    { id: "payments", label: "Płatności", icon: CreditCard },
    { id: "kyc", label: "Weryfikacja", icon: BadgeCheck },
    { id: "subscriptions", label: "Subskrypcje", icon: CreditCard },
    { id: "settings", label: "Ustawienia", icon: Settings },
    { id: "privacy", label: "Prywatność", icon: Lock }
  ];

  const tabs = user?.role === 'provider' ? providerTabs : clientTabs;
  const subscriptionsAudience = user?.company ? 'business' : (user?.role === 'provider' ? 'provider' : 'client');

  const isTabActive = (tab) => {
    if (tab.id === 'subscriptions') return location.pathname === '/account/subscriptions';
    return activeTab === tab.id;
  };

  const selectTab = (tab) => {
    if (tab.id === 'subscriptions') {
      navigate(`/account/subscriptions?audience=${subscriptionsAudience}`);
      return;
    }
    setActiveTab(tab.id);
    const q = new URLSearchParams(location.search);
    q.set('tab', tab.id);
    navigate({ search: q.toString() }, { replace: true });
  };

  const pillClass = (active) =>
    `shrink-0 snap-start inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium border transition-colors ${
      active
        ? 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-sm'
        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
    }`;

  const navItemClass = (active) =>
    `w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 ${
      active ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-50'
    }`;

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      {/* Mobile: kompakt — karta profilu + poziomy pasek zakładek (przewijany) */}
      <div className="lg:hidden space-y-3 mb-4">
        <div className="flex items-center justify-between gap-3 bg-white rounded-2xl shadow border border-gray-100 p-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-indigo-600 font-semibold text-lg">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{user?.name || "Użytkownik"}</div>
              <div className="text-xs text-gray-500 capitalize truncate">{user?.role}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="shrink-0 text-sm font-medium text-red-600 px-3 py-2 rounded-xl hover:bg-red-50"
          >
            Wyloguj
          </button>
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]"
          role="tablist"
          aria-label="Sekcje konta"
        >
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            if (tab.id === 'subscriptions') {
              return (
                <Link
                  key={tab.id}
                  to={`/account/subscriptions?audience=${subscriptionsAudience}`}
                  className={pillClass(active)}
                  role="tab"
                  aria-selected={active}
                >
                  {tab.icon && <tab.icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />}
                  {tab.label}
                </Link>
              );
            }
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tab)}
                className={pillClass(active)}
              >
                {tab.icon && <tab.icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
        {/* Left nav — tylko desktop */}
        <aside className="hidden lg:block bg-white rounded-2xl shadow">
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
          <nav className="px-2 pb-3 space-y-1" aria-label="Sekcje konta">
            {tabs.map((tab) =>
              tab.id === 'subscriptions' ? (
                <Link
                  key={tab.id}
                  to={`/account/subscriptions?audience=${subscriptionsAudience}`}
                  className={navItemClass(isTabActive(tab))}
                >
                  {tab.icon && <tab.icon className="w-5 h-5 shrink-0" aria-hidden />}
                  {tab.label}
                </Link>
              ) : (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab)}
                  className={navItemClass(isTabActive(tab))}
                >
                  {tab.icon && <tab.icon className="w-5 h-5 shrink-0" aria-hidden />}
                  {tab.label}
                </button>
              )
            )}
          </nav>
          <div className="px-2 pb-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 text-red-600 hover:bg-red-50 font-medium"
            >
              <LogOut className="w-5 h-5 shrink-0" aria-hidden />
              Wyloguj się
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold sm:text-xl lg:text-2xl truncate">
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
          {activeTab === "history" && user?.role === 'client' && <HistoryTab user={user} />}
          {activeTab === "profile" && user?.role === 'provider' && <ProfileTab user={user} fetchMe={fetchMe} />}
          {activeTab === "stats" && user?.role === 'provider' && <StatsTab stats={stats} />}
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
              logout={logout}
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
      {(user?.role === 'client' || user?.role === 'provider') && (
        <ProviderGrowthBenefitsPanel />
      )}
      {user?.role === 'client' && <WelcomeCreditBanner variant="compact" />}
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
              <Link to="/company/join" className="block w-full p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                <div className="font-medium flex items-center gap-2"><Users className="w-4 h-4 shrink-0" aria-hidden /> Dołącz do zespołu</div>
                <div className="text-sm text-gray-600">Wyślij prośbę do firmy wieloosobowej lub poczekaj na zaproszenie</div>
              </Link>
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
  /** Przykładowe zlecenia/oferty tylko w dev (Vite); na produkcji wyłączone. */
  const [showDemo, setShowDemo] = useState(false);

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
      client: { name: "Klient" },
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
      client: { name: "Klient" },
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
            name: "Wykonawca A",
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
      client: { name: "Klient" },
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
      client: { name: "Klient" },
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
      client: { name: "Klient" },
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
      client: { name: "Klient" },
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
        client: { name: "Klient" },
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
        client: { name: "Klient" },
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
        client: { name: "Klient" },
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
        client: { name: "Klient" },
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
        client: { name: "Klient" },
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
        const res = await fetch(apiUrl(`/api/orders/my?limit=50`), {
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

  const getProviderStage = ({ order, offer }) => getProviderStageKey({ order, offer });

  const providerFilteredItems = (() => {
    if (user?.role !== 'provider') return [];
    if (filter === 'all') return providerItems;
    return providerItems.filter((it) => getProviderStage(it) === filter);
  })();

  // Filtrowanie przykładowych zleceń DEMO dla providera (tylko dev)
  const filteredDemoProviderOrders = useMemo(() => {
    if (!import.meta.env.DEV || !showDemo || user?.role !== 'provider') return [];
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

  // Filtrowanie przykładowych zleceń DEMO (tylko dev)
  const filteredDemoOrders = useMemo(() => {
    if (!import.meta.env.DEV || !showDemo || user?.role !== 'client') return [];
    if (filter === 'all') {
      return DEMO_ORDERS;
    }
    return DEMO_ORDERS.filter((order) => filterOrderByStatus(order, filter));
  }, [showDemo, user?.role, filter]);

  const getStatusBadge = (order) => {
    const p = getClientOrderPresentation(order);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.badgeClass}`}>
        {p.label}
      </span>
    );
  };

  const getProviderBadge = ({ order, offer }) => {
    const p = getProviderOrderPresentation({ order, offer });
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.badgeClass}`}>{p.label}</span>;
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

  const getExpiryParts = (order) => {
    if (!order?.expiresAt) return null;
    const h = Number(order?.hoursUntilExpiry);
    const m = Number(order?.minutesUntilExpiry);
    if (Number.isFinite(h) && Number.isFinite(m) && h >= 0 && m >= 0) {
      return { hours: h, minutes: m };
    }
    const diffMs = new Date(order.expiresAt).getTime() - Date.now();
    if (!Number.isFinite(diffMs) || diffMs <= 0) return { hours: 0, minutes: 0 };
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  };

  const formatTimeUntilExpiry = (order) => {
    if (!order?.expiresAt) return null;
    if (order?.isExpired) return "Wygasło";
    const p = getExpiryParts(order);
    if (!p) return "Aktywne";
    if (p.hours >= 24) {
      const d = Math.floor(p.hours / 24);
      const h = p.hours % 24;
      return `${d}d ${h}h`;
    }
    return `${p.hours}h ${p.minutes}m`;
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
        ) : (user?.role === 'provider' ? providerFilteredItems.length === 0 : clientFilteredOrders.length === 0) && (!import.meta.env.DEV || !showDemo || (user?.role === 'provider' ? filteredDemoProviderOrders.length === 0 : filteredDemoOrders.length === 0)) ? (
          <div className="text-center py-8 text-gray-500">
            <div>{user?.role === 'provider' ? 'Brak ofert do wyświetlenia' : 'Brak zleceń do wyświetlenia'}</div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/create-order"
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                {user?.role === 'provider' ? 'Przejdź do zleceń' : 'Utwórz zlecenie'}
              </Link>
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={() => setShowDemo((v) => !v)}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {showDemo ? "Ukryj przykładowe" : "Pokaż przykładowe"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Dev: przycisk pokaż/ukryj przykładowe (gdy są rzeczywiste zlecenia) */}
            {import.meta.env.DEV && (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDemo((v) => !v)}
                  className="px-3 py-1 rounded-lg text-sm bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {showDemo ? "Ukryj przykładowe" : "Pokaż przykładowe"}
                </button>
              </div>
            )}
            {/* Przykładowe zlecenia DEMO dla klienta (dev + włączone) */}
            {import.meta.env.DEV && showDemo && filteredDemoOrders.length > 0 && user?.role === 'client' && (
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
            {/* Przykładowe zlecenia DEMO dla providera (dev + włączone) */}
            {import.meta.env.DEV && showDemo && filteredDemoProviderOrders.length > 0 && user?.role === 'provider' && (
              <>
                {filteredDemoProviderOrders.map(({ order, offer }) => {
                  const price = offer?.amount || offer?.price || order?.amountTotal || order?.budget;
                  const detailsTab = offer ? 'my_offer' : 'details';
                  const providerPresentation = getProviderOrderPresentation({ order, offer });
                  const chatHrefDemo = `/orders/${order._id}?tab=chat`;
                  const secondaryDetailsHrefDemo = `/orders/${order._id}?tab=${detailsTab}`;
                  const primaryHrefDemo = providerPresentation.nextStepHref;
                  const showSecondaryChatDemo = primaryHrefDemo !== chatHrefDemo;
                  const showSecondaryDetailsDemo = primaryHrefDemo !== secondaryDetailsHrefDemo;
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
                          <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                            <div className="text-xs font-semibold text-indigo-900">Następny krok: {providerPresentation.nextStepLabel}</div>
                            <div className="text-xs text-indigo-700 mt-0.5">{providerPresentation.nextStepHint}</div>
                          </div>
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
                            window.location.href = providerPresentation.nextStepHref;
                          }}
                          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          {providerPresentation.nextStepCta}
                        </button>
                        {showSecondaryChatDemo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = chatHrefDemo;
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Czat
                          </button>
                        )}
                        {showSecondaryDetailsDemo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = secondaryDetailsHrefDemo;
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Szczegóły
                          </button>
                        )}
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
                  const providerPresentation = getProviderOrderPresentation({ order, offer });
                  const chatHref = `/orders/${order._id}?tab=chat`;
                  const secondaryDetailsHref = `/orders/${order._id}?tab=${detailsTab}`;
                  const primaryHref = providerPresentation.nextStepHref;
                  const showSecondaryChat = primaryHref !== chatHref;
                  const showSecondaryDetails = primaryHref !== secondaryDetailsHref;
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
                          <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                            <div className="text-xs font-semibold text-indigo-900">Następny krok: {providerPresentation.nextStepLabel}</div>
                            <div className="text-xs text-indigo-700 mt-0.5">{providerPresentation.nextStepHint}</div>
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
                            window.location.href = providerPresentation.nextStepHref;
                          }}
                          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          {providerPresentation.nextStepCta}
                        </button>
                        {showSecondaryChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = chatHref;
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Czat
                          </button>
                        )}
                        {showSecondaryDetails && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = secondaryDetailsHref;
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Szczegóły
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              : clientFilteredOrders.map((order) => {
                  const presentation = getClientOrderPresentation(order);
                  const chatHref = `/orders/${order._id}?tab=chat`;
                  const detailsHref = `/orders/${order._id}?tab=details`;
                  const primaryHref = presentation.nextStepHref;
                  const showSecondaryChat = primaryHref !== chatHref;
                  const showSecondaryDetails = primaryHref !== detailsHref;

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
                            {presentation.stageDescription}
                          </div>
                          <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                            <div className="text-xs font-semibold text-indigo-900">Następny krok: {presentation.nextStepLabel}</div>
                            <div className="text-xs text-indigo-700 mt-0.5">{presentation.nextStepHint}</div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-slate-900">
                            {formatAmount(order.budget || order.amountTotal)}
                          </div>
                          <div className="mt-1">
                            {getStatusBadge(order)}
                          </div>
                          {order.expiresAt && (order.status === 'open' || order.status === 'collecting_offers') && (
                            <div
                              className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${
                                order.isExpired
                                  ? 'bg-red-100 text-red-700'
                                  : (() => {
                                      const p = getExpiryParts(order);
                                      return p && p.hours < 6 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
                                    })()
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTimeUntilExpiry(order)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Szybkie akcje */}
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = presentation.nextStepHref;
                          }}
                          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          {presentation.nextStepCta}
                        </button>
                        {showSecondaryChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = chatHref;
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Czat
                          </button>
                        )}
                        {showSecondaryDetails && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = detailsHref;
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Szczegóły
                          </button>
                        )}
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
        const res = await fetch(apiUrl(`/api/revenue/user?${params}`), {
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
      {user?.role === 'client' && <WelcomeCreditBanner variant="compact" />}
      {/* Statystyki */}
      <div className={`grid grid-cols-1 gap-4 ${user?.role === 'provider' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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
        {user?.role === 'provider' && (billingData.stats.foundingSavingsPln > 0 || billingData.stats.foundingOrdersCount > 0) && (
          <Card title="Oszczędność — Pierwszy wykonawca">
            <div className="text-2xl font-bold text-amber-700">
              {formatAmount(billingData.stats.foundingSavingsPln)}
            </div>
            <div className="text-sm text-gray-500">
              Prowizja niższa o {billingData.stats.foundingOrdersCount} zlec.
            </div>
            <p className="text-xs text-amber-800/90 mt-2 leading-snug">
              Ulga z programu Pierwszy wykonawca (różnica między standardową prowizją a faktycznie pobraną).
            </p>
          </Card>
        )}
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
                  {transaction.foundingDiscountPln > 0 && (
                    <div className="text-xs text-amber-700 font-medium mt-0.5">
                      Ulga Pierwszy wykonawca: −{transaction.foundingDiscountPln.toFixed(2)} zł prowizji
                    </div>
                  )}
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
    fetch(apiUrl(`/api/ratings/avg/${id}`))
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

// Favorites Tab (Client only) — brak podłączonego API; bez mocków danych testowych
function FavoritesTab() {
  return (
    <div className="space-y-4">
      <Card title="Ulubieni wykonawcy">
        <p className="text-sm text-gray-600">
          Nie masz jeszcze zapisanych ulubionych wykonawców. Gdy dodasz ich z profilu lub listy wyników, pojawią się tutaj.
        </p>
      </Card>
    </div>
  );
}

// History Tab (Client only)
function HistoryTab({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const archivedStatuses = new Set([
    "completed",
    "rated",
    "released",
    "done",
    "cancelled",
    "disputed",
  ]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/orders/my?limit=100`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setOrders([]);
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.orders || data.items || []);
        const onlyClientOrders = (Array.isArray(items) ? items : []).filter((o) => {
          const c = o?.client;
          const cid = c && typeof c === "object" ? c._id : c;
          return cid ? String(cid) === String(user?._id || user?.id) : true;
        });
        const historyOnly = onlyClientOrders.filter((o) => archivedStatuses.has(String(o?.status || "")));
        setOrders(historyOnly);
      } catch (e) {
        console.error("HISTORY_FETCH_ERROR:", e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user?._id, user?.id]);

  const statusLabel = (status) => {
    const map = {
      completed: "Zakończone",
      rated: "Ocenione",
      released: "Wypłacone",
      done: "Zakończone",
      cancelled: "Anulowane",
      disputed: "Spór",
    };
    return map[status] || status || "—";
  };

  return (
    <div className="space-y-4">
      <Card title="Historia zleceń">
        {loading ? (
          <p className="text-sm text-gray-500">Ładowanie historii...</p>
        ) : orders.length ? (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{o.service || o.description || "Zlecenie"}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString("pl-PL") : "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {statusLabel(o.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Brak zrealizowanych lub archiwalnych zleceń.</p>
        )}
      </Card>
    </div>
  );
}

// Profile Tab (Provider only)
function ProfileTab({ user, fetchMe }) {
  const API = import.meta.env.VITE_API_URL || '';

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
      const res = await fetch(apiUrl(`/api/users/me/profile`), {
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
      const res = await fetch(apiUrl(`/api/users/me/avatar`), {
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
                {(user?.b2b || user?.isB2B) && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Faktura VAT</span>
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
            <p className="text-sm text-gray-600 -mt-2">
              Ustawienie „Wystawiam faktury VAT” znajdziesz w zakładce{' '}
              <Link to="/account?tab=billing" className="text-indigo-600 hover:underline font-medium">Rozliczenia</Link>
              {' '}— klienci widzą to w wyszukiwarce i przy ofercie.
            </p>
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
  fetch(apiUrl(`/api/provider-stats/pdf`), {
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
  const [orderScope, setOrderScope] = useState(user?.providerOrderScope || 'both');
  const [savingOrderScope, setSavingOrderScope] = useState(false);

  // Zawsze pobierz aktualny status z Stripe (backend zapisuje też do User) — inaczej po onboardingu widać stare „Nie”
  useEffect(() => {
    if (!user?.stripeAccountId) {
      setStripeStatus(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getStripeConnectStatus();
        if (cancelled || !data?.status) return;
        setStripeStatus({
          accountId: data.stripeAccountId || user.stripeAccountId,
          chargesEnabled: !!data.status.chargesEnabled,
          payoutsEnabled: !!data.status.payoutsEnabled,
        });
        await fetchMe?.();
      } catch (e) {
        console.error("PaymentsTab: connect/status", e);
        if (!cancelled) {
          setStripeStatus({
            accountId: user.stripeAccountId,
            chargesEnabled: !!user.stripeConnectStatus?.chargesEnabled,
            payoutsEnabled: !!user.stripeConnectStatus?.payoutsEnabled,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.stripeAccountId, fetchMe]);

  useEffect(() => {
    if (user?.providerPaymentPreference) {
      setPaymentPreference(user.providerPaymentPreference);
    }
    if (user?.providerOrderScope) {
      setOrderScope(user.providerOrderScope);
    }
  }, [user]);

  const handleSaveOrderScope = async () => {
    try {
      setSavingOrderScope(true);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/users/me`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ providerOrderScope: orderScope }),
      });
      if (res.ok) {
        if (typeof fetchMe === 'function') fetchMe();
        alert('Preferencje rodzaju zleceń zostały zapisane');
      } else {
        const error = await res.json();
        alert(`Błąd: ${error.message || 'Nie udało się zapisać preferencji'}`);
      }
    } catch (error) {
      console.error('Błąd zapisywania providerOrderScope:', error);
      alert('Błąd zapisywania preferencji zleceń');
    } finally {
      setSavingOrderScope(false);
    }
  };

  const handleSavePaymentPreference = async () => {
    try {
      setSavingPaymentPref(true);
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(apiUrl(`/api/users/me`), {
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
      const res = await fetch(apiUrl(`/api/payments/connect/create-account`), {
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
      const res = await fetch(apiUrl(`/api/payments/connect/account-link`), {
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
      <Card title="Rodzaj zleceń na rynku">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Wybierz, jakie zlecenia chcesz widzieć na liście dostępnych zleceń i w powiadomieniach.
            Projekty „tylko oferty” (budowa, duży remont) to osobny tryb — bez płatności przez Helpfli za roboty.
          </p>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="radio"
                name="providerOrderScope"
                value="quick_only"
                checked={orderScope === 'quick_only'}
                onChange={(e) => setOrderScope(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 shrink-0 text-slate-600" aria-hidden />
                  <span>Szybkie zlecenia</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Hydraulik, elektryk, sprzątanie itd. Bez dużych projektów w trybie „tylko oferty”.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="radio"
                name="providerOrderScope"
                value="large_only"
                checked={orderScope === 'large_only'}
                onChange={(e) => setOrderScope(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 shrink-0 text-indigo-600" aria-hidden />
                  <span>Duże projekty (tylko oferty)</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Budowa, generalny remont, zbieranie wycen — klient wybiera wykonawcę i kontaktuje się poza platformą.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="radio"
                name="providerOrderScope"
                value="both"
                checked={orderScope === 'both'}
                onChange={(e) => setOrderScope(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 shrink-0 text-indigo-600" aria-hidden />
                  <span>Oba typy</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Widzisz wszystkie otwarte zlecenia — szybkie usługi i duże projekty.
                </p>
              </div>
            </label>
          </div>
          <button
            type="button"
            onClick={handleSaveOrderScope}
            disabled={savingOrderScope || orderScope === (user?.providerOrderScope || 'both')}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingOrderScope ? 'Zapisywanie...' : 'Zapisz rodzaj zleceń'}
          </button>
        </div>
      </Card>

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

function SettingsTab({ user, pushStatus, enablePush, showChangePasswordModal, setShowChangePasswordModal, showTwoFactorAuth, setShowTwoFactorAuth, fetchMe, logout }) {
  const [accountForm, setAccountForm] = useState({ name: '', phone: '' });
  const [savingAccount, setSavingAccount] = useState(false);
  const [preferencesReloadTrigger, setPreferencesReloadTrigger] = useState(0);
  const [notificationDetailsExpanded, setNotificationDetailsExpanded] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [deletionStatus, setDeletionStatus] = useState(null);
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

  useEffect(() => {
    if (!showDeleteAccountModal) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/users/me/account-deletion-status'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setDeletionStatus({
            canDelete: !!data.canDelete,
            blockers: Array.isArray(data.blockers) ? data.blockers : [],
          });
        } else if (!cancelled) {
          setDeletionStatus({
            canDelete: false,
            blockers: [{ code: 'UNKNOWN', message: data.message || 'Nie udało się sprawdzić statusu konta.' }],
          });
        }
      } catch {
        if (!cancelled) {
          setDeletionStatus({
            canDelete: false,
            blockers: [{ code: 'NETWORK', message: 'Błąd sieci. Spróbuj ponownie.' }],
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showDeleteAccountModal]);

  const closeDeleteModal = () => {
    setShowDeleteAccountModal(false);
    setDeleteAccountPassword('');
    setDeleteAccountError('');
    setDeletionStatus(null);
  };

  const submitDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteAccountError('');
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountError('Podaj hasło.');
      return;
    }
    if (deletionStatus && !deletionStatus.canDelete) {
      setDeleteAccountError('Nie można zamknąć konta przy obecnym stanie zleceń lub firmy.');
      return;
    }
    try {
      setDeleteAccountLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/users/me/account-delete'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deleteAccountPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data.message ||
          (Array.isArray(data.blockers) && data.blockers[0]?.message) ||
          'Nie udało się zamknąć konta.';
        setDeleteAccountError(msg);
        if (Array.isArray(data.blockers)) {
          setDeletionStatus({ canDelete: false, blockers: data.blockers });
        }
        return;
      }
      closeDeleteModal();
      if (typeof logout === 'function') {
        await logout();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } catch (err) {
      setDeleteAccountError(err?.message || 'Błąd sieci.');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

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
      const res = await fetch(apiUrl(`/api/users/me`), {
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
      const res = await fetch(apiUrl(`/api/users/me`), {
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
      const res = await fetch(apiUrl(`/api/users/me/billing`), {
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
              placeholder="Imię i nazwisko"
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
              Odznaczono. Nie będziesz widoczny w filtrze „Faktura VAT”. Możesz włączyć ponownie w dowolnym momencie.
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

          {user?.role !== 'admin' && (
            <button
              type="button"
              onClick={() => {
                setDeleteAccountError('');
                setDeleteAccountPassword('');
                setDeletionStatus(null);
                setShowDeleteAccountModal(true);
              }}
              className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <div className="font-medium text-red-800 flex items-center gap-2">
                <Trash2 className="w-4 h-4 shrink-0" />
                Usuń konto
              </div>
              <div className="text-sm text-red-700/90">
                Trwałe zamknięcie konta i usunięcie danych osobowych (zlecenia pozostają w systemie w formie zanonimizowanej).
              </div>
            </button>
          )}
        </div>
      </Card>

      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Usuń konto na stałe</h2>
            <p className="text-sm text-gray-600 mb-4">
              Ta operacja jest natychmiastowa i nieodwracalna. Utracisz dostęp do konta; dane osobowe w profilu zostaną
              usunięte zgodnie z ustawieniami systemu.
            </p>
            {deletionStatus === null && (
              <p className="text-sm text-gray-500 mb-4">Sprawdzanie warunków…</p>
            )}
            {deletionStatus && !deletionStatus.canDelete && deletionStatus.blockers?.length > 0 && (
              <ul className="mb-4 space-y-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 list-disc pl-5">
                {deletionStatus.blockers.map((b) => (
                  <li key={b.code}>{b.message}</li>
                ))}
              </ul>
            )}
            {deleteAccountError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {deleteAccountError}
              </div>
            )}
            <form onSubmit={submitDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Potwierdź hasłem</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Obecne hasło do konta"
                  disabled={deleteAccountLoading || (deletionStatus && !deletionStatus.canDelete)}
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleteAccountLoading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={
                    deleteAccountLoading || !deletionStatus?.canDelete || !deleteAccountPassword.trim()
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteAccountLoading ? 'Zamykanie…' : 'Na zawsze zamknij konto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
