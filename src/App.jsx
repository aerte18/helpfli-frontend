import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { initOneSignal } from "./onesignal";
import LandingStart from "./pages/LandingStart";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));
const PrivacySettings = lazy(() => import("./components/PrivacySettings"));
const Home = lazy(() => import("./pages/Home"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const Account = lazy(() => import("./pages/Account"));
const CreateOrder = lazy(() => import("./pages/CreateOrder"));
const RateUser = lazy(() => import("./pages/RateUser"));
const UserRatings = lazy(() => import("./pages/UserRatings"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const OrderDisputeCase = lazy(() => import("./pages/OrderDisputeCase"));
const NearbyProvidersPage = lazy(() => import("./pages/NearbyProvidersPage"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const ProvidersPage = lazy(() => import("./pages/ProvidersPage"));
const OrderChat = lazy(() => import("./pages/OrderChat"));
const Messages = lazy(() => import("./pages/Messages"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const CalendarCallback = lazy(() => import("./pages/integrations/CalendarCallback"));
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const CompanyAccount = lazy(() => import("./pages/company/CompanyAccount"));
const CreateCompany = lazy(() => import("./pages/company/CreateCompany"));
const CompanySettings = lazy(() => import("./pages/company/CompanySettings"));
const JoinCompany = lazy(() => import("./pages/company/JoinCompany"));
import DashboardRedirect from "./pages/DashboardRedirect";
import SearchRedirect from "./components/SearchRedirect";
const ManageServices = lazy(() => import("./pages/ManageServices"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const AvailableOrders = lazy(() => import("./pages/AvailableOrders"));

// Komponenty Asystent AI

// Komponent nawigacji
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import SkipLinks from "./components/SkipLinks";
import TelemetryRouteListener from "./components/TelemetryRouteListener";
import ScrollToTop from "./components/ScrollToTop";

const Breadcrumbs = lazy(() => import("./components/Breadcrumbs"));
const MobileAppTabBar = lazy(() => import("./components/MobileAppTabBar"));
const GuestMobileStickyCta = lazy(() => import("./components/GuestMobileStickyCta"));
const MobileLandscapeChrome = lazy(() => import("./components/MobileLandscapeChrome"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const WhyPro = lazy(() => import("./pages/WhyPro"));
const Boosts = lazy(() => import("./pages/Boosts"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Verification = lazy(() => import("./pages/Verification"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ConciergePage = lazy(() => import("./pages/ConciergePage"));
const ProviderQuotes = lazy(() => import("./pages/ProviderQuotes"));
const Regulations = lazy(() => import("./pages/Regulations"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const ServicesList = lazy(() => import("./pages/ServicesList"));
const Cooperation = lazy(() => import("./pages/Cooperation"));
const Reviews = lazy(() => import("./pages/Reviews"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Cennik = lazy(() => import("./pages/Cennik"));
const DaneFirmy = lazy(() => import("./pages/DaneFirmy"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRankingConfig = lazy(() => import("./pages/AdminRankingConfig"));
const AdminKBManager = lazy(() => import("./pages/admin/AdminKBManager"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminKyc = lazy(() => import("./pages/AdminKyc"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminSponsorAds = lazy(() => import("./pages/admin/AdminSponsorAds"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReportHistory = lazy(() => import("./pages/AdminReportHistory"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminSeoArticles = lazy(() => import("./pages/admin/AdminSeoArticles"));
const AdminSeoLocalPages = lazy(() => import("./pages/admin/AdminSeoLocalPages"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const SeoArticlePage = lazy(() => import("./pages/SeoArticlePage"));
const PoradnikiList = lazy(() => import("./pages/PoradnikiList"));
const SeoLocalPage = lazy(() => import("./pages/SeoLocalPage"));
const KycWizard = lazy(() => import("./pages/KycWizard"));
const StripeProvider = lazy(() => import("./payment/StripeProvider"));
const CheckoutPage = lazy(() => import("./payment/CheckoutPage"));
const PaymentResult = lazy(() => import("./payment/PaymentResult"));
const NotFound = lazy(() => import("./pages/NotFound"));

const ProviderHome = lazy(() => import("./pages/ProviderHome"));
const ProviderSponsored = lazy(() => import("./pages/ProviderSponsored"));
const WhiteLabelManager = lazy(() => import("./pages/whitelabel/WhiteLabelManager"));
const AiWidget = lazy(() => import("./components/AiWidget"));
const ProviderAIWidget = lazy(() => import("./components/ProviderAIWidget"));
const UnifiedAIConcierge = lazy(() => import("./components/ai/UnifiedAIConcierge"));
const PermissionQueueManager = lazy(() => import("./components/consent/PermissionQueueManager"));
const HowItWorksHelpfliModal = lazy(() => import("./components/HowItWorksHelpfliModal"));


// Loading component dla lazy loaded komponentów
const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" aria-label="Ładowanie" />
  </div>
);

function LegacyOrderTabRedirect() {
  const { orderId, tabSlug } = useParams();
  const normalizedTab = String(tabSlug || "").toLowerCase();
  const tabMap = {
    "tab-offers": "offers",
    "tab-my-offer": "my_offer",
    "tab-chat": "chat",
    "tab-details": "details",
  };
  const tab = tabMap[normalizedTab] || "details";
  return <Navigate to={`/orders/${orderId}?tab=${tab}`} replace />;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    console.log("App - useEffect - checking localStorage for user");
    try {
      const raw = localStorage.getItem("user");
      const u = raw ? JSON.parse(raw) : null;
      console.log("App - useEffect - user from localStorage:", u);
      if (u?.role === "provider") {
        console.log("App - useEffect - initializing OneSignal for provider");
        // Opóźnij inicjalizację OneSignal, żeby uniknąć konfliktów
        setTimeout(() => initOneSignal(u), 1000);
      }
    } catch (error) {
      console.warn("App - useEffect - localStorage access blocked:", error);
    }
  }, []);

  // Po zmianie trasy zdejmij ewentualne „zawieszone” style z blokady scrolla (HMR / stary useBodyScrollLock).
  // ProviderHome w widoku mapy ustawi overflow ponownie w swoim useEffect — kolejność mountów to uwzględnia.
  useEffect(() => {
    const b = document.body;
    const h = document.documentElement;
    if (b.style.position === "fixed") {
      b.style.position = "";
      b.style.top = "";
      b.style.width = "";
    }
    b.style.removeProperty("overflow");
    h.style.removeProperty("overflow");
  }, [location.pathname]);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        {/* Skip Links for Accessibility */}
        <SkipLinks />
        
        {/* Navbar */}
        <Navbar />
        {!isAdminRoute && (
          <Suspense fallback={null}>
            <HowItWorksHelpfliModal />
          </Suspense>
        )}
        <ScrollToTop />
        {!isAdminRoute && <TelemetryRouteListener />}
        {!isAdminRoute && (
          <Suspense fallback={null}>
            <Breadcrumbs />
            <MobileAppTabBar />
            <GuestMobileStickyCta />
            <MobileLandscapeChrome />
          </Suspense>
        )}

        {/* Router */}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
        {/* Landing page jako strona główna */}
        <Route path="/" element={<LandingStart />} />

                  {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<PrivateRoute><OnboardingWizard /></PrivateRoute>} />
          <Route path="/privacy" element={<PrivateRoute><PrivacySettings /></PrivateRoute>} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchRedirect />} />
          {/* Public AI Concierge - dostępne bez logowania */}
          <Route path="/concierge" element={<ConciergePage />} />
          <Route path="/ai-public" element={<Navigate to="/concierge" replace />} />
          {/* Nowa strona Konto z tabami */}
          <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
          <Route path="/account/company" element={<PrivateRoute><CompanyAccount /></PrivateRoute>} />
          <Route path="/account/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />
          <Route path="/account/boosts" element={<PrivateRoute><Boosts /></PrivateRoute>} />
          <Route path="/account/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/integrations/calendar/callback" element={<PrivateRoute><CalendarCallback /></PrivateRoute>} />
          {/* Legacy redirecty */}
          <Route path="/wallet" element={<Navigate to="/account/wallet" replace />} />
          <Route path="/billing" element={<Navigate to="/account/wallet" replace />} />
          <Route path="/subscriptions" element={<Navigate to="/account/subscriptions" replace />} />
          <Route path="/why-pro" element={<WhyPro />} />
          <Route path="/providers" element={<ProvidersPage />} />
          <Route path="/provider/:id" element={<ProviderProfile />} />
          <Route path="/service/:slug" element={<ServiceDetailPage />} />
          <Route path="/regulamin" element={<Regulations />} />
          <Route path="/prywatnosc" element={<Privacy />} />
          <Route path="/cennik" element={<Cennik />} />
          <Route path="/dane-firmy" element={<DaneFirmy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<ServicesList />} />
          <Route path="/cooperation" element={<Cooperation />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/help" element={<HelpCenter />} />

          {/* AI SEO Engine – publiczne poradniki */}
          <Route path="/poradniki" element={<PoradnikiList />} />
          <Route path="/poradnik/:slug" element={<SeoArticlePage />} />
          {/* PSEO – landing pages miasto×usługa */}
          <Route path="/wykonawcy/:service/:city" element={<SeoLocalPage />} />

        {/* Wymaga logowania */}
        <Route element={<PrivateRoute />}>
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/orders/my" element={<MyOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/orders/:orderId/sprawa" element={<OrderDisputeCase />} />
          <Route path="/orders/:orderId/:tabSlug" element={<LegacyOrderTabRedirect />} />
          <Route path="/orders/:orderId/chat" element={<OrderChat />} />
          <Route path="/rate-user/:userId" element={<RateUser />} />
          <Route path="/user-ratings/:userId" element={<UserRatings />} />
          <Route path="/nearby-providers" element={<NearbyProvidersPage />} />
          <Route path="/inbox" element={<Messages />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          {/* Przekierowanie z onboarding */}
          <Route path="/onboarding/provider" element={<Navigate to="/provider-home" replace />} />
          {/* Nowe trasy Pakietu 2 */}
          <Route path="/ai" element={<Navigate to="/concierge" replace />} />
          
          {/* Trasy płatności */}
          <Route path="/checkout" element={
            <StripeProvider><CheckoutPage/></StripeProvider>
          }/>
          <Route path="/payment-result" element={<PaymentResult />} />
          {/* Płatność za konkretne zlecenie — klienci i providerzy (nie tylko RoleRoute provider) */}
          <Route path="/checkout/:orderId" element={<Checkout />} />
          
          {/* Trasy KYC */}
          <Route path="/kyc" element={<KycWizard />} />
          
          {/* Dashboard: wszyscy zalogowani (klient po błędnym redirectcie musi widzieć treść, nie pętlę) */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/client-dashboard" element={<DashboardRedirect />} />
        </Route>

                  {/* Tylko dla usługodawcy */}
          <Route element={<RoleRoute allow={["provider"]} />}>
            <Route path="/provider" element={<Navigate to="/provider-home" replace />} />
            <Route path="/manage-services" element={<ManageServices />} />
            <Route path="/available-orders" element={<AvailableOrders />} />
            <Route path="/provider/sponsored" element={<ProviderSponsored />} />
                      <Route path="/verification" element={<Verification />} />
            <Route path="/provider/quotes" element={<ProviderQuotes />} />
          </Route>

          {/* ProviderHome - dostępny dla providerów i właścicieli/managerów firm */}
          <Route path="/provider-home" element={<PrivateRoute><ProviderHome /></PrivateRoute>} />

          {/* Company management routes */}
          <Route path="/company/dashboard" element={<PrivateRoute><CompanyDashboard /></PrivateRoute>} />
          <Route path="/company/create" element={<PrivateRoute><CreateCompany /></PrivateRoute>} />
          <Route path="/company/join" element={<PrivateRoute><JoinCompany /></PrivateRoute>} />
          <Route path="/company/:companyId/settings" element={<PrivateRoute><CompanySettings /></PrivateRoute>} />

        {/* Tylko dla admina */}
        <Route element={<RoleRoute allow={["admin", "superadmin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/ranking" element={<AdminRankingConfig />} />
            <Route path="/admin/verifications" element={<AdminVerifications />} />
            <Route path="/admin/kyc" element={<AdminKyc />} />
            <Route path="/admin/kb" element={<AdminKBManager />} />
            <Route path="/admin/partners" element={<AdminPartners />} />
            <Route path="/admin/sponsor-ads" element={<AdminSponsorAds />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/reports" element={<AdminReportHistory />} />
            <Route path="/admin/disputes" element={<AdminDisputes />} />
            <Route path="/admin/seo" element={<AdminSeoArticles />} />
            <Route path="/admin/seo/pseo" element={<AdminSeoLocalPages />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
          </Route>
        </Route>
        
        {/* White-label management - dla admina i company owners */}
        <Route path="/admin/whitelabel" element={<PrivateRoute><RoleRoute allow={["admin", "superadmin"]}><WhiteLabelManager /></RoleRoute></PrivateRoute>} />
        <Route path="/account/whitelabel" element={<PrivateRoute><WhiteLabelManager /></PrivateRoute>} />
        
        {/* 404 catch-all route */}
        <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        {/* Globalne widgety — lazy, nie blokują pierwszego paintu */}
        {!isAdminRoute && (
          <Suspense fallback={null}>
            <UnifiedAIConcierge
              mode="modal"
              open={false}
              attachBus={true}
            />
            <AiWidget />
            <ProviderAIWidget />
          </Suspense>
        )}

        <Suspense fallback={null}>
          <PermissionQueueManager />
        </Suspense>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
