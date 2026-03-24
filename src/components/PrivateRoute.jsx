import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  
  // Debug: sprawdź co się dzieje w PrivateRoute
  console.log("PrivateRoute - user:", user, "loading:", loading);
  console.log("PrivateRoute - localStorage token:", localStorage.getItem("token"));
  console.log("PrivateRoute - localStorage user:", localStorage.getItem("user"));
  console.log("PrivateRoute - user exists:", !!user);
  console.log("PrivateRoute - user role:", user?.role);
  
  if (loading) {
    console.log("PrivateRoute - loading = true, showing spinner");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Sprawdź token i user
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  
  // Jeśli nie ma usera w context, spróbuj z localStorage
  let currentUser = user;
  if (!currentUser) {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        currentUser = JSON.parse(userRaw);
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }
  
  if (!currentUser) return <Navigate to="/login" replace />;
  
  // Sprawdź role
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;  // Przekieruj do dashboard zamiast /home
  }
  
  return children || <Outlet />;
}