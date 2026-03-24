import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../lib/api";
import TwoFactorModal from "../components/TwoFactorModal";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchMe } = useAuth();
  
  // Get the next parameter from URL
  const searchParams = new URLSearchParams(location.search);
  const next = searchParams.get('next') || '/home';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTwoFactorError("");

    try {
      console.log("Attempting login with:", { email, password });
      const data = await apiPost("/api/auth/login", { email, password }, { credentials: "omit" });

      // Sprawdź czy wymagany jest kod 2FA
      if (data.requires2FA) {
        setRequires2FA(true);
        return;
      }

      console.log("Login successful:", data);
      localStorage.setItem("token", data.token);
      // po zapisaniu tokenu odśwież /me i sprawdź onboarding
      console.log("Login - calling fetchMe()");
      await fetchMe();
      console.log("Login - fetchMe() completed");
      console.log("Login - localStorage user after fetchMe:", localStorage.getItem("user"));
      
      // Sprawdź czy onboarding jest ukończony
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("Login - userData after fetchMe:", userData);
      console.log("Login - userData.role:", userData.role);
      console.log("Login - userData.company:", userData.company);
      console.log("Login - userData.roleInCompany:", userData.roleInCompany);
      console.log("Login - userData.onboardingCompleted:", userData.onboardingCompleted);
      
      if (!userData.onboardingCompleted) {
        console.log("Login - redirecting to onboarding");
        navigate("/onboarding");
      } else {
        // Przekieruj na właściwą stronę w zależności od roli
        // Najpierw sprawdź admina
        if (userData.role === "admin") {
          console.log("Login - redirecting to admin dashboard");
          navigate("/admin");
        } else {
          // Sprawdź czy użytkownik należy do firmy (ma company lub role company)
          const isCompanyUser = userData.role === "company_owner" || 
                               userData.role === "company_manager" ||
                               (userData.company && (userData.roleInCompany === "owner" || userData.roleInCompany === "manager"));
          
          if (isCompanyUser) {
            console.log("Login - redirecting to company dashboard");
            navigate("/account/company");
          } else if (userData.role === "provider") {
            console.log("Login - redirecting to provider-home");
            navigate("/provider-home");
          } else {
            console.log("Login - redirecting to home");
            navigate("/home");
          }
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  };

  const handle2FASubmit = async (token) => {
    setTwoFactorError("");
    try {
      const data = await apiPost("/api/auth/login", { 
        email, 
        password, 
        twoFactorToken: token 
      }, { credentials: "omit" });

      console.log("Login with 2FA successful:", data);
      localStorage.setItem("token", data.token);
      await fetchMe();
      
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!userData.onboardingCompleted) {
        navigate("/onboarding");
      } else {
        if (userData.role === "admin") {
          navigate("/admin");
        } else {
          const isCompanyUser = userData.role === "company_owner" || 
                               userData.role === "company_manager" ||
                               (userData.company && (userData.roleInCompany === "owner" || userData.roleInCompany === "manager"));
          
          if (isCompanyUser) {
            navigate("/account/company");
          } else if (userData.role === "provider") {
            navigate("/provider-home");
          } else {
            navigate("/home");
          }
        }
      }
    } catch (err) {
      console.error("2FA login error:", err);
      setTwoFactorError(err.message || "Nieprawidłowy kod weryfikacyjny");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
      <Helmet>
        <title>Logowanie | Helpfli</title>
        <meta name="description" content="Zaloguj się do Helpfli i znajdź pomoc w swojej okolicy lub oferuj usługi jako wykonawca." />
      </Helmet>
      <div className="max-w-md w-full mx-auto p-6 border rounded-lg shadow-lg bg-white text-black">
        {/* Logo Helpfli */}
        <div className="flex items-center justify-center mb-6">
          <Logo className="h-8 w-8" showText={true} textColor="text-indigo-800" clickable={true} />
        </div>

        <h2 className="text-2xl font-bold mb-4 text-center">Zaloguj się</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Adres e-mail"
            autoComplete="email"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Hasło"
              className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Hasło"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
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
          <button
            type="submit"
            className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            aria-label="Zaloguj się"
          >
            Zaloguj
          </button>
        </form>

        <p className="text-sm mt-6 text-center">
          Nie masz konta?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline font-medium">
            Zarejestruj się
          </Link>
        </p>

        <TwoFactorModal
          isOpen={requires2FA}
          onClose={() => {
            setRequires2FA(false);
            setPassword("");
          }}
          onSubmit={handle2FASubmit}
          error={twoFactorError}
        />
      </div>
    </div>
  );
}

export default Login;