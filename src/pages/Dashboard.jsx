import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import Logo from "../components/Logo";
function LoyaltyWidgetInner(){
  const token = localStorage.getItem('token');
  const [me, setMe] = useState(null);
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/auth/me',{ headers:{ Authorization:`Bearer ${token}` } }); if(r.ok) setMe(await r.json()); }catch{} })(); },[]);
  if(!me) return null;
  return (
    <div className="p-4 rounded-xl border bg-white mt-4">
      <div className="text-sm text-gray-500">Twoje punkty Helpfli</div>
      <div className="text-3xl font-bold">{me.loyaltyPoints || 0} pkt</div>
    </div>
  );
}

function Dashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();


  // Sprawdź czy użytkownik jest company i przekieruj do panelu firmy
  useEffect(() => {
    if (!loading && user) {
      const isCompanyUser = user.role === "company_owner" || 
                           user.role === "company_manager" ||
                           (user.company && (user.roleInCompany === "owner" || user.roleInCompany === "manager"));
      
      if (isCompanyUser) {
        navigate("/account/company", { replace: true });
        return;
      }
    }
  }, [user, loading, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Ładowanie panelu klienta...</p>
        </div>
      </div>
    );
  }

  // Sprawdź czy user istnieje
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Nie udało się załadować danych użytkownika</p>
          <button 
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Przejdź do logowania
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6FAFF] to-white flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto p-6 bg-white rounded-lg shadow-lg text-black text-center">
        {/* Logo Helpfli */}
        <div className="flex items-center justify-center mb-6">
          <Logo className="h-8 w-8" showText={true} textColor="text-indigo-800" clickable={true} />
        </div>

        <h2 className="text-2xl font-bold mb-4">Witaj, {user.name || user.email}!</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Typ konta:</strong> {user.role || "nieokreślony"}</p>

        <LoyaltyWidgetInner />

        <div className="mt-6 space-y-3">
          {user.role === 'client' && (
            <Link to="/create-order" className="block text-indigo-600 hover:underline font-medium">
              ➕ Stwórz nowe zlecenie
            </Link>
          )}
          <Link to="/my-orders" className="block text-indigo-600 hover:underline font-medium">
            📋 Moje zlecenia
          </Link>
          <Link to="/account/wallet" className="block text-indigo-600 hover:underline font-medium">
            💳 Opłaty i korzyści
          </Link>
          {user.role === 'provider' && (
            <Link to="/verification" className="block text-indigo-600 hover:underline font-medium">
              ✅ Zweryfikuj konto
            </Link>
          )}
        </div>

        <button
          onClick={logout}
          className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Wyloguj się
        </button>
      </div>
    </div>
  );
}

export default Dashboard;