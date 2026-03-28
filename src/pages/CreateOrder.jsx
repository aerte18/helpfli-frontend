
import { apiUrl } from "@/lib/apiUrl";
import { useEffect, useMemo, useRef, useState } from "react";
import ServiceCategoryDropdown from '../components/ServiceCategoryDropdown';
import { useLocation, useNavigate } from "react-router-dom";
import { UI } from "../i18n/pl_ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/toast/ToastProvider";
import { useTelemetry } from "../hooks/useTelemetry";
import { Upload, Users, Briefcase, MapPin, FileText, Sparkles, CheckCircle, ShieldCheck, CreditCard, ShoppingCart, BarChart2, LocateFixed } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { openAI } from "../ai/chat/bus";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function CreateOrder() {
  const q = useQuery();
  const API = import.meta.env.VITE_API_URL || '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationState = useLocation();

  // parametry z URL i pre-wypełnione dane z profilu
  const serviceFromUrl = q.get("service") || "";
  const descFromUrl = q.get("desc") || "";
  const preFilled = locationState.state?.preFilled || {};
  const initialIsDirect = locationState.state?.direct || false;
  const mode = locationState.state?.mode || "order"; // "order" | "diy"
  const diySteps = preFilled.diySteps || [];
  const diyParts = preFilled.parts || [];

  const [orderType, setOrderType] = useState(initialIsDirect ? "direct" : "open"); // "open" | "direct"
  const [service, setService] = useState(preFilled.service || serviceFromUrl);
  const [serviceDetails, setServiceDetails] = useState(""); // doprecyzowanie usługi
  const [isOtherSubcategory, setIsOtherSubcategory] = useState(false); // czy wybrana podkategoria to "Inne"
  const [description, setDescription] = useState(descFromUrl);
  const [location, setLocation] = useState(preFilled.location || "");
  const [selectedProvider, setSelectedProvider] = useState(preFilled.providerId ? {
    id: preFilled.providerId,
    name: preFilled.providerName
  } : null);
  const [providerServices, setProviderServices] = useState([]); // usługi wybranego providera

  // Pobierz usługi wybranego providera (dla zleceń bezpośrednich)
  useEffect(() => {
    if (orderType === "direct" && selectedProvider?.id) {
      (async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(apiUrl(`/api/user-services/provider/${selectedProvider.id}`), {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const services = await res.json();
            setProviderServices(services || []);
          } else {
            setProviderServices([]);
          }
        } catch (error) {
          console.error("Błąd pobierania usług providera:", error);
          setProviderServices([]);
        }
      })();
    } else {
      setProviderServices([]);
    }
  }, [orderType, selectedProvider?.id, API]);
  const [providerSearchQuery, setProviderSearchQuery] = useState("");
  const [providerSearchResults, setProviderSearchResults] = useState([]);
  const [showProviderSearch, setShowProviderSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState(""); // opcjonalny budżet
  const [urgency, setUrgency] = useState(""); // pilność
  const [contactPreference, setContactPreference] = useState(""); // preferencje kontaktu
  const [paymentPreference, setPaymentPreference] = useState("system"); // preferencje płatności: "system" | "external"
  const [userLocation, setUserLocation] = useState(null); // geolokalizacja
  const [locationLoading, setLocationLoading] = useState(false);
  const [attachments, setAttachments] = useState([]); // załączniki
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [recommendedProviders, setRecommendedProviders] = useState(locationState.state?.recommendedProviders || []);
  const [priceHints, setPriceHints] = useState(locationState.state?.priceHints || null);
  const [loadingMatchRecommendations, setLoadingMatchRecommendations] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [createdOrderDirect, setCreatedOrderDirect] = useState(false);
  const { push: toast } = useToast();
  const {
    trackOrderFormStart,
    trackOrderStepView,
    trackOrderFormAbandon,
    trackOrderFormSuccess,
    trackOrderCreated,
  } = useTelemetry();
  const orderFormTrackedStep = useRef(0);
  const orderFormSubmitted = useRef(false);

  const isImageAttachment = (attachment) => {
    const mime = String(attachment?.mimeType || attachment?.type || '').toLowerCase();
    if (mime.startsWith('image/')) return true;
    const filename = String(attachment?.filename || '').toLowerCase();
    return /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(filename);
  };

  // Sprawdź czy użytkownik jest klientem
  useEffect(() => {
    if (user && user.role === 'provider') {
      navigate('/provider-home');
    }
  }, [user, navigate]);

  // Analityka: start formularza i krok 1
  useEffect(() => {
    if (!user) return;
    trackOrderFormStart();
    if (orderFormTrackedStep.current < 1) {
      orderFormTrackedStep.current = 1;
      trackOrderStepView(1);
    }
  }, [user, trackOrderFormStart, trackOrderStepView]);

  // Analityka: abandon (zamknięcie bez wysłania)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (orderFormSubmitted.current || showSuccess) return;
      const hasData = !!(service?.trim() || description?.trim() || budget?.trim() || location?.trim());
      if (hasData) {
        let lastStep = 1;
        if (description?.trim()) lastStep = 2;
        if (budget?.trim() || urgency) lastStep = 3;
        if (paymentPreference) lastStep = 4;
        if (location?.trim() || userLocation) lastStep = 5;
        if (attachments?.length) lastStep = 6;
        trackOrderFormAbandon(lastStep);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showSuccess, service, description, budget, location, userLocation, urgency, paymentPreference, attachments?.length, trackOrderFormAbandon]);

  // Funkcja do obsługi uploadu plików
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploadingFiles(true);
    const token = localStorage.getItem("token");
    
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(apiUrl(`/api/orders/temp-upload`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttachments(prev => [...prev, ...data.attachments]);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Błąd uploadu plików');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Błąd podczas dodawania plików');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Funkcja do usuwania załącznika
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Pobierz TOP 3 wykonawców z AI (match-top-providers) – gdy użytkownik ma usługę i lokalizację
  const fetchMatchRecommendations = async () => {
    if (!service || !service.trim()) {
      setError("Wybierz najpierw usługę.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Zaloguj się, aby pobrać rekomendacje.");
      return;
    }
    setLoadingMatchRecommendations(true);
    setError("");
    try {
      const params = new URLSearchParams({
        serviceCode: service.trim(),
        urgency: urgency || "normal"
      });
      if (userLocation?.lat != null && userLocation?.lng != null) {
        params.set("lat", String(userLocation.lat));
        params.set("lon", String(userLocation.lng));
      }
      const res = await fetch(apiUrl(`/api/ai/match-top-providers?${params}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Błąd pobierania rekomendacji");
      const list = data.providers || [];
      setRecommendedProviders(list);
      if (list.length === 0) setError("Brak dopasowanych wykonawców w Twojej okolicy. Spróbuj zmienić lokalizację lub wybierz „Diagnozuj z AI”.");
    } catch (err) {
      setError(err.message || "Nie udało się pobrać rekomendacji");
    } finally {
      setLoadingMatchRecommendations(false);
    }
  };

  /**
   * Flow zleceń:
   * 1. Klient tworzy zlecenie (status: "open")
   *    - "open": wielu wykonawców może składać oferty
   *    - "direct": zlecenie trafia bezpośrednio do wybranego wykonawcy
   * 
   * 2. Wykonawca składa ofertę (Offer model, status: "submitted")
   * 
   * 3. Klient akceptuje ofertę → POST /api/offers/:id/accept
   *    - order.status = "accepted"
   *    - order.paymentMethod = 'system' (przez Helpfli) lub 'external' (poza Helpfli)
   *    - Jeśli 'system' → przekierowanie do checkout (płatność przez Stripe escrow)
   *    - Jeśli 'external' → brak gwarancji Helpfli
   * 
   * 4. Płatność:
   *    - 'system': checkout → status "funded" (środki w escrow) → gwarancja aktywna
   *    - 'external': brak płatności w systemie → brak gwarancji
   * 
   * 5. Wykonawca wykonuje usługę:
   *    - POST /api/orders/:id/start → status "in_progress"
   *    - POST /api/orders/:id/complete → status "completed"
   * 
   * 6. Klient potwierdza odbiór:
   *    - POST /api/orders/:id/confirm-receipt → status "released"
   *    - Jeśli płatność 'system': uwolnienie środków z escrow do wykonawcy
   * 
   * Flow AI Asystenta:
   * - AI rozmawia z użytkownikiem i zbiera informacje o problemie
   * - Gdy AI nie może pomóc (np. problem wymaga wykonawcy), proponuje utworzenie zlecenia
   * - AI NIE tworzy zlecenia automatycznie - wymaga potwierdzenia użytkownika
   * - Po potwierdzeniu → POST /api/ai/assistant/create-order → zlecenie utworzone
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isOtherSubcategory && (!serviceDetails || !serviceDetails.trim())) {
      setError("Wybierając „Inne” jako usługę, opisz proszę dokładnie, czego potrzebujesz (np. naprawa drzwi, wymiana zawiasów).");
      return;
    }
    setSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Brak tokenu — zaloguj się ponownie.");
      setSubmitting(false);
      return;
    }


    try {
      // Jeśli użytkownik wpisał doprecyzowanie, dodaj je do opisu
      let finalDescription = description;
      if (serviceDetails && serviceDetails.trim()) {
        finalDescription = serviceDetails.trim() + "\n\n" + description;
      }

      const payload = {
        service,
        description: finalDescription,
        serviceDetails: serviceDetails.trim() || undefined, // zapisz też osobno dla łatwiejszego wyświetlania
        location: location || "Do ustalenia",
        type: orderType === "direct" ? "direct" : "open",
        status: "open", // zlecenie otwarte na propozycje (lub bezpośrednie do wykonawcy)
        priority: "normal", // zawsze normal, pilność jest w urgency
      };

      // Dla zleceń bezpośrednich dodaj providerId
      if (orderType === "direct" && selectedProvider?.id) {
        payload.providerId = selectedProvider.id;
        payload.direct = true;
      }
      
      // Dodaj budżet jeśli podano (jako wskazówka dla providerów)
      if (budget && budget.trim()) {
        payload.budget = parseFloat(budget);
      }
      
      // Dodaj pilność - jeśli checkbox "Pilne" jest zaznaczony, ustaw urgency="now"
      if (urgency) {
        payload.urgency = urgency;
      }
      
      // Dodaj preferencje kontaktu jeśli wybrano
      if (contactPreference) {
        payload.contactPreference = contactPreference;
      }
      
      // Dodaj preferencje płatności - zgodnie z flow
      // "system" = Helpfli Protect (z gwarancją), "external" = płatność poza systemem (bez gwarancji)
      if (paymentPreference) {
        payload.paymentPreference = paymentPreference;
        payload.paymentMethod = paymentPreference; // Ustaw paymentMethod zgodnie z wyborem
      }
      
      // Dodaj załączniki jeśli są
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }
      
      // Dodaj współrzędne jeśli dostępne
      if (userLocation) {
        payload.locationLat = userLocation.lat;
        payload.locationLon = userLocation.lng;
      }

      const r = await fetch(apiUrl(`/api/orders`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.message || data.error || "Błąd tworzenia zlecenia.");

      setSubmitting(false);
      const orderId = data._id || data.orderId || data.id || "";
      orderFormSubmitted.current = true;
      setCreatedOrderId(orderId);
      setCreatedOrderDirect(orderType === "direct");
      setShowSuccess(true);
      trackOrderFormSuccess(orderId, orderType === "direct" ? "direct" : "open");
      trackOrderCreated(orderId, service, "manual");
      toast({ title: "Zlecenie utworzone", description: orderType === "direct" ? "Wysłano zapytanie do wykonawcy." : "Wykonawcy zobaczą Twoje zlecenie.", variant: "success" });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const reverseGeocodeLatLng = async (lat, lng) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "pl" } }
    );
    const data = await response.json();
    if (!data || data.error) return null;
    if (typeof data.display_name === "string" && data.display_name.trim()) {
      return data.display_name.trim();
    }
    const a = data.address || {};
    const parts = [
      [a.road, a.house_number].filter(Boolean).join(" "),
      a.city || a.town || a.village || a.municipality,
      a.postcode,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  };

  /** GPS + uzupełnienie pola adresem (jak w mapach), współrzędne do dopasowania wykonawców. */
  const fillLocationFromDevice = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolokalizacja nie jest obsługiwana przez przeglądarkę.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        try {
          const label = await reverseGeocodeLatLng(lat, lng);
          setLocation(label || "Pozycja GPS — doprecyzuj adres ręcznie, jeśli trzeba");
        } catch (e) {
          console.error(e);
          setLocation("Pozycja GPS — doprecyzuj adres ręcznie");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setLocationLoading(false);
        setError("Nie udało się pobrać lokalizacji. Zezwól na dostęp w przeglądarce lub wpisz adres ręcznie.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };


  // Ekran sukcesu po utworzeniu zlecenia
  if (showSuccess && createdOrderId) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Zlecenie utworzone</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              {createdOrderDirect ? "Wysłaliśmy zapytanie do wybranego wykonawcy." : "Wykonawcy zobaczą Twoje zlecenie i będą mogli składać oferty."}
            </p>
            <div className="rounded-lg p-4 text-left mb-6" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Co dalej?</div>
              <ul className="text-sm space-y-1" style={{ color: 'var(--muted-foreground)' }}>
                {createdOrderDirect ? (
                  <>
                    <li>• Otrzymasz powiadomienie o wycenie od wykonawcy</li>
                    <li>• Po akceptacji oferty i płatności – Gwarancja Helpfli (jeśli płatność przez system)</li>
                  </>
                ) : (
                  <>
                    <li>• Wykonawcy będą składać propozycje – dostaniesz powiadomienia</li>
                    <li>• Po wyborze wykonawcy i akceptacji oferty możesz zapłacić przez Helpfli (gwarancja) lub poza systemem</li>
                  </>
                )}
                <li>• W każdej chwili możesz pisać na czacie przy zleceniu</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => navigate(createdOrderDirect ? `/orders/${createdOrderId}/chat` : `/orders/${createdOrderId}`)}
              className="w-full py-3 px-6 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {createdOrderDirect ? "Przejdź do czatu" : "Zobacz zlecenie"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <Helmet>
        <title>Utwórz zlecenie | Helpfli</title>
        <meta name="description" content="Opisz, w czym potrzebujesz pomocy. Wykonawcy z Twojej okolicy złożą oferty. Szybko i bezpiecznie przez Helpfli." />
      </Helmet>
      <div className="container mx-auto px-4 pt-8 pb-32 md:pb-8 max-w-3xl">
        {/* Główny formularz w jednej karcie */}
        <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              {UI.orderTitle}
            </h1>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Opisz swój problem, a wykonawcy odpowiedzą z najlepszymi ofertami
            </p>
          </div>

          {/* CTA: Najpierw zapytaj AI */}
          {recommendedProviders.length === 0 && orderType === "open" && (
            <div className="mb-6 pb-6 border-b rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ backgroundColor: 'oklch(0.97 0.02 260)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'oklch(0.88 0.1 260)' }}>
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 mb-1">Rekomendowane dla osób niezdecydowanych</span>
                  <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Chcesz, żeby AI podpowiedziało wykonawców i cenę?</h2>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Asystent przeanalizuje Twój problem i zaproponuje TOP wykonawców oraz szacunek kosztów.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openAI('modal', '')}
                  className="px-5 py-2.5 rounded-lg font-medium text-white transition-colors shadow-sm"
                  style={{ backgroundColor: 'var(--primary)' }}
                  aria-label="Otwórz asystenta AI do diagnozy problemu i rekomendacji wykonawców"
                >
                  Diagnozuj z AI
                </button>
                {service && (location || userLocation) && (
                  <>
                    <button
                      type="button"
                      onClick={fetchMatchRecommendations}
                      disabled={loadingMatchRecommendations}
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-60"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      {loadingMatchRecommendations ? "Pobieram…" : "Pobierz rekomendacje AI"}
                    </button>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Dobierzemy 3 najlepszych wykonawców w Twojej okolicy</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TOP 3 wykonawców z Asystenta AI */}
          {recommendedProviders.length > 0 && orderType === "open" && (
            <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'oklch(0.88 0.08 240)' }}>
                🎯
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>AI wybrało TOP {recommendedProviders.length} wykonawców</h2>
                <p className="text-sm md:text-base" style={{ color: 'var(--muted-foreground)' }}>Najlepiej dopasowani do Twojego zlecenia</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {recommendedProviders.slice(0, 3).map((provider, idx) => (
                <div
                  key={provider._id || provider.id || idx}
                  onClick={() => {
                    setSelectedProvider({
                      id: provider._id || provider.id,
                      name: provider.name
                    });
                    setOrderType("direct");
                    setShowProviderSearch(false);
                    // Wyczyść wybraną usługę i kategorię przy wyborze providera z rekomendacji
                    setService("");
                    setSelectedCategory(null);
                    setServiceDetails("");
                    setIsOtherSubcategory(false);
                  }}
                  className="p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <img
                      src={provider.avatar || "https://via.placeholder.com/48"}
                      alt={provider.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{provider.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {provider.verified && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">✓</span>
                        )}
                        {provider.providerTier === 'pro' && (
                          <span className="px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded font-bold">TOP</span>
                        )}
                        {provider.isOnline && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                    {provider.rating && (
                      <span className="flex items-center gap-1">
                        ⭐ {provider.rating.toFixed(1)}
                        {provider.ratingCount > 0 && ` (${provider.ratingCount})`}
                      </span>
                    )}
                    {provider.distanceKm && (
                      <span>📍 {provider.distanceKm.toFixed(1)} km</span>
                    )}
                  </div>
                  {provider.score && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Dopasowanie</div>
                      <div className="text-lg font-bold text-indigo-600">{provider.score}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setRecommendedProviders([])}
              className="text-sm underline transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Ukryj rekomendacje
            </button>
          </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-6">

        <div className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: 'var(--muted-foreground)' }}>Krok 1 — Typ zlecenia i usługa</div>

        {/* Tryb DIY - wyświetl kroki */}
        {mode === "diy" && diySteps.length > 0 && (
          <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'oklch(0.88 0.08 240)' }}>
                🔧
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Kroki naprawy DIY</h2>
                <p className="text-sm md:text-base" style={{ color: 'var(--muted-foreground)' }}>Wykonaj kroki poniżej, aby rozwiązać problem</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              {diySteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm text-gray-700">{step.text || step}</div>
                </div>
              ))}
            </div>

            {diyParts.length > 0 && (
              <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
                <div className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}><ShoppingCart className="w-5 h-5 shrink-0" aria-hidden /> Potrzebne części:</div>
                <ul className="text-sm space-y-1">
                  {diyParts.map((part, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{part.name} × {part.qty || 1}</span>
                      <span className="text-gray-500">{part.approxPrice || ''} {part.unit || 'zł'}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-500 mt-2">
                  Dostępne w marketach: Castorama, OBI, Leroy Merlin
                </div>
              </div>
            )}

            <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: 'oklch(0.95 0.05 60)', borderColor: 'oklch(0.7 0.1 60)' }}>
              <div className="text-sm" style={{ color: 'oklch(0.4 0.1 60)' }}>
                <strong>Nie pomogło?</strong> Możesz teraz utworzyć zlecenie dla wykonawcy poniżej.
              </div>
            </div>
          </div>
        )}

        {/* Przełącznik typu zlecenia */}
        <div className="space-y-3">
          <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Typ zlecenia
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setOrderType("open");
                setSelectedProvider(null);
                setShowProviderSearch(false);
                // Wyczyść wybraną usługę i kategorię przy zmianie na "open"
                setService("");
                setSelectedCategory(null);
                setServiceDetails("");
                setIsOtherSubcategory(false);
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                orderType === "open"
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
              style={orderType === "open" ? {} : { backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>Zapytanie do wielu wykonawców</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Otrzymasz oferty od różnych wykonawców</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType("direct");
                setShowProviderSearch(true);
                // Wyczyść wybraną usługę i kategorię przy zmianie na "direct" (jeśli nie ma wybranego providera)
                if (!selectedProvider) {
                  setService("");
                  setSelectedCategory(null);
                  setServiceDetails("");
                  setIsOtherSubcategory(false);
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                orderType === "direct"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
              style={orderType === "direct" ? {} : { backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-5 w-5" style={{ color: 'oklch(0.4 0.15 240)' }} />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>Bezpośrednie zlecenie</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Wybierz konkretnego wykonawcę</p>
            </button>
          </div>
        </div>

        {/* Selektor providera dla zleceń bezpośrednich */}
        {orderType === "direct" && (
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)' }}>
            {selectedProvider ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}>
                    <span className="font-medium" style={{ color: 'var(--primary)' }}>
                      {selectedProvider.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                      Wybrany wykonawca: {selectedProvider.name}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      To zlecenie trafi bezpośrednio do tego wykonawcy. Możesz dodać szczegóły poniżej.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider(null);
                    setShowProviderSearch(true);
                    // Wyczyść wybraną usługę i kategorię przy usunięciu providera
                    setService("");
                    setSelectedCategory(null);
                    setServiceDetails("");
                    setIsOtherSubcategory(false);
                  }}
                  className="text-sm underline"
                  style={{ color: 'oklch(0.4 0.15 240)' }}
                >
                  Zmień
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Wybierz wykonawcę
                </label>
                <input
                  type="text"
                  value={providerSearchQuery}
                  onChange={(e) => {
                    setProviderSearchQuery(e.target.value);
                    if (e.target.value.length > 2) {
                      // Wyszukaj providerów
                      const token = localStorage.getItem("token");
                      fetch(apiUrl(`/api/search?q=${encodeURIComponent(e.target.value)}&limit=5`), {
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        }
                      })
                        .then(res => res.json())
                        .then(data => {
                          const items = Array.isArray(data) ? data : (data?.providers || []);
                          setProviderSearchResults(items.slice(0, 5));
                          setShowProviderSearch(true);
                        })
                        .catch(() => setProviderSearchResults([]));
                    } else {
                      setProviderSearchResults([]);
                      setShowProviderSearch(false);
                    }
                  }}
                  placeholder="Wpisz nazwę wykonawcy..."
                  className="w-full rounded-lg border border-blue-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {showProviderSearch && providerSearchResults.length > 0 && (
                  <div className="mt-2 border border-blue-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                    {providerSearchResults.map((p) => (
                      <button
                        key={p._id || p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProvider({
                            id: p._id || p.id,
                            name: p.name
                          });
                          setProviderSearchQuery(p.name);
                          setShowProviderSearch(false);
                          // Wyczyść wybraną usługę i kategorię przy zmianie providera
                          setService("");
                          setSelectedCategory(null);
                          setServiceDetails("");
                          setIsOtherSubcategory(false);
                        }}
                        style={{ borderBottomColor: 'var(--border)' }}
                        className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-b-0 flex items-center gap-3"
                      >
                        <img
                          src={p.avatarUrl || p.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(p.name)}`}
                          alt={p.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.service || "Wykonawca"}</div>
                        </div>
                        {p.rating && (
                          <div className="text-sm text-gray-600">⭐ {p.rating}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Kategoria i usługa - jeden dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Rodzaj pomocy</label>
          {orderType === "direct" && selectedProvider && providerServices.length > 0 && (
            <div className="text-xs mb-2 p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.95 0.05 240)', borderColor: 'oklch(0.7 0.1 240)', color: 'oklch(0.4 0.1 240)' }}>
              <strong>ℹ️</strong> Wyświetlane są tylko usługi wybranego wykonawcy: <strong>{selectedProvider.name}</strong>
            </div>
          )}
          {orderType === "direct" && selectedProvider && providerServices.length === 0 && (
            <div className="text-xs mb-2 p-2 rounded-lg" style={{ backgroundColor: 'oklch(0.95 0.05 60)', borderColor: 'oklch(0.7 0.1 60)', color: 'oklch(0.4 0.1 60)' }}>
              <strong>⚠️</strong> Wykonawca <strong>{selectedProvider.name}</strong> nie ma jeszcze przypisanych usług. Wybierz innego wykonawcę lub zmień typ zlecenia.
            </div>
          )}
          <ServiceCategoryDropdown
            onCategorySelect={(categoryData) => {
              setSelectedCategory(categoryData);
              // Ustaw pełną nazwę: kategoria + subkategoria (jeśli jest)
              const fullServiceName = categoryData.subcategory 
                ? `${categoryData.category} - ${categoryData.subcategory}`
                : categoryData.category;
              setService(fullServiceName);
              
              // Sprawdź czy wybrana podkategoria to "Inne"
              const isOther = categoryData.subcategory && (
                categoryData.subcategory.toLowerCase() === 'inne' ||
                categoryData.subcategoryId?.toLowerCase().includes('inne') ||
                categoryData.subcategorySlug?.toLowerCase().includes('inne')
              );
              setIsOtherSubcategory(isOther || false);
              
              // Wyczyść doprecyzowanie przy zmianie kategorii (chyba że to "Inne")
              if (!isOther) {
                setServiceDetails("");
              }
            }}
            placeholder="Wybierz kategorię i usługę"
            showIcon={false}
            providerServices={orderType === "direct" && selectedProvider ? providerServices : []}
            showOnlyProviderServices={orderType === "direct" && selectedProvider ? true : false}
          />
          {/* Pole z automatycznie wypełnioną usługą (tylko do odczytu) - pokazuje się TYLKO po wyborze z dropdowna */}
          {selectedCategory && service && (
            <input
              value={service}
              readOnly
              className="w-full rounded-md border h-9 px-3 py-1 text-sm bg-gray-50 cursor-not-allowed mt-2"
              style={{ 
                backgroundColor: 'var(--muted)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            />
          )}
          {/* Pole do doprecyzowania usługi - pokazuje się TYLKO gdy wybrana podkategoria to "Inne" */}
          {selectedCategory && service && isOtherSubcategory && (
            <>
              <input
                value={serviceDetails}
                onChange={(e) => setServiceDetails(e.target.value)}
                placeholder="np. naprawa drzwi przesuwnych szafy, wymiana zawiasów..."
              className="w-full rounded-md border h-9 px-3 py-1 text-sm focus:outline-none focus:ring-2 transition-all mt-2"
              style={{ 
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              {isOtherSubcategory && !serviceDetails?.trim() && (
                <p className="text-xs text-amber-600 mt-1">Opisz dokładnie usługę – wykonawcy lepiej dopasują oferty.</p>
              )}
            </>
          )}
        </div>

        <div className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: 'var(--muted-foreground)' }}>Krok 2 — Opisz problem</div>
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Opisz, w czym potrzebujesz pomocy</label>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Napisz m.in.: co nie działa, od kiedy, model sprzętu lub metraż, co już próbowałeś.</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => { 
              if (orderFormTrackedStep.current < 2) { 
                orderFormTrackedStep.current = 2; 
                trackOrderStepView(2); 
              }
              e.target.style.borderColor = 'var(--ring)';
            }}
            rows={5}
            maxLength={2000}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all resize-none min-h-[120px]"
            style={{ 
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            placeholder="Napisz, jaka pomoc jest potrzebna..."
            required
          />
          <p className="text-xs flex justify-between" style={{ color: 'var(--muted-foreground)' }}>
            <span>Minimum 20 znaków dla lepszych wycen. {description.length < 20 && description.length > 0 && <span className="text-amber-600">({20 - description.length} znaków brakuje)</span>}</span>
            <span>{description.length}/2000</span>
          </p>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: 'var(--muted-foreground)' }}>Krok 3 — Budżet i termin</div>
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Szacowany budżet <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(opcjonalnie)</span>
          </label>
          {priceHints && priceHints.multipliers && priceHints.multipliers.total > 1.05 && (
            <div className="text-xs rounded-lg p-3 border" style={{ backgroundColor: 'oklch(0.95 0.05 60)', borderColor: 'oklch(0.7 0.1 60)', color: 'oklch(0.4 0.1 60)' }}>
              <strong className="inline-flex items-center gap-1"><BarChart2 className="w-4 h-4 shrink-0" aria-hidden /> Dynamiczne ceny:</strong> Obecnie {priceHints.factors?.demandLevel === 'high' ? 'duży popyt' : priceHints.factors?.isWeekend ? 'weekend' : priceHints.factors?.timeOfDay === 'night' ? 'noc' : 'wyższy popyt'} – typowe ceny są o ~{Math.round((priceHints.multipliers.total - 1) * 100)}% wyższe. Szacowany zakres: <strong>{priceHints.min}–{priceHints.max} zł</strong>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <input
              type="number"
              min={0}
              step={10}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              onFocus={(e) => { 
                if (orderFormTrackedStep.current < 3) { 
                  orderFormTrackedStep.current = 3; 
                  trackOrderStepView(3); 
                }
                e.target.style.borderColor = 'var(--ring)';
              }}
              placeholder="np. 200"
              className="flex-1 min-w-[120px] rounded-md border h-9 px-3 py-1 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <span className="self-center text-sm" style={{ color: 'var(--muted-foreground)' }}>zł</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setBudget("")} className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Nie wiem</button>
            <button type="button" onClick={() => setBudget("200")} className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>≤ 200 zł</button>
            <button type="button" onClick={() => setBudget("350")} className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>200–500 zł</button>
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: 'var(--muted-foreground)' }}>Krok 4 — Rozliczenie</div>
        <div className="space-y-3">
          <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Preferowane rozliczenie
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all" 
              style={{ 
                borderColor: paymentPreference === 'system' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: paymentPreference === 'system' ? 'var(--accent)' : 'var(--card)'
              }}>
              <input
                type="radio"
                name="paymentPreference"
                value="system"
                checked={paymentPreference === 'system'}
                onChange={(e) => setPaymentPreference(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2 flex-wrap" style={{ color: 'var(--foreground)' }}>
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden />
                  <span>Helpfli Protect (rekomendowane)</span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Rekomendowane</span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Płatność przez system Helpfli. Ochrona płatności i możliwość sporu – bezpieczne rozliczenie.
                </p>
              </div>
            </label>
            
            <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all" 
              style={{ 
                borderColor: paymentPreference === 'external' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: paymentPreference === 'external' ? 'var(--accent)' : 'var(--card)'
              }}>
              <input
                type="radio"
                name="paymentPreference"
                value="external"
                checked={paymentPreference === 'external'}
                onChange={(e) => setPaymentPreference(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <CreditCard className="w-5 h-5 shrink-0" aria-hidden />
                  <span>Płatność poza systemem</span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Rozliczenie bezpośrednio z wykonawcą. Ta opcja jest bardziej ryzykowna – Helpfli nie pomoże w razie problemu z płatnością.
                </p>
              </div>
            </label>
            
            <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all" 
              style={{ 
                borderColor: paymentPreference === 'both' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: paymentPreference === 'both' ? 'var(--accent)' : 'var(--card)'
              }}>
              <input
                type="radio"
                name="paymentPreference"
                value="both"
                checked={paymentPreference === 'both'}
                onChange={(e) => setPaymentPreference(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden />
                  <CreditCard className="w-5 h-5 shrink-0" aria-hidden />
                  <span>Oba – Helpfli lub poza systemem</span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Zostaw wybór metody płatności na później – możesz zapłacić przez Helpfli (gwarancja) lub bezpośrednio wykonawcy.
                </p>
              </div>
            </label>
            
          </div>
        </div>

        {/* Pilność */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Kiedy ma nastąpić pomoc</label>
          <select
            value={urgency}
            onChange={(e) => {
              const newUrgency = e.target.value;
              setUrgency(newUrgency);
            }}
            className="w-full rounded-md border h-9 px-3 py-1 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ 
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="">Wybierz termin (opcjonalnie)</option>
            <option value="now">Pilne (teraz)</option>
            <option value="today">Dzisiaj</option>
            <option value="tomorrow">Jutro</option>
            <option value="this_week">W tym tygodniu</option>
            <option value="flexible">Elastycznie</option>
          </select>
          </div>

        {/* Preferencje kontaktu */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Preferowana metoda kontaktu</label>
          <select
            value={contactPreference}
            onChange={(e) => setContactPreference(e.target.value)}
            className="w-full rounded-md border h-9 px-3 py-1 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ 
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="">Wybierz preferencję (opcjonalnie)</option>
            <option value="phone">Telefon</option>
            <option value="email">Email</option>
            <option value="chat">Chat w aplikacji</option>
            <option value="any">Dowolny</option>
          </select>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: 'var(--muted-foreground)' }}>Krok 5 — Lokalizacja</div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <MapPin className="h-4 w-4" />
            Lokalizacja
          </label>
          <div className="flex gap-2 items-center">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={(e) => { 
                if (orderFormTrackedStep.current < 5) { 
                  orderFormTrackedStep.current = 5; 
                  trackOrderStepView(5); 
                }
                e.target.style.borderColor = 'var(--ring)';
              }}
              placeholder="np. Warszawa, Mokotów – zostaw puste, ustalimy później"
              className="flex-1 rounded-md border h-9 px-3 py-1 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="button"
              onClick={fillLocationFromDevice}
              disabled={locationLoading}
              title="Użyj mojej aktualnej lokalizacji"
              aria-label="Użyj mojej aktualnej lokalizacji — przeglądarka może zapytać o zgodę na dostęp do GPS"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90"
              style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
            >
              {locationLoading ? (
                <span className="h-4 w-4 animate-pulse rounded-full bg-[var(--muted-foreground)]" aria-hidden />
              ) : (
                <LocateFixed className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Ikona celownika uzupełnia adres z GPS (Nominatim). Przeglądarka może poprosić o zgodę na lokalizację.
          </p>
          {userLocation && (
            <div className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
              <span>✓</span>
              <span>Współrzędne zapisane w zleceniu — wykonawcy widzą zlecenie w okolicy na mapie / w liście wg odległości.</span>
            </div>
          )}
        </div>

        <div className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: 'var(--muted-foreground)' }}>Krok 6 — Załączniki</div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <FileText className="h-4 w-4" />
            Załączniki <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(opcjonalnie)</span>
          </label>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Najpierw zrób zdjęcie problemu – znacznie przyspieszy wycenę.</p>
          <div className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer" 
            style={{ borderColor: 'var(--border)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--muted-foreground)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <input
              type="file"
              multiple
              accept="image/*,.webp,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
              disabled={uploadingFiles}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploadingFiles ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Przesyłanie...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Kliknij, aby dodać zdjęcia lub dokumenty</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Obsługujemy pliki .JPG, .PNG, .WEBP, .HEIC/.HEIF, .PDF, .DOC, .DOCX, .XLS, .XLSX
                  </p>
                </>
              )}
            </label>
          </div>
            
            {/* Lista załączników */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg p-3 border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      {isImageAttachment(attachment) ? (
                        <img
                          src={apiUrl(attachment.url)}
                          alt={attachment.filename}
                          className="w-12 h-12 rounded object-cover border"
                          style={{ borderColor: 'var(--border)' }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-lg">📄</div>
                      )}
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{attachment.filename}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-sm transition-colors hover:opacity-80"
                      style={{ color: 'oklch(0.5 0.2 20)' }}
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>

        {error && (
          <div className="p-4 rounded-xl border text-sm md:text-base" style={{ backgroundColor: 'oklch(0.95 0.05 20)', borderColor: 'oklch(0.7 0.1 20)', color: 'oklch(0.4 0.1 20)' }}>
            {error}
          </div>
        )}

        <div className="mt-6 md:mt-8">
          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 px-4 py-3 md:static md:z-auto md:border-t-0 md:bg-transparent md:px-0 md:py-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="submit"
              disabled={submitting || !service.trim() || !description.trim() || (isOtherSubcategory && !serviceDetails?.trim())}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 md:py-6 text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl md:rounded-lg"
              aria-label="Wyślij zlecenie do wykonawców"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {UI.orderCTA}
                </>
              ) : (
                UI.orderCTA
              )}
            </button>
            
            {(!service.trim() || !description.trim() || (isOtherSubcategory && !serviceDetails?.trim())) && (
              <p className="mt-2 text-center text-xs md:text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Wypełnij kategorię, usługę i opis problemu (oraz doprecyzowanie przy „Inne”), aby kontynuować.
              </p>
            )}
          </div>
        </div>
      </form>
      </div>
      </div>
    </div>
  );
}