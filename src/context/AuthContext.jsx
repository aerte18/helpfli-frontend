import { apiUrl } from "@/lib/apiUrl";
import { createContext, useContext, useEffect, useState } from "react";
import { subscribePush } from "../utils/push";
import { setConsent } from "../utils/consent";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { _id, name, role: 'provider'|'client' }
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    let t = null;
    try {
      t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    } catch (error) {
      console.warn("AuthContext - localStorage access blocked:", error);
      // Tracking Prevention może blokować localStorage
    }
    console.log("AuthContext - fetchMe - token:", t ? "EXISTS" : "NULL");
    if (!t) { setUser(null); setLoading(false); return; }
    try {
      console.log("AuthContext - fetchMe - calling /api/auth/me");
      const res = await fetch(apiUrl("/api/auth/me"), {
        headers: { Authorization: `Bearer ${t}` }
      });
      console.log("AuthContext - fetchMe - response status:", res.status);
      if (!res.ok) throw new Error("unauthorized");
      const data = await res.json();
      console.log("AuthContext - fetchMe - user data:", data);
      console.log("AuthContext - fetchMe - setting user and loading false");
      setUser(data); // upewnij się, że backend zwraca np. { _id, name, role }
      if (data?.consents) {
        setConsent({
          analytics: !!data.consents.analytics,
          cookies: !!data.consents.cookies,
          marketing: !!data.marketingConsent,
        });
      }
      setLoading(false); // WAŻNE: ustaw loading na false po pomyślnym pobraniu danych
      console.log("AuthContext - fetchMe - user set, loading set to false");
      console.log("AuthContext - fetchMe - user role:", data?.role);
      console.log("AuthContext - fetchMe - user onboardingCompleted:", data?.onboardingCompleted);
      
      // Zapisz usera do localStorage dla PrivateRoute
      try {
        localStorage.setItem("user", JSON.stringify(data));
      } catch (error) {
        console.warn("AuthContext - localStorage write blocked:", error);
      }
      
      // Subscribe to push notifications after successful login (nie blokuj loading)
      // Wywołaj asynchronicznie, żeby nie blokować loading state
      subscribePush().catch(() => {});
    } catch (error) {
      console.error("AuthContext - fetchMe - error:", error);
      setUser(null);
      setLoading(false); // Ustaw loading na false nawet przy błędzie
      try {
        localStorage.removeItem("token");
      } catch (e) {
        console.warn("AuthContext - localStorage remove blocked:", e);
      }
    }
  };

  useEffect(() => { fetchMe(); /* on mount */ }, []);

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(apiUrl("/api/auth/logout"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      fetchMe, 
      logout,
      token: typeof window !== "undefined" ? localStorage.getItem("token") : null
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
