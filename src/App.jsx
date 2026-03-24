import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import 'leaflet/dist/leaflet.css';
import { initOneSignal } from "./onesignal";
import AiWidget from "./components/AiWidget";
import ProviderAIWidget from "./components/ProviderAIWidget";
import UnifiedAIConcierge from "./components/ai/UnifiedAIConcierge";


import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Strony - Lazy loaded dla lepszej wydajności
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import OnboardingWizard from "./pages/OnboardingWizard";
import PrivacySettings from "./components/PrivacySettings";
import Home from "./pages/Home";
import LandingStart from "./pages/LandingStart";
import SearchPage from "./pages/SearchPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import Account from "./pages/Account";
import CreateOrder from "./pages/CreateOrder";
import RateUser from "./pages/RateUser";
import UserRatings from "./pages/UserRatings";
import OrderDetails from "./pages/OrderDetails";
import NearbyProvidersPage from "./pages/NearbyProvidersPage";
import ProviderProfile from './pages/ProviderProfile';
import ProvidersPage from "./pages/ProvidersPage";
import OrderChat from "./pages/OrderChat";
import Inbox from "./pages/Inbox";
import Messages from "./pages/Messages";
import NotificationsPage from "./pages/NotificationsPage";

// Company management pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyAccount from "./pages/company/CompanyAccount";
import CreateCompany from "./pages/company/CreateCompany";
import CompanySettings from "./pages/company/CompanySettings";
import JoinCompany from "./pages/company/JoinCompany";

// Lazy loaded - ciężkie komponenty
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ManageServices = lazy(() => import("./pages/ManageServices"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const AvailableOrders = lazy(() => import("./pages/AvailableOrders"));

// Komponenty Asystent AI

// Komponent nawigacji
import Navbar from "./components/Navbar";
import Breadcrumbs from "./components/Breadcrumbs";
import MobileAppTabBar from "./components/MobileAppTabBar";

// Komponenty ochronne
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import Subscriptions from "./pages/Subscriptions";
import WhyPro from "./pages/WhyPro";
import Boosts from "./pages/Boosts";
import Wallet from "./pages/Wallet";
import Verification from "./pages/Verification";
import Checkout from "./pages/Checkout";
import ConciergePage from "./pages/ConciergePage";
import ProviderQuotes from "./pages/ProviderQuotes";
import Regulations from "./pages/Regulations";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import About from "./pages/About";
import ServicesList from "./pages/ServicesList";
import Cooperation from "./pages/Cooperation";
import Reviews from "./pages/Reviews";
import HelpCenter from "./pages/HelpCenter";

// Komponenty KYC
import KycWizard from "./pages/KycWizard";

// Komponenty płatności
import StripeProvider from "./payment/StripeProvider";
import CheckoutPage from "./payment/CheckoutPage";
import PaymentResult from "./payment/PaymentResult";

import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import SkipLinks from "./components/SkipLinks";

// Lazy loaded - Admin i Provider komponenty (najcięższe)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRankingConfig = lazy(() => import("./pages/AdminRankingConfig"));
const AdminKBManager = lazy(() => import("./pages/admin/AdminKBManager"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminKyc = lazy(() => import("./pages/AdminKyc"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminSponsorAds = lazy(() => import("./pages/admin/AdminSponsorAds"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReportHistory = lazy(() => import("./pages/AdminReportHistory"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const ProviderHome = lazy(() => import("./pages/ProviderHome"));
const ProviderSponsored = lazy(() => import("./pages/ProviderSponsored"));
const WhiteLabelManager = lazy(() => import("./pages/whitelabel/WhiteLabelManager"));


// Loading component dla lazy loaded komponentów
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
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

  return (
    <HelmetProvider>
      <ErrorBoundary>
        {/* Skip Links for Accessibility */}
        <SkipLinks />
        
        {/* Navbar */}
        <Navbar />
        <Breadcrumbs />
        <MobileAppTabBar />

        {/* Router */}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
        {/* Landing page jako strona główna */}
        <Route path="/" element={<LandingStart />} />

                  {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<PrivateRoute><OnboardingWizard /></PrivateRoute>} />
          <Route path="/privacy" element={<PrivateRoute><PrivacySettings /></PrivateRoute>} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          {/* Public AI Concierge - dostępne bez logowania */}
          <Route path="/concierge" element={<ConciergePage />} />
          <Route path="/ai-public" element={<Navigate to="/concierge" replace />} />
          {/* Nowa strona Konto z tabami */}
          <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
          <Route path="/account/company" element={<PrivateRoute><CompanyAccount /></PrivateRoute>} />
          <Route path="/account/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />
          <Route path="/account/boosts" element={<PrivateRoute><Boosts /></PrivateRoute>} />
          <Route path="/account/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          {/* Legacy redirecty */}
          <Route path="/billing" element={<Navigate to="/account/wallet" replace />} />
          <Route path="/subscriptions" element={<Navigate to="/account/subscriptions" replace />} />
          <Route path="/why-pro" element={<WhyPro />} />
          <Route path="/providers" element={<ProvidersPage />} />
          <Route path="/provider/:id" element={<ProviderProfile />} />
          <Route path="/service/:slug" element={<ServiceDetailPage />} />
          <Route path="/regulamin" element={<Regulations />} />
          <Route path="/prywatnosc" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<ServicesList />} />
          <Route path="/cooperation" element={<Cooperation />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/help" element={<HelpCenter />} />

        {/* Wymaga logowania */}
        <Route element={<PrivateRoute />}>
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/orders/my" element={<MyOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/orders/:orderId/chat" element={<OrderChat />} />
          <Route path="/rate-user/:userId" element={<RateUser />} />
          <Route path="/user-ratings/:userId" element={<UserRatings />} />
          <Route path="/nearby-providers" element={<NearbyProvidersPage />} />
          <Route path="/inbox" element={<Inbox />} />
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
          <Route path="/payment-result" element={
            <StripeProvider><PaymentResult/></StripeProvider>
          }/>
          
          {/* Trasy KYC */}
          <Route path="/kyc" element={<KycWizard />} />
          
          
          {/* Dashboard dla klientów */}
          <Route path="/client-dashboard" element={<Dashboard />} />
        </Route>

                  {/* Tylko dla usługodawcy */}
          <Route element={<RoleRoute allow={["provider"]} />}>
            <Route path="/provider" element={<Navigate to="/provider-home" replace />} />
            <Route path="/manage-services" element={<ManageServices />} />
            <Route path="/available-orders" element={<AvailableOrders />} />
            <Route path="/provider/sponsored" element={<ProviderSponsored />} />
                      <Route path="/verification" element={<Verification />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
            <Route path="/provider/quotes" element={<ProviderQuotes />} />
            {/* jeżeli masz własny dashboard wykonawcy: */}
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* ProviderHome - dostępny dla providerów i właścicieli/managerów firm */}
          <Route path="/provider-home" element={<PrivateRoute><ProviderHome /></PrivateRoute>} />

          {/* Company management routes */}
          <Route path="/company/dashboard" element={<PrivateRoute><CompanyDashboard /></PrivateRoute>} />
          <Route path="/company/create" element={<PrivateRoute><CreateCompany /></PrivateRoute>} />
          <Route path="/company/join" element={<PrivateRoute><JoinCompany /></PrivateRoute>} />
          <Route path="/company/:companyId/settings" element={<PrivateRoute><CompanySettings /></PrivateRoute>} />

        {/* Tylko dla admina */}
        <Route element={<RoleRoute allow={["admin"]} />}>
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
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
          </Route>
        </Route>
        
        {/* White-label management - dla admina i company owners */}
        <Route path="/admin/whitelabel" element={<PrivateRoute><RoleRoute allow={["admin"]}><WhiteLabelManager /></RoleRoute></PrivateRoute>} />
        <Route path="/account/whitelabel" element={<PrivateRoute><WhiteLabelManager /></PrivateRoute>} />
        
        {/* 404 catch-all route */}
        <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        {/* Globalne widgety */}
        {/* Asystent AI - globalny (dla bus system) */}
        <UnifiedAIConcierge 
          mode="modal"
          open={false}
          attachBus={true}
        />
        
        {/* Floating AI Widget - dla klientów */}
        <AiWidget />
        
        {/* Floating Asystent AI - dla providerów z pakietem Standard/PRO */}
        <ProviderAIWidget />
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
