import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Logo from "../components/Logo";
import { apiPost } from "../lib/api";

function meetsPolicy(pw) {
  return pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const validPolicy = useMemo(() => meetsPolicy(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!token) return setError("Brak tokenu resetu hasła.");
    if (!validPolicy) return setError("Hasło nie spełnia wymagań bezpieczeństwa.");
    if (password !== confirmPassword) return setError("Hasła nie są identyczne.");

    setLoading(true);
    try {
      const data = await apiPost(
        "/api/auth/reset-password",
        { token, password, confirmPassword },
        { credentials: "omit" }
      );
      setInfo(data?.message || "Hasło zostało zmienione.");
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      setError(err.message || "Nie udało się zmienić hasła.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
      <Helmet>
        <title>Ustaw nowe hasło | Helpfli</title>
      </Helmet>
      <div className="max-w-md w-full mx-auto p-6 border rounded-2xl shadow-lg bg-white">
        <div className="flex items-center justify-center mb-6">
          <Logo className="h-8 w-8" showText={true} textColor="text-indigo-800" clickable={true} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Ustaw nowe hasło</h2>
        <p className="text-center text-sm text-slate-500 mb-4">
          Wprowadź nowe hasło do swojego konta.
        </p>
        {error && <p className="text-red-500 text-center mb-3">{error}</p>}
        {info && <p className="text-green-600 text-center mb-3">{info}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nowe hasło"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Powtórz nowe hasło"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <p className={`text-xs ${validPolicy ? "text-emerald-600" : "text-slate-500"}`}>
            Min. 8 znaków, mała i duża litera, cyfra oraz znak specjalny.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Zmieniam..." : "Zmień hasło"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-indigo-700 hover:underline">Wróć do logowania</Link>
        </p>
      </div>
    </div>
  );
}
