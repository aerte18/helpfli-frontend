import { apiUrl } from "@/lib/apiUrl";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from 'react';
import { Search, Bell, ClipboardList, Building2, X, Wrench, Plus } from "lucide-react";
import { unreadTotal } from '../services/chatApi';
import Logo from "./Logo";
import { UI } from "../i18n/pl_ui";
import { useAuth } from '../context/AuthContext';
import LoyaltyPointsBadge from "./LoyaltyPointsBadge";
import ServiceAutocomplete from "./ServiceAutocomplete";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Navbar() {
  const [count, setCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchContainerRef = useRef(null);
  const notificationsRef = useRef(null);
  const mobileNotificationsRef = useRef(null);
  const mobileSearchToggleRef = useRef(null);
  const mobileSearchExpandedRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, loading } = useAuth();

  // Ukryj wyszukiwarkę na LandingStart i ProviderHome
  const hideSearch = location.pathname === '/' || location.pathname === '/provider-home';



  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const fetchNotificationsCount = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setCount(0);
          return;
        }
        const res = await fetch(apiUrl(`/api/notifications/unread/count`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count || 0);
        } else if (res.status === 401) {
          setCount(0);
        }
      } catch {
        setCount(0);
      }
    };

    fetchNotificationsCount();
    const int = setInterval(fetchNotificationsCount, 60000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchNotificationsCount();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(int);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId]);

  // Zamknij menu po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      // Zamknij wyszukiwanie jeśli kliknięto poza nim
      const inDesktopSearch =
        searchContainerRef.current?.contains(event.target);
      const inMobileSearchToggle =
        mobileSearchToggleRef.current?.contains(event.target);
      const inMobileSearchPanel =
        mobileSearchExpandedRef.current?.contains(event.target);
      if (
        searchExpanded &&
        !inDesktopSearch &&
        !inMobileSearchToggle &&
        !inMobileSearchPanel
      ) {
        setSearchExpanded(false);
      }
      const inNotifications =
        notificationsRef.current?.contains(event.target) ||
        mobileNotificationsRef.current?.contains(event.target);
      if (showNotifications && !inNotifications) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, searchExpanded, showNotifications]);

  return (
    <header className="sticky top-0 z-50 relative border-b pt-[env(safe-area-inset-top)] backdrop-blur-sm" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Link 
            to={!user ? "/" : (user.role === "provider" || user.role === "company_owner" || user.role === "company_manager") ? "/provider-home" : "/home"} 
            className="flex items-center"
          >
            <Logo className="h-6 w-6" showText={true} textColor="text-primary" />
          </Link>

          {/* Linki nawigacyjne - tylko na LandingStart dla niezalogowanych */}
          {!user && location.pathname === '/' && (
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/services" className="text-sm font-medium transition-colors" style={{ color: 'var(--foreground)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--foreground)'}>
                Usługi
              </Link>
              <Link 
                to="/" 
                onClick={(e) => {
                  // Jeśli jesteśmy już na stronie głównej, scroll do sekcji
                  if (location.pathname === '/') {
                    e.preventDefault();
                    const element = document.getElementById('jak-to-dziala');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  } else {
                    // Jeśli jesteśmy na innej stronie, nawiguj z hashem
                    navigate('/#jak-to-dziala');
                    e.preventDefault();
                  }
                }}
                className="text-sm font-medium transition-colors" 
                style={{ color: 'var(--muted-foreground)' }} 
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} 
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
              >
                Jak to działa
              </Link>
              <Link
                to="/register?role=provider"
                className="text-sm font-semibold px-3 py-1.5 rounded-full border transition-colors"
                style={{ color: 'var(--primary)', borderColor: 'var(--primary)', borderWidth: '1px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                Zostań wykonawcą
              </Link>
            </nav>
          )}
        </div>

        {/* Prawa strona — ml-auto wymusza brzeg prawy (niezawodniejsze niż samo justify-between) */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        <nav className="hidden md:flex items-center gap-3" aria-label="Konto i narzędzia">
          {/* Mini-wyszukiwarka - tylko dla zalogowanych użytkowników i nie na LandingStart/ProviderHome */}
          {user && !hideSearch && (
            <div className="relative" ref={searchContainerRef}>
              {!searchExpanded ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchExpanded(true);
                    // Focus na input po rozwinięciu
                    setTimeout(() => {
                      const input = document.querySelector('input[placeholder*="pomocy"], input[placeholder*="szukasz"]');
                      if (input) input.focus();
                    }, 100);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Wyszukaj"
                >
                  <Search className="w-5 h-5" aria-hidden />
                </button>
              ) : (
                <div className="relative">
                  <ServiceAutocomplete
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onPick={(service) => {
                      setSearchQuery(service);
                      setSearchExpanded(false);
                      navigate(`/home?search=${encodeURIComponent(service)}`);
                    }}
                    onSearch={(query) => {
                      const trimmed = query.trim();
                      setSearchExpanded(false);
                      if (trimmed) {
                        navigate(`/home?search=${encodeURIComponent(trimmed)}`);
                      } else {
                        // Jeśli puste, przekieruj do /home bez parametru search
                        navigate('/home');
                      }
                    }}
                    placeholder={UI.searchPlaceholder}
                    className="w-64"
                    showSearchButton={true}
                    onEscape={() => setSearchExpanded(false)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchExpanded(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
                    aria-label="Zamknij wyszukiwanie"
                  >
                    <X className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Przycisk "Utwórz zlecenie" - tylko dla klientów */}
          {user && user.role === 'client' && (
            <Link 
              to="/create-order"
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Utwórz zlecenie
            </Link>
          )}

          {/* Zamienny przycisk Panel zleceń / Panel firmy - dla użytkowników firmowych */}
          {user && (user?.role === "company_owner" || 
                    user?.role === "company_manager" ||
                    (user?.company && (user?.roleInCompany === "owner" || user?.roleInCompany === "manager" || user?.roleInCompany === "provider"))) && (
            location.pathname === "/provider-home" ? (
              <Link 
                to="/account/company"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" aria-hidden />
                <span>Panel firmy</span>
              </Link>
            ) : (
              <Link 
                to="/provider-home"
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" aria-hidden />
                <span>Panel zleceń</span>
              </Link>
            )
          )}

          {/* podczas ładowania /me nic nie pokazuj, żeby nie migało „Zaloguj" */}
          {loading ? (
            <div style={{ width: 120, height: 32 }} />
          ) : user ? (
            <>
              {/* Dzwonek powiadomień */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-md p-2 transition-colors" 
                  style={{ color: 'var(--foreground)' }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label="Powiadomienia"
                >
                  <Bell className="w-5 h-5" aria-hidden />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 min-w-[16px] text-center">
                      {count}
                    </span>
                  )}
                </button>
              </div>

              {/* Avatar z menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{user.name}</span>
                  {user.level === 'pro' && (
                    <span className="text-xs px-1.5 py-0.5 bg-gold-100 text-gold-700 rounded-full font-medium">PRO</span>
                  )}
                  <span className="text-xs">▼</span>
                </button>

                {/* Rozwijane menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-white shadow-lg border border-gray-200 py-2 z-50">
                    {(() => {
                      const isCompanyUser = user?.role === "company_owner" ||
                                          user?.role === "company_manager" ||
                                          (user?.company && (user?.roleInCompany === "owner" || user?.roleInCompany === "manager"));
                      return (
                        <Link 
                          to={isCompanyUser ? "/account/company" : "/account"}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          {isCompanyUser ? "Panel firmy" : "Konto"}
                        </Link>
                      );
                    })()}
                    <Link 
                      to="/account/subscriptions" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Subskrypcje
                    </Link>
                    <Link 
                      to="/inbox" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Chat
                    </Link>
                    {user?.role !== 'provider' && (
                      <Link 
                        to="/ai" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Asystent AI
                      </Link>
                    )}
                    {user && (
                      <div className="block px-4 py-2 text-sm text-gray-700 border-t border-gray-200 mt-2 pt-2">
                        <LoyaltyPointsBadge />
                      </div>
                    )}
                    {user?.role === "provider" && (
                      <Link 
                        to="/kyc" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        KYC
                      </Link>
                    )}
                    {user?.role === "provider" && (
                      <Link 
                        to="/manage-services" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Wrench className="w-4 h-4 shrink-0" aria-hidden />
                        Zarządzanie usługami
                      </Link>
                    )}
                    {(user?.role === "provider" || user?.role === "company_owner" || user?.role === "company_manager") && (
                      <Link 
                        to="/provider-home" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <ClipboardList className="w-4 h-4 shrink-0" aria-hidden />
                        Panel zleceń
                      </Link>
                    )}
                    {(user?.role === "provider" || user?.role === "company_owner" || user?.role === "company_manager") && (
                      <>
                        <Link 
                          to="/company/dashboard" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Building2 className="w-4 h-4 shrink-0" aria-hidden />
                          Panel firmy
                        </Link>
                        {(!user?.company && user?.role === "provider") && (
                          <Link 
                            to="/company/create" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Plus className="w-4 h-4 shrink-0" aria-hidden />
                            Utwórz firmę
                          </Link>
                        )}
                      </>
                    )}
                    {user?.role === "admin" && (
                      <Link 
                        to="/admin" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-200 mt-2 pt-2"
                    >
                      Wyloguj
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--foreground)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                Zaloguj się
              </Link>
              <Link to="/register" className="btn-helpfli-primary px-4 py-2 text-sm font-medium">
                Zarejestruj się
              </Link>
            </>
          )}
        </nav>

          {/* Gość na mobile — w tym samym bloku co desktop, bez trzeciej kolumny flex */}
          {!loading && !user && (
            <>
              <Link
                to="/login"
                className="md:hidden text-xs sm:text-sm font-medium px-2 py-1.5 rounded-md transition-colors whitespace-nowrap"
                style={{ color: 'var(--foreground)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Zaloguj się
              </Link>
              <Link
                to="/register"
                className="md:hidden btn-helpfli-primary px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Zarejestruj się
              </Link>
            </>
          )}
          {user && !hideSearch && (
            <button
              type="button"
              ref={mobileSearchToggleRef}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg transition-colors shrink-0"
              style={{ color: 'var(--foreground)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => setSearchExpanded((v) => !v)}
              aria-expanded={searchExpanded}
              aria-label="Szukaj"
            >
              <Search className="w-5 h-5" aria-hidden />
            </button>
          )}
          {user && !loading && (
            <div className="relative md:hidden shrink-0" ref={mobileNotificationsRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-md p-2 transition-colors"
                style={{ color: 'var(--foreground)' }}
                aria-label="Powiadomienia"
              >
                <Bell className="w-5 h-5" aria-hidden />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 min-w-[16px] text-center">
                    {count}
                  </span>
                )}
              </button>
            </div>
          )}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg transition-colors shrink-0"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => setMobileOpen(true)}
            aria-label="Menu — konto, wyloguj i więcej"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
      </div>

      {user && searchExpanded && !hideSearch && (
        <div
          ref={mobileSearchExpandedRef}
          className="md:hidden border-t px-4 py-2 -mx-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <ServiceAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onPick={(service) => {
              setSearchQuery(service);
              setSearchExpanded(false);
              navigate(`/home?search=${encodeURIComponent(service)}`);
            }}
            onSearch={(query) => {
              const trimmed = query.trim();
              setSearchExpanded(false);
              if (trimmed) {
                navigate(`/home?search=${encodeURIComponent(trimmed)}`);
              } else {
                navigate('/home');
              }
            }}
            placeholder={UI.searchPlaceholder}
            className="w-full"
            showSearchButton={true}
            onEscape={() => setSearchExpanded(false)}
          />
        </div>
      )}

      </div>

      {showNotifications && user?._id && (
        <div className="absolute left-2 right-2 top-full z-[55] mx-auto max-w-[min(24rem,calc(100vw-1rem))] md:left-auto md:right-4 md:mx-0 md:w-96 md:max-w-[min(24rem,calc(100vw-2rem))]">
          <NotificationsDropdown
            userId={user._id}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      )}

      {/* Offcanvas mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[86vw] max-w-sm p-6 flex flex-col gap-4" style={{ backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <Link 
                to={!user ? "/" : (user.role === "provider" || user.role === "company_owner" || user.role === "company_manager") ? "/provider-home" : "/home"}
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <Logo className="h-6 w-6" showText={true} textColor="text-primary" />
              </Link>
              <button className="p-2 -mr-2" onClick={() => setMobileOpen(false)} aria-label="Zamknij"><X className="w-5 h-5" aria-hidden /></button>
            </div>

            {user && !hideSearch && (
              <div className="relative">
                <ServiceAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onPick={(service) => {
                    setSearchQuery(service);
                    setMobileOpen(false);
                    navigate(`/home?search=${encodeURIComponent(service)}`);
                  }}
                  placeholder="Czego szukasz?"
                  className="w-full"
                />
              </div>
            )}

            {user && user.role === 'client' && (
              <Link to="/create-order" onClick={() => setMobileOpen(false)} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
              {UI.navOrders}
              </Link>
            )}

            {/* Zamienny przycisk Panel zleceń / Panel firmy (mobile) */}
            {user && (user?.role === "company_owner" || 
                      user?.role === "company_manager" ||
                      (user?.company && (user?.roleInCompany === "owner" || user?.roleInCompany === "manager" || user?.roleInCompany === "provider"))) && (
              location.pathname === "/provider-home" ? (
                <Link 
                  to="/company/dashboard" 
                  onClick={() => setMobileOpen(false)} 
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" aria-hidden />
                  <span>Panel firmy</span>
                </Link>
              ) : (
                <Link 
                  to="/provider-home" 
                  onClick={() => setMobileOpen(false)} 
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" aria-hidden />
                  <span>Panel zleceń</span>
                </Link>
              )
            )}

            {loading ? (
              <div style={{ width: 120, height: 32 }} />
            ) : user ? (
              <>
                <Link to="/inbox" onClick={() => setMobileOpen(false)} className="py-2">Wiadomości {count > 0 ? `(${count})` : ''}</Link>
                {(() => {
                  const isCompanyUser = user?.role === "company_owner" || 
                                      user?.role === "company_manager" ||
                                      (user?.company && (user?.roleInCompany === "owner" || user?.roleInCompany === "manager"));
                  return (
                    <Link 
                      to={isCompanyUser ? "/company/dashboard" : "/account"} 
                      onClick={() => setMobileOpen(false)} 
                      className="py-2"
                    >
                      {isCompanyUser ? "Panel firmy" : "Konto"}
                    </Link>
                  );
                })()}
                {user?.role === "provider" && (
                  <>
                    <Link to="/manage-services" onClick={() => setMobileOpen(false)} className="py-2">Zarządzanie usługami</Link>
                    <Link to="/kyc" onClick={() => setMobileOpen(false)} className="py-2">KYC</Link>
                  </>
                )}
                {(user?.role === "provider" || user?.role === "company_owner" || user?.role === "company_manager") && (
                  <>
                    <Link to="/provider-home" onClick={() => setMobileOpen(false)} className="py-2">Panel zleceń</Link>
                    <Link to="/company/dashboard" onClick={() => setMobileOpen(false)} className="py-2">Panel firmy</Link>
                  </>
                )}
                {user?.role === "admin" && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="py-2">Admin</Link>
                )}
                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="mt-2 rounded-md px-3 py-2 text-left transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-center transition-colors border" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                  Zaloguj się
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-helpfli-primary px-4 py-2 text-sm font-medium text-center">
                  Zarejestruj się
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </header>
  );
}