import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUrlWithNext } from "../utils/authRedirect";

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return (
      <Navigate
        to={loginUrlWithNext(location.pathname, location.search)}
        replace
      />
    );
  }

  let currentUser = user;
  if (!currentUser) {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        currentUser = JSON.parse(userRaw);
      } catch {
        /* ignore */
      }
    }
  }

  if (!currentUser) {
    return (
      <Navigate
        to={loginUrlWithNext(location.pathname, location.search)}
        replace
      />
    );
  }

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/home" replace />;
  }

  return children || <Outlet />;
}
