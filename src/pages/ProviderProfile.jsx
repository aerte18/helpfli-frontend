import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AskQuoteModal from "../components/AskQuoteModal";
import StarRating from "../components/StarRating";
import ReportAbuseButton from "../components/ReportAbuseButton";
import RatingModal from "../components/RatingModal";
import { getProviderMini } from "../api/providers";
import { getProviderTrustBadges } from "../utils/providerTrustBadges";
import { getCategoryName } from "../utils/getProviderLabel";
import Footer from "../components/Footer";
import Portfolio from "./Portfolio";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Award,
  Shield,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Briefcase,
  Calendar,
  Banknote,
  Image,
} from "lucide-react";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiGet = async (path) => {
  const res = await fetch(path, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `GET ${path} failed`);
  return data;
};

const apiPost = async (path, body) => {
  const res = await fetch(path, { method: "POST", headers: authHeaders(), body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `POST ${path} failed`);
  return data;
};

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation(); // provider z listy / nawigacja z listy z openQuote
  const [provider, setProvider] = useState(state?.provider || null);
  const [providerData, setProviderData] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [openQuote, setOpenQuote] = useState(!!state?.openQuote);
  const [openRate, setOpenRate] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [error, setError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // 1) dociągnij średnią ocen
  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet(apiUrl(`/api/ratings/avg/${id}`));
        setAvgRating(r?.avg || r?.average || null);
      } catch {
        // brak ocen nie jest błędem blokującym
      }
    })();
  }, [id]);

  // 2) Pobierz dane mini-profilu (badges, metryki)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getProviderMini({ token, providerId: id });
        setProviderData(data);
      } catch (e) {
        console.error("Błąd pobierania mini-profilu:", e);
      }
    })();
  }, [id]);

  // 2b) Sprawdź czy bieżący użytkownik może ocenić tego providera (mają zakończone zlecenie)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return setCanRate(false);
        const res = await fetch(apiUrl(`/api/ratings/eligible?otherUser=${id}`), { headers: { Authorization: `Bearer ${token}` } });
        const j = await res.json();
        setCanRate(!!j.eligible);
      } catch { setCanRate(false); }
    })();
  }, [id]);

  // 3) Zawsze pobierz pełne dane providera (populated services) – także gdy przyszły z listy
  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet(apiUrl(`/api/users/${id}`));
        setProvider(r);
      } catch (e) {
        if (!provider) setError("Nie udało się pobrać profilu wykonawcy.");
      }
    })();
  }, [id]);

  const startInstantOrder = () => {
    const preFilledData = {
      providerId: provider._id,
      providerName: provider.name,
      service: selectedServiceId || provider.topService || provider.service || "usługa",
      location: provider?.location?.address || provider?.city || "",
    };
    
    navigate('/create-order', { 
      state: { 
        preFilled: preFilledData,
        direct: true
      } 
    });
  };

  if (!provider) {
    return (
      <div className="p-6">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="animate-pulse text-gray-500">Wczytywanie profilu…</div>
        )}
      </div>
    );
  }

  const isVerified = Array.isArray(providerData?.badges)
    ? providerData.badges.includes("verified")
    : (provider?.verified ?? false);
  const hasTopAi = Array.isArray(providerData?.badges) && providerData.badges.includes("top_ai");
  const providerInitials = provider.name
    ? provider.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PR';
  const memberSince = provider.createdAt 
    ? new Date(provider.createdAt).getFullYear().toString()
    : new Date().getFullYear().toString();
  const trustBadges = getProviderTrustBadges({
    ratingAvg: avgRating ?? providerData?.ratingAvg,
    ratingCount: providerData?.ratingCount,
    completedOrders: providerData?.completedOrders,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-background to-secondary/20 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full border-4 border-background shadow-lg overflow-hidden bg-primary/10 flex items-center justify-center">
              {provider.avatar ? (
                <img
                  src={provider.avatar}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-primary">
                  {providerInitials}
                </span>
              )}
            </div>

            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">Wykonawca {provider.name}</h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 text-sm">
                    <CheckCircle2 className="h-3 w-3" />
                    Zweryfikowany
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border text-muted-foreground text-sm">
                    <XCircle className="h-3 w-3" />
                    Niezweryfikowany
                  </span>
                )}
                {provider.company && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 text-sm">
                    <Briefcase className="h-3 w-3" />
                    {provider.company.isSinglePerson ? 'Własna działalność' : 'Firma z zespołem'}
                    {provider.company.isOwner && ' • Właściciel'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span>KYC: {provider?.kyc?.status || "nie rozpoczęto"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  <span>Formy pomocy: {provider.level || provider.providerLevel || "standard"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock
                    className={`h-4 w-4 ${providerData?.availability === "offline" ? "text-red-500" : "text-green-500"}`}
                  />
                  <span>Dostępność: {providerData?.availability === "offline" ? "offline" : "online"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Członek od {memberSince}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                {avgRating && avgRating > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({providerData?.ratingCount || 0} opinii)</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Brak opinii</span>
                )}
              </div>
              {/* Badge'e zaufania (Top oceniany, Nowy wykonawca, Doświadczony) */}
              {trustBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {trustBadges.map((b) => (
                    <span
                      key={b.key}
                      title={b.title}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
                    >
                      {b.key === 'top_rated' && '⭐ '}
                      {b.key === 'new_provider' && '🆕 '}
                      {b.key === 'experienced' && '✓ '}
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Ukończone zlecenia</span>
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-foreground">{providerData?.completedOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Wszystkich projektów</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Akceptacja ofert</span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-foreground">{providerData?.acceptanceRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Współczynnik akceptacji</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Terminowość</span>
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-foreground">{providerData?.onTimeRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Terminowych realizacji</p>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Opis</h2>
              </div>
              {provider.headline || provider.bio ? (
                <div className="space-y-3">
                  {provider.headline && (
                    <p className="text-base font-medium text-foreground">
                      {provider.headline}
                    </p>
                  )}
                  {provider.bio && (
                    <p className="text-muted-foreground leading-relaxed">
                      {provider.bio}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Wykonawca jeszcze nie dodał opisu.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Skontaktuj się bezpośrednio, aby poznać szczegóły usług.
                  </p>
                </div>
              )}
            </div>

            {/* Company Info */}
            {provider.company && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Firma</h2>
                </div>
                <div className="flex items-start gap-4">
                  {provider.company.logo && (
                    <img
                      src={provider.company.logo}
                      alt={provider.company.name}
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {provider.company.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                        {provider.company.isSinglePerson ? 'Własna działalność' : `Firma z zespołem (${provider.company.teamSize} osób)`}
                      </span>
                      {provider.company.isOwner && (
                        <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-100">
                          Właściciel
                        </span>
                      )}
                      {provider.company.isManager && !provider.company.isOwner && (
                        <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100">
                          Manager
                        </span>
                      )}
                      {provider.company.verified && (
                        <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100">
                          Zweryfikowana firma
                        </span>
                      )}
                    </div>
                    {provider.company.status === 'pending' && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Firma oczekuje na weryfikację
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Kategorie usług, które provider oferuje (z ManageServices) – np. Hydraulika, Teleporady */}
            {(() => {
              const displayNames = [];
              // 1) Zbierz unikalne kategorie (parent_slug) z provider.services
              if (provider.services?.length) {
                const categorySlugs = new Set();
                provider.services.forEach((s) => {
                  if (typeof s === 'object' && s?.parent_slug) {
                    categorySlugs.add(s.parent_slug);
                  }
                });
                categorySlugs.forEach((slug) => {
                  const name = getCategoryName(slug);
                  if (name) displayNames.push(name);
                });
              }
              // 2) Jeśli brak kategorii – użyj nazw usług (name_pl)
              if (displayNames.length === 0 && provider.services?.length) {
                provider.services.forEach((s) => {
                  if (typeof s === 'object') {
                    const n = s.name_pl || s.name_en || s.name || s.code;
                    if (n) displayNames.push(n);
                  }
                });
              }
              // 3) Fallback: allServices z wyszukiwania (nazwy string)
              if (displayNames.length === 0 && provider.allServices?.length) {
                provider.allServices.forEach((n) => {
                  if (typeof n === 'string' && n.trim()) displayNames.push(n.trim());
                });
              }
              if (displayNames.length === 0) return null;
              const uniqueNames = [...new Set(displayNames)];
              return (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Oferowane usługi</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueNames.map((name, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Price Range */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Zakres cen</h2>
              </div>
              {provider.priceNote ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">{provider.priceNote}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Banknote className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Brak danych o cenach.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Zapytaj o indywidualną wycenę dla swojego projektu.
                  </p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Ostatnie opinie</h2>
              </div>
              {provider.lastReviews?.length > 0 ? (
                <div className="space-y-4">
                  {provider.lastReviews.slice(0, 3).map((r) => (
                    <div key={r._id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating value={r.stars} size={14} />
                        <span className="font-medium text-foreground">{r.authorName || "Klient"}</span>
                      </div>
                      <p className="text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Brak opinii.</p>
                  <p className="text-sm text-muted-foreground mt-1">Wykonawca nie ma jeszcze żadnych ocen od klientów.</p>
                </div>
              )}
            </div>

            {/* Portfolio */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Image className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Portfolio</h2>
              </div>
              <Portfolio providerId={id} compact={true} />
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Szybkie akcje</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setOpenQuote(true)}
                  className="btn-helpfli-primary w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left"
                >
                  <span>Zapytaj o wycenę</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={startInstantOrder}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left font-medium transition-colors bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg"
                >
                  <span>Złóż zlecenie</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                {canRate && (
                  <button
                    onClick={() => setOpenRate(true)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 hover:text-yellow-900 transition-colors text-left font-medium"
                  >
                    <span>Oceń wykonawcę</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                <div className="border-t border-border my-3"></div>
                <div className="[&>button]:w-full [&>button]:justify-between [&>button]:flex [&>button]:items-center [&>button]:px-4 [&>button]:py-2.5 [&>button]:rounded-xl [&>button]:text-red-600 [&>button]:hover:text-red-700 [&>button]:hover:bg-red-50 [&>button]:bg-transparent [&>button]:border-0 [&>button]:text-left [&>button]:font-medium">
                  <ReportAbuseButton
                    reportedUserId={provider._id}
                    onReported={() => {}}
                  />
                </div>
              </div>
            </div>

            {/* Trust & Safety */}
            <div className="rounded-lg p-6 border border-border relative overflow-hidden"
              style={{
                backgroundColor: 'var(--card)'
              }}
            >
              {/* Delikatne tło gradientowe */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/10 dark:to-purple-950/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Bezpieczeństwo</h3>
                </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {isVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Weryfikacja tożsamości</p>
                    <p className="text-xs text-muted-foreground">
                      {isVerified ? "Zweryfikowany" : "Nie rozpoczęto"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {provider?.kyc?.status === 'verified' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Weryfikacja KYC</p>
                    <p className="text-xs text-muted-foreground">
                      {provider?.kyc?.status === 'verified' ? "Zweryfikowany" : "Nie rozpoczęto"}
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Help Banner */}
            <div className="rounded-lg p-6 border border-border relative overflow-hidden"
              style={{
                backgroundColor: 'var(--card)'
              }}
            >
              {/* Delikatne tło gradientowe */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10 pointer-events-none" />
              <div className="relative">
                <h3 className="font-semibold text-foreground mb-2">Potrzebujesz pomocy?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nasz zespół wsparcia jest dostępny 24/7, aby pomóc Ci w każdej sprawie.
                </p>
                <button
                  onClick={() => navigate('/help')}
                  className="btn-helpfli-primary w-full px-4 py-2.5 rounded-xl"
                >
                  Centrum pomocy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AskQuoteModal
        open={openQuote}
        onClose={() => setOpenQuote(false)}
        provider={provider}
        service={selectedServiceId}
      />
      <RatingModal
        open={openRate}
        onClose={() => setOpenRate(false)}
        providerId={provider._id}
        onSubmitted={() => {
          fetch(apiUrl(`/api/ratings/avg/${provider._id}`))
            .then(r => r.json())
            .then(d => setAvgRating(d?.avg || d?.average || avgRating))
            .catch(()=>{});
        }}
      />
      <Footer />
    </div>
  );
}
