import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { defaultPathForRole } from "../utils/authRedirect";

export default function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={defaultPathForRole(user)} replace />;
}
