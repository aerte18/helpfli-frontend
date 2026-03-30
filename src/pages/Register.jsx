import { apiUrl } from "@/lib/apiUrl";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LocateFixed } from "lucide-react";
import Logo from "../components/Logo";
import GeoSuggest from "../components/GeoSuggest";

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

  // Ustaw rolę na podstawie parametru URL
  useEffect(() => {
    const roleFromUrl = searchParams.get('role');
    if (roleFromUrl === 'provider') {
      setForm(prev => ({ ...prev, role: 'provider' }));
    }
  }, [searchParams]);

  const score = useMemo(() => passwordScore(form.password), [form.password]);

  /** Geokodowanie adresu → współrzędne (np. przed zapisem, gdy brak GPS z podpowiedzi). */
  const forwardGeocodeAddress = async (address) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=pl&addressdetails=1`,
      { headers: { "Accept-Language": "pl" } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  };

  /** Odwrotne geokodowanie — tekst adresu z GPS (jak w mapach). */
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

  /** Pinezka „moja lokalizacja”: GPS + uzupełnienie pola adresu. */
  const fillAddressFromDeviceLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Twoja przeglądarka nie obsługuje geolokalizacji.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const label = await reverseGeocodeLatLng(latitude, longitude);
          setForm((prev) => ({
            ...prev,
            address: label || prev.address,
            locationCoords: { lat: latitude, lng: longitude },
          }));
          if (!label) {
            setError(
              "Ustalono pozycję na mapie, ale nie udało się odczytać adresu — możesz go dopisać ręcznie."
            );
          }
        } catch (e) {
          console.error(e);
          setError("Nie udało się odczytać adresu. Możesz wpisać go ręcznie.");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(
          "Nie udało się pobrać lokalizacji. Zezwól na dostęp w ustawieniach przeglądarki lub wpisz adres ręcznie."
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "phone") {
      return setForm((p) => ({ ...p, phone: formatPhonePL(value) }));
    }
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validateForm = (f) => {
    const pwScore = passwordScore(f.password);
    if (!f.name.trim()) return "Podaj imię i nazwisko / nazwę.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return "Podaj poprawny email.";
    const digits = f.phone.replace(/\D/g, "");
    if (digits.length < 11) return "Podaj poprawny numer telefonu (+48 xxx xxx xxx).";
    if (pwScore < 3) return "Hasło jest za słabe (min. 8 znaków, zalecane duże/małe litery, cyfra i znak).";
    if (f.password !== f.confirmPassword) return "Hasła nie są identyczne.";
    if (!f.accept) return "Musisz zaakceptować regulamin.";

    if (f.role === "provider") {
      if (!f.address.trim()) return "Podaj adres, w którym świadczysz usługi.";
      if (!f.locationCoords) return "Nie udało się zlokalizować adresu. Użyj ikony lokalizacji lub wybierz adres z podpowiedzi.";
    }
    if (f.role === "client" && f.address.trim() && !f.locationCoords) {
      return "Nie udało się zlokalizować adresu. Użyj ikony lokalizacji, wybierz z listy lub zostaw pole adresu puste.";
    }

    if (f.role === "provider" && f.isB2B) {
      if (!f.billingCompanyName.trim()) return "Podaj nazwę firmy / działalności (do faktury).";
      if (!f.billingNip.trim()) return "Podaj NIP (do faktury).";
      const nipDigits = f.billingNip.replace(/\s/g, "");
      if (!/^\d{10}$/.test(nipDigits)) return "NIP musi składać się z 10 cyfr.";
      if (!f.billingStreet.trim()) return "Podaj ulicę i numer (adres do faktury).";
      if (!f.billingCity.trim()) return "Podaj miasto (adres do faktury).";
      if (!f.billingPostalCode.trim()) return "Podaj kod pocztowy (do faktury).";
    }
    if (f.role === "company") {
      if (!f.companyName.trim()) return "Podaj nazwę firmy.";
      if (!f.companyNip.trim()) return "Podaj NIP firmy.";
      if (!/^\d{10}$/.test(f.companyNip.replace(/\s/g, ""))) return "NIP musi składać się z 10 cyfr.";
      if (f.companyRegon && !/^\d{9}$|^\d{14}$/.test(f.companyRegon.replace(/\s/g, ""))) {
        return "REGON musi składać się z 9 lub 14 cyfr.";
      }
      if (f.companyKrs && !/^\d{10}$/.test(f.companyKrs.replace(/\s/g, ""))) {
        return "KRS musi składać się z 10 cyfr.";
      }
      if (!f.companyAddress.trim()) return "Podaj adres firmy.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    let snapshot = { ...form };
    if (
      (snapshot.role === "provider" || snapshot.role === "client") &&
      snapshot.address?.trim() &&
      !snapshot.locationCoords
    ) {
      setLocationLoading(true);
      try {
        const coords = await forwardGeocodeAddress(snapshot.address.trim());
        if (coords) {
          snapshot = { ...snapshot, locationCoords: coords };
          setForm((prev) => ({ ...prev, locationCoords: coords }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLocationLoading(false);
      }
    }

    const v = validateForm(snapshot);
    if (v) return setError(v);

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: snapshot.name,
          email: snapshot.email,
          phone: snapshot.phone.replace(/\s/g, ""),
          password: snapshot.password,
          role: snapshot.role === "company" ? "provider" : snapshot.role, // provider dla firmy
          isB2B: snapshot.role === "company" ? true : snapshot.isB2B, // zawsze true dla firmy
          notificationPreferences: {
            marketing: {
              sms: snapshot.marketingSMS,
              email: snapshot.marketingEmail
            }
          },
          address: snapshot.address || undefined,
          locationCoords: snapshot.locationCoords || undefined,
          company: snapshot.role === "company" ? {
            name: snapshot.companyName,
            nip: snapshot.companyNip.replace(/\s/g, ""),
            regon: snapshot.companyRegon ? snapshot.companyRegon.replace(/\s/g, "") : undefined,
            krs: snapshot.companyKrs ? snapshot.companyKrs.replace(/\s/g, "") : undefined,
            address: snapshot.companyAddress,
            website: snapshot.companyWebsite || undefined,
            description: snapshot.companyDescription || undefined,
          } : undefined,
          billing: snapshot.role === "provider" && snapshot.isB2B ? {
            customerType: "company",
            companyName: snapshot.billingCompanyName.trim(),
            nip: snapshot.billingNip.replace(/\s/g, ""),
            street: snapshot.billingStreet.trim(),
            city: snapshot.billingCity.trim(),
            postalCode: snapshot.billingPostalCode.trim(),
            country: snapshot.billingCountry || "Polska",
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
      const userRole = data.user?.role || snapshot.role;
      
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
        // Dla providera - przejdź przez onboarding (wybór usług), żeby od razu ustawić profil.
        setTimeout(() => {
          navigate("/onboarding");
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
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <GeoSuggest
                      value={form.address}
                      placeholder="np. ul. Marszałkowska 1, Warszawa"
                      proxyApi={false}
                      onChange={(nextAddress) => {
                        setForm((prev) => ({
                          ...prev,
                          address: nextAddress,
                        }));
                      }}
                      onPick={(item) => {
                        setError("");
                        setForm((prev) => ({
                          ...prev,
                          address: item?.label || prev.address,
                          locationCoords:
                            typeof item?.lat === "number" && typeof item?.lon === "number"
                              ? { lat: item.lat, lng: item.lon }
                              : prev.locationCoords,
                        }));
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fillAddressFromDeviceLocation}
                    disabled={locationLoading}
                    title="Użyj mojej aktualnej lokalizacji"
                    aria-label="Użyj mojej aktualnej lokalizacji — przeglądarka może zapytać o zgodę na dostęp do GPS"
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-600 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {locationLoading ? (
                      <span className="h-5 w-5 animate-pulse rounded-full bg-indigo-200" aria-hidden />
                    ) : (
                      <LocateFixed className="h-6 w-6" strokeWidth={2} aria-hidden />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Ikona celownika pobiera pozycję z GPS i uzupełnia adres (jak w mapach). Przeglądarka może
                  wyświetlić prośbę o zgodę na dostęp do lokalizacji.
                </p>
              </div>
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