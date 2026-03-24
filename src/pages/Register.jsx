import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Logo from "../components/Logo";

const ROLE_OPTIONS = [
  { key: "client", label: "Klient" },
  { key: "provider", label: "Usługodawca" },
  { key: "company", label: "Firma wieloosobowa" },
];

function formatPhonePL(val) {
  // Usuwa wszystko poza cyframi i formatuje na +48 123 456 789
  const digits = val.replace(/\D/g, "");
  let out = digits;

  // dodaj prefix kraju, jeśli zaczyna się od 48/lub 0
  if (out.startsWith("48")) out = "+" + out;
  if (!out.startsWith("+48")) {
    if (out.startsWith("0")) out = out.slice(1);
    if (out.length >= 9) out = "+48" + out;
  }
  // finalne grupowanie
  const d = out.replace(/\D/g, "");
  const core = d.startsWith("48") ? d.slice(2) : d;
  const g = core.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
  if (!g) return "+48 ";
  const parts = [g[1], g[2], g[3]].filter(Boolean).join(" ");
  return "+48 " + parts.trim();
}

function passwordScore(pw) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(s, 5); // 0-5
}

function strengthLabel(score) {
  return ["Bardzo słabe", "Słabe", "OK", "Dobre", "Mocne", "Bardzo mocne"][score];
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "client",
    isB2B: false,
    accept: false,
    marketingSMS: false,
    marketingEmail: false,
    // Pola lokalizacji dla wykonawców
    address: "",
    locationCoords: null,
    // Pola firmy dla rejestracji firmy wieloosobowej
    companyName: "",
    companyNip: "",
    companyRegon: "",
    companyKrs: "",
    companyAddress: "",
    companyWebsite: "",
    companyDescription: "",
    // Dane do faktury (gdy provider zaznaczy "wystawiam faktury")
    billingCompanyName: "",
    billingNip: "",
    billingStreet: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "Polska",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  
  // Stany dla lokalizacji
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([52.2297, 21.0122]); // Warszawa

  // Ustaw rolę na podstawie parametru URL
  useEffect(() => {
    const roleFromUrl = searchParams.get('role');
    if (roleFromUrl === 'provider') {
      setForm(prev => ({ ...prev, role: 'provider' }));
    }
  }, [searchParams]);

  const score = useMemo(() => passwordScore(form.password), [form.password]);

  // Funkcja do pobierania geolokalizacji
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Twoja przeglądarka nie obsługuje geolokalizacji");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          locationCoords: { lat: latitude, lng: longitude }
        }));
        setMapCenter([latitude, longitude]);
        setLocationLoading(false);
        setShowLocationMap(true);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Nie udało się pobrać lokalizacji. Możesz wpisać adres ręcznie.");
        setLocationLoading(false);
      }
    );
  };

  // Funkcja do geokodowania adresu
  const geocodeAddress = async (address) => {
    if (!address.trim()) return;
    
    setLocationLoading(true);
    try {
      // Używamy OpenStreetMap Nominatim API (darmowe)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=pl`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setForm(prev => ({
          ...prev,
          locationCoords: { lat: parseFloat(lat), lng: parseFloat(lon) }
        }));
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setShowLocationMap(true);
      } else {
        setError("Nie znaleziono adresu. Sprawdź poprawność i spróbuj ponownie.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setError("Błąd podczas wyszukiwania adresu. Spróbuj ponownie.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "phone") {
      return setForm((p) => ({ ...p, phone: formatPhonePL(value) }));
    }
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Podaj imię i nazwisko / nazwę.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Podaj poprawny email.";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 11) return "Podaj poprawny numer telefonu (+48 xxx xxx xxx).";
    if (score < 3) return "Hasło jest za słabe (min. 8 znaków, zalecane duże/małe litery, cyfra i znak).";
    if (form.password !== form.confirmPassword) return "Hasła nie są identyczne.";
    if (!form.accept) return "Musisz zaakceptować regulamin.";
    
    // Walidacja lokalizacji dla wykonawców (wymagane) i klientów (opcjonalne)
    if (form.role === "provider") {
      if (!form.address.trim()) return "Podaj adres, w którym świadczysz usługi.";
      if (!form.locationCoords) return "Nie udało się zlokalizować adresu. Sprawdź poprawność adresu.";
    }
    // Dla klientów lokalizacja jest opcjonalna, ale jeśli podana, to musi być poprawna
    if (form.role === "client" && form.address.trim() && !form.locationCoords) {
      return "Nie udało się zlokalizować adresu. Sprawdź poprawność adresu lub zostaw puste.";
    }
    
    // Walidacja danych do faktury dla providera z "wystawiam faktury"
    if (form.role === "provider" && form.isB2B) {
      if (!form.billingCompanyName.trim()) return "Podaj nazwę firmy / działalności (do faktury).";
      if (!form.billingNip.trim()) return "Podaj NIP (do faktury).";
      const nipDigits = form.billingNip.replace(/\s/g, "");
      if (!/^\d{10}$/.test(nipDigits)) return "NIP musi składać się z 10 cyfr.";
      if (!form.billingStreet.trim()) return "Podaj ulicę i numer (adres do faktury).";
      if (!form.billingCity.trim()) return "Podaj miasto (adres do faktury).";
      if (!form.billingPostalCode.trim()) return "Podaj kod pocztowy (do faktury).";
    }
    // Walidacja pól firmy dla rejestracji firmy wieloosobowej
    if (form.role === "company") {
      if (!form.companyName.trim()) return "Podaj nazwę firmy.";
      if (!form.companyNip.trim()) return "Podaj NIP firmy.";
      if (!/^\d{10}$/.test(form.companyNip.replace(/\s/g, ""))) return "NIP musi składać się z 10 cyfr.";
      if (form.companyRegon && !/^\d{9}$|^\d{14}$/.test(form.companyRegon.replace(/\s/g, ""))) {
        return "REGON musi składać się z 9 lub 14 cyfr.";
      }
      if (form.companyKrs && !/^\d{10}$/.test(form.companyKrs.replace(/\s/g, ""))) {
        return "KRS musi składać się z 10 cyfr.";
      }
      if (!form.companyAddress.trim()) return "Podaj adres firmy.";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const v = validate();
    if (v) return setError(v);

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone.replace(/\s/g, ""),
          password: form.password,
          role: form.role === "company" ? "provider" : form.role, // provider dla firmy
          isB2B: form.role === "company" ? true : form.isB2B, // zawsze true dla firmy
          notificationPreferences: {
            marketing: {
              sms: form.marketingSMS,
              email: form.marketingEmail
            }
          },
          // Dane lokalizacji dla wykonawców (wymagane) i klientów (opcjonalne)
          address: form.address || undefined,
          locationCoords: form.locationCoords || undefined,
          // Dane firmy dla rejestracji firmy wieloosobowej
          company: form.role === "company" ? {
            name: form.companyName,
            nip: form.companyNip.replace(/\s/g, ""),
            regon: form.companyRegon ? form.companyRegon.replace(/\s/g, "") : undefined,
            krs: form.companyKrs ? form.companyKrs.replace(/\s/g, "") : undefined,
            address: form.companyAddress,
            website: form.companyWebsite || undefined,
            description: form.companyDescription || undefined,
          } : undefined,
          // Dane do faktury dla providera z "wystawiam faktury"
          billing: form.role === "provider" && form.isB2B ? {
            customerType: "company",
            companyName: form.billingCompanyName.trim(),
            nip: form.billingNip.replace(/\s/g, ""),
            street: form.billingStreet.trim(),
            city: form.billingCity.trim(),
            postalCode: form.billingPostalCode.trim(),
            country: form.billingCountry || "Polska",
          } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd rejestracji");

      // Pokaż komunikat sukcesu
      setSuccess(true);
      setSuccessMessage(data.message || "Konto zostało utworzone! Sprawdź swój email.");
      
      // Przekierowanie po rejestracji
      // Sprawdź rolę użytkownika z odpowiedzi (może być company_owner jeśli rejestrował firmę)
      const userRole = data.user?.role || form.role;
      
      // Przekieruj na właściwą stronę w zależności od roli
      if (userRole === "admin") {
        // Dla admina - przekieruj do panelu admina po 2 sekundach
        setTimeout(() => {
          navigate("/admin");
        }, 2000);
      } else if (userRole === "company_owner") {
        // Dla firmy wieloosobowej - przekieruj do panelu firmy po 2 sekundach
        setTimeout(() => {
          navigate("/account/company");
        }, 2000);
      } else if (userRole === "provider") {
        // Dla providera - przekieruj do provider-home po 2 sekundach
        setTimeout(() => {
          navigate("/provider-home");
        }, 2000);
      } else if (userRole === "client") {
        // Dla klienta - przekieruj do home po 2 sekundach
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
      <Helmet>
        <title>Rejestracja | Helpfli</title>
        <meta name="description" content="Zarejestruj się w Helpfli jako klient, wykonawca lub firma. Znajdź pomoc w okolicy lub oferuj usługi." />
      </Helmet>
      <div className="max-w-md w-full mx-auto p-6 border rounded-2xl shadow-lg bg-white">
        <div className="flex items-center justify-center mb-6">
          <Logo className="h-8 w-8" showText={true} textColor="text-indigo-800" clickable={true} />
        </div>

        <h2 className="text-2xl font-bold mb-1 text-center">Rejestracja</h2>
        <p className="text-center text-sm text-slate-500 mb-4">Wybierz typ konta i uzupełnij dane.</p>

        {/* Wybór roli */}
        <div className="mb-4">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {ROLE_OPTIONS.map((opt) => {
              const active = form.role === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: opt.key }))}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition
                    ${active ? "bg-white shadow text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {form.role === "provider"
              ? "Założysz konto wykonawcy. Po zalogowaniu możesz od razu ustawić swój profil w zakładce Konto."
              : form.role === "company"
              ? "Założysz firmę wieloosobową. Jako właściciel będziesz mógł zarządzać zespołem wykonawców."
              : "Założysz konto klienta. Od razu możesz tworzyć zlecenia."}
          </div>
        </div>

        {/* Formularz */}
        {error && <p className="text-red-500 text-center mb-3">{error}</p>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-green-800 font-medium">{successMessage}</p>
                <p className="text-green-600 text-sm mt-1">
                  Sprawdź swoją skrzynkę email i kliknij w link weryfikacyjny.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={() => navigate("/login")}
                className="text-green-700 hover:text-green-800 font-medium text-sm underline"
              >
                Przejdź do logowania
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Imię i nazwisko / nazwa"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="+48 123 456 789"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={form.phone}
            onChange={handleChange}
            required
          />

          {/* Pola firmy - dla rejestracji firmy wieloosobowej */}
          {form.role === "company" && (
            <>
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-700">Dane firmy</h3>
                
                <input
                  type="text"
                  name="companyName"
                  placeholder="Nazwa firmy *"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="companyNip"
                    placeholder="NIP * (10 cyfr)"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={form.companyNip}
                    onChange={handleChange}
                    maxLength="10"
                    required
                  />
                  <input
                    type="text"
                    name="companyRegon"
                    placeholder="REGON (opcjonalnie)"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={form.companyRegon}
                    onChange={handleChange}
                  />
                </div>
                
                <input
                  type="text"
                  name="companyKrs"
                  placeholder="KRS (opcjonalnie, 10 cyfr)"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={form.companyKrs}
                  onChange={handleChange}
                  maxLength="10"
                />
                
                <input
                  type="text"
                  name="companyAddress"
                  placeholder="Adres firmy *"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={form.companyAddress}
                  onChange={handleChange}
                  required
                />
                
                <input
                  type="url"
                  name="companyWebsite"
                  placeholder="Strona internetowa (opcjonalnie)"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={form.companyWebsite}
                  onChange={handleChange}
                />
                
                <textarea
                  name="companyDescription"
                  placeholder="Opis firmy (opcjonalnie)"
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={form.companyDescription}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Ustawienie: czy wykonawca wystawia faktury */}
          {form.role === "provider" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 border border-indigo-200 rounded-lg bg-indigo-50">
                <input
                  type="checkbox"
                  name="isB2B"
                  id="isB2B"
                  checked={form.isB2B}
                  onChange={handleChange}
                  className="mt-1"
                />
                <label htmlFor="isB2B" className="text-sm text-slate-700 cursor-pointer">
                  <span className="font-medium">Wystawiam faktury VAT za usługi</span>
                  <span className="block text-xs text-slate-600 mt-1">
                    Zaznacz, jeśli działasz jako firma (np. działalność gospodarcza) i wystawiasz faktury.
                    Poniżej podaj dane do faktury – będziesz mógł je edytować w ustawieniach konta.
                  </span>
                </label>
              </div>
              {/* Pola danych firmy do faktury – widoczne gdy zaznaczono "wystawiam faktury" */}
              {form.role === "provider" && form.isB2B && (
                <div className="space-y-3 border-t border-indigo-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-700">Dane do faktury</h3>
                  <input
                    type="text"
                    name="billingCompanyName"
                    placeholder="Nazwa firmy / działalności *"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={form.billingCompanyName}
                    onChange={handleChange}
                    required={form.isB2B}
                  />
                  <input
                    type="text"
                    name="billingNip"
                    placeholder="NIP * (10 cyfr)"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={form.billingNip}
                    onChange={handleChange}
                    maxLength={13}
                    required={form.isB2B}
                  />
                  <input
                    type="text"
                    name="billingStreet"
                    placeholder="Ulica i numer *"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={form.billingStreet}
                    onChange={handleChange}
                    required={form.isB2B}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="billingPostalCode"
                      placeholder="Kod pocztowy *"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={form.billingPostalCode}
                      onChange={handleChange}
                      required={form.isB2B}
                    />
                    <input
                      type="text"
                      name="billingCity"
                      placeholder="Miasto *"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={form.billingCity}
                      onChange={handleChange}
                      required={form.isB2B}
                    />
                  </div>
                  <input
                    type="text"
                    name="billingCountry"
                    placeholder="Kraj"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={form.billingCountry}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Pola lokalizacji - dla wykonawców (wymagane) i klientów (opcjonalne) */}
          {(form.role === "provider" || form.role === "client") && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {form.role === "provider" 
                    ? "Adres świadczenia usług *" 
                    : "Twój adres (opcjonalnie - dla lepszego wyszukiwania)"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="address"
                    placeholder="np. ul. Marszałkowska 1, Warszawa"
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={form.address}
                    onChange={handleChange}
                    required={form.role === "provider"}
                  />
                  <button
                    type="button"
                    onClick={() => geocodeAddress(form.address)}
                    disabled={locationLoading || !form.address.trim()}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {locationLoading ? "..." : "📍"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full p-2 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {locationLoading ? "Pobieranie lokalizacji..." : "🎯 Użyj mojej aktualnej lokalizacji"}
                </button>
              </div>

              {/* Mapa do weryfikacji lokalizacji */}
              {showLocationMap && form.locationCoords && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Weryfikacja lokalizacji
                  </label>
                  <div className="h-48 border rounded-lg bg-slate-100 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <div className="text-2xl mb-2">🗺️</div>
                      <p className="text-sm">Mapa będzie tutaj</p>
                      <p className="text-xs">Lat: {form.locationCoords.lat.toFixed(4)}</p>
                      <p className="text-xs">Lng: {form.locationCoords.lng.toFixed(4)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationMap(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Ukryj mapę
                  </button>
                </div>
              )}
            </>
          )}

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Hasło"
                className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {/* Miernik siły */}
            <div className="mt-2">
              <div className="h-2 w-full bg-slate-100 rounded">
                <div
                  className={`h-2 rounded ${
                    score <= 1 ? "bg-red-400 w-1/5" :
                    score === 2 ? "bg-orange-400 w-2/5" :
                    score === 3 ? "bg-yellow-400 w-3/5" :
                    score === 4 ? "bg-green-500 w-4/5" :
                    "bg-emerald-600 w-full"
                  }`}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">{strengthLabel(score)}</div>
            </div>
          </div>

          {/* Powtórz hasło */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Powtórz hasło"
              className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm select-none">
            <input
              type="checkbox"
              name="accept"
              checked={form.accept}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span>
              Akceptuję{" "}
              <Link to="/regulamin" target="_blank" className="text-blue-600 hover:underline">
                regulamin
              </Link>
              {" "}i{" "}
              <Link to="/prywatnosc" target="_blank" className="text-blue-600 hover:underline">
                politykę prywatności
              </Link>
            </span>
          </label>

          {/* Zgody marketingowe */}
          <div className="space-y-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
            <p className="text-xs font-medium text-slate-700 mb-2">Powiadomienia i reklamy (opcjonalnie):</p>
            <label className="flex items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                name="marketingSMS"
                checked={form.marketingSMS}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span>Wyrażam zgodę na otrzymywanie SMS-ów z ofertami i powiadomieniami (opcjonalnie)</span>
            </label>
            <label className="flex items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                name="marketingEmail"
                checked={form.marketingEmail}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span>Wyrażam zgodę na otrzymywanie e-maili marketingowych (opcjonalnie)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Rejestruję..." : "Zarejestruj"}
          </button>
        </form>
        )}

        {!success && (
          <p className="text-center text-sm text-slate-500 mt-3">
            Masz konto?{" "}
            <Link to="/login" className="text-indigo-700 hover:underline">Zaloguj się</Link>
          </p>
        )}
      </div>
    </div>
  );
}