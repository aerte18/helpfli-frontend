import { apiUrl } from "@/lib/apiUrl";
import { createContext, useContext, useEffect, useState } from "react";
import { subscribePush } from "../utils/push";
import { mergeServerConsents, hasMarketingConsent } from "../utils/consent";

const AuthContext = createContext(null);

function readCachedUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readCachedUser());
  const [loading, setLoading] = useState(() => !!readToken());

  const fetchMe = async () => {
    const t = readToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(apiUrl("/api/auth/me"), {
        headers: { Authorization: `Bearer ${t}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error("unauthorized");
      const data = await res.json();
      setUser(data);
      mergeServerConsents(data);
      try {
        localStorage.setItem("user", JSON.stringify(data));
      } catch (error) {
        console.warn("AuthContext - localStorage write blocked:", error);
      }
      if (hasMarketingConsent()) {
        subscribePush().catch(() => {});
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("AuthContext - fetchMe - error:", error);
      }
      if (!cached) {
        setUser(null);
        try {
          localStorage.removeItem("token");
        } catch (e) {
          console.warn("AuthContext - localStorage remove blocked:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const logout = async () => {
    try {
      const token = readToken();
      if (token) {
        await fetch(apiUrl("/api/auth/logout"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    } finally {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {}
      setUser(null);
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        fetchMe,
        logout,
        token: readToken(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
