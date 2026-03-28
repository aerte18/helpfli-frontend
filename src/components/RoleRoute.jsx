import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allow = [] }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  // Sprawdź czy użytkownik ma dozwoloną rolę
  const hasAllowedRole = allow.includes(user.role);
  
  // Dla provider routes - pozwól również company_owner i company_manager
  if (allow.includes("provider") && !hasAllowedRole) {
    const isCompanyUser = user.role === "company_owner" || 
                         user.role === "company_manager" ||
                         (user.company && (user.roleInCompany === "owner" || user.roleInCompany === "manager"));
    if (isCompanyUser) {
      return <Outlet />;
    }
  }
  
  if (!hasAllowedRole) {
    // Jeśli użytkownik jest adminem, ale próbuje dostać się do route, który nie jest dla admina,
    // przekieruj go do panelu admina
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    // Klient na trasie tylko-provider → /home zamiast /dashboard (unikaj zamieszania z panelem)
    if (user.role === "client") {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}







