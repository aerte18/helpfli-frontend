import { apiUrl } from "@/lib/apiUrl";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Briefcase, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import ProviderServiceCategoryPicker from "../components/ProviderServiceCategoryPicker";

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchMe } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dane formularza
  const [role, setRole] = useState("");
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    bio: "",
    headline: "",
    services: [],
    priceNote: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Jeśli onboarding już ukończony, przekieruj
    if (user.onboardingCompleted) {
      // Przekieruj na właściwą stronę w zależności od roli
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "provider") {
        navigate("/provider-home");
      } else {
        navigate("/home");
      }
      return;
    }

    // Ustaw domyślną rolę jeśli już jest
    if (user.role && !role) {
      setRole(user.role);
      if (user.role === "provider") {
        setStep(2); // Pomiń wybór roli dla providerów
      }
    }

    // Uzupełnij dane jeśli już istnieją
    setProfileData(prev => ({
      ...prev,
      name: user.name || "",
      phone: user.phone || "",
      bio: user.bio || "",
      headline: user.headline || ""
    }));
  }, [user, navigate, role]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        ...(role === "provider" && {
          bio: profileData.bio,
          headline: profileData.headline,
          priceNote: profileData.priceNote
        })
      };

      const res = await fetch(apiUrl("/api/users/me/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        throw new Error("Nie udało się zaktualizować profilu");
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServicesUpdate = async () => {
    if (role !== "provider" || profileData.services.length === 0) {
      await completeOnboarding();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      // Zapisz usługi
      await fetch(apiUrl("/api/user-services"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ services: profileData.services })
      });

      // Ustaw główną usługę
      if (profileData.services.length > 0) {
        const firstServiceRes = await fetch(apiUrl(`/api/services/${profileData.services[0]}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (firstServiceRes.ok) {
          const firstService = await firstServiceRes.json();
          await fetch(apiUrl("/api/users/me/profile"), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ service: firstService.name })
          });
        }
      }

      await completeOnboarding();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(apiUrl("/api/users/me/onboarding"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ onboardingCompleted: true })
      });

      await fetchMe();
      // Pobierz zaktualizowane dane użytkownika
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      // Przekieruj na właściwą stronę w zależności od roli
      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.role === "provider") {
        navigate("/provider-home");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const renderStep1 = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Witaj w Helpfli!</h1>
        <p className="text-gray-600">Wybierz swoją rolę, aby dostosować doświadczenie</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => handleRoleSelect("client")}
          className="p-6 border-2 border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
        >
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-indigo-600" />
          <h3 className="text-xl font-semibold mb-2">Jestem Klientem</h3>
          <p className="text-gray-600 text-sm">
            Szukam wykonawców do realizacji zleceń i projektów
          </p>
        </button>

        <button
          onClick={() => handleRoleSelect("provider")}
          className="p-6 border-2 border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
        >
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-indigo-600" />
          <h3 className="text-xl font-semibold mb-2">Jestem Wykonawcą</h3>
          <p className="text-gray-600 text-sm">
            Oferuję usługi i chcę znajdować nowych klientów
          </p>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === "client" ? "Opowiedz nam o sobie" : "Skonfiguruj swój profil"}
        </h1>
        <p className="text-gray-600">
          {role === "client" 
            ? "Podstawowe informacje pomogą nam lepiej Cię obsłużyć"
            : "Uzupełnij profil, aby klienci mogli Cię znaleźć"
          }
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imię i nazwisko *
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Jan Kowalski"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numer telefonu
          </label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="+48 123 456 789"
          />
        </div>

        {role === "provider" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Krótki nagłówek (do 60 znaków) *
              </label>
              <input
                type="text"
                value={profileData.headline}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 60);
                  setProfileData(prev => ({ ...prev, headline: value }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="np. 10+ lat doświadczenia. Szybkie naprawy."
                maxLength={60}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {profileData.headline.length}/60 znaków - Ten nagłówek będzie widoczny w karcie na liście wykonawców
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pełny opis usług *
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Szczegółowy opis Twoich usług, doświadczenia i specjalizacji..."
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Pełny opis będzie widoczny w szczegółach Twojego profilu
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uwagi do cen
              </label>
              <input
                type="text"
                value={profileData.priceNote}
                onChange={(e) => setProfileData(prev => ({ ...prev, priceNote: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Standardowe stawki wg cennika"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Wstecz
        </button>

        <button
          onClick={handleProfileUpdate}
          disabled={loading || !profileData.name || (role === "provider" && !profileData.bio)}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Zapisywanie..." : "Dalej"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === "client" ? "Gotowe!" : "Prawie gotowe!"}
        </h1>
        <p className="text-gray-600">
          {role === "client" 
            ? "Możesz już rozpocząć korzystanie z Helpfli. Szukaj wykonawców i twórz zlecenia!"
            : "Teraz wybierz usługi, które oferujesz, aby klienci mogli Cię znaleźć."
          }
        </p>
      </div>

      {role === "provider" ? (
        <div className="space-y-4">
          <ProviderServiceCategoryPicker
            selectedIds={profileData.services}
            onSelectedIdsChange={(services) =>
              setProfileData((prev) => ({ ...prev, services }))
            }
          />
          
          <button
            onClick={handleServicesUpdate}
            disabled={loading || profileData.services.length === 0}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Zapisywanie..." : "Zakończ konfigurację"}
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => navigate("/create-order")}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Utwórz pierwsze zlecenie
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate("/home")}
            className="w-full max-w-md mx-auto px-6 py-3 text-gray-600 hover:text-gray-800"
          >
            Przejdź do strony głównej
          </button>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Wstecz
        </button>
      </div>
    </div>
  );

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Krok {step} z {role === "provider" ? "3" : "3"}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((step / 3) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
}
