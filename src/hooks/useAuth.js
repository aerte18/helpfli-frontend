// src/hooks/useAuth.js
import { useMemo, useState } from "react";

export function useAuth() {
  const [tokenState, setTokenState] = useState(() => localStorage.getItem("token") || null);
  const [userState, setUserState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    setTokenState(token);
    setUserState(userData || null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTokenState(null);
    setUserState(null);
  };

  const isAuthenticated = !!tokenState;

  return useMemo(() => ({
    token: tokenState, user: userState, login, logout, isAuthenticated
  }), [tokenState, userState]);
}

export default useAuth;