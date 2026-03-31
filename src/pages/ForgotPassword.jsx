import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Logo from "../components/Logo";
import { apiPost } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/forgot-password", { email }, { credentials: "omit" });
      setInfo(data?.message || "Jeśli konto istnieje, wysłaliśmy link resetujący.");
    } catch (err) {
      setError(err.message || "Nie udało się wysłać linku resetującego.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
      <Helmet>
        <title>Przypomnij hasło | Helpfli</title>
      </Helmet>
      <div className="max-w-md w-full mx-auto p-6 border rounded-2xl shadow-lg bg-white">
        <div className="flex items-center justify-center mb-6">
          <Logo className="h-8 w-8" showText={true} textColor="text-indigo-800" clickable={true} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Zapomniałeś hasła?</h2>
        <p className="text-center text-sm text-slate-500 mb-4">
          Podaj email, wyślemy Ci link do ustawienia nowego hasła.
        </p>
        {error && <p className="text-red-500 text-center mb-3">{error}</p>}
        {info && <p className="text-green-600 text-center mb-3">{info}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Wysyłam..." : "Wyślij link resetujący"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-indigo-700 hover:underline">Wróć do logowania</Link>
        </p>
      </div>
    </div>
  );
}
