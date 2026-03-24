import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error, expired
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      verifyEmail(token);
    } else {
      setStatus("error");
      setMessage("Brak tokenu weryfikacyjnego w URL.");
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(data.message);
        // Automatycznie przekieruj do logowania po 3 sekundach
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.message || "Błąd weryfikacji emaila");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("Błąd połączenia z serwerem");
    }
  };

  const resendVerification = async () => {
    if (!email.trim()) {
      setMessage("Podaj swój adres email");
      return;
    }

    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setStatus("success");
      } else {
        setMessage(data.message || "Błąd wysyłania emaila");
      }
    } catch (error) {
      console.error("Resend error:", error);
      setMessage("Błąd połączenia z serwerem");
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Weryfikuję email...</h2>
            <p className="text-gray-600">Proszę czekać</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-800">Email zweryfikowany!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Przekierowuję do logowania...</p>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-800">Błąd weryfikacji</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Nie otrzymałeś emaila?</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Twój adres email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {resending ? "Wysyłam..." : "Wyślij ponownie email weryfikacyjny"}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Przejdź do logowania
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6 border rounded-2xl shadow-lg bg-white">
        <div className="flex items-center justify-center mb-6">
          <Logo className="h-8 w-8" showText={true} textColor="text-indigo-800" clickable={true} />
        </div>

        {renderContent()}
      </div>
    </div>
  );
}



















