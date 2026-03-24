import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import UnifiedAIConcierge from "../components/ai/UnifiedAIConcierge";

export default function ConciergePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sprawdź tylko czy provider nie próbuje dostać się do concierge
  useEffect(() => {
    if (user && user.role === 'provider') {
      navigate('/provider-home');
    }
  }, [navigate, user]);

  return (
    <UnifiedAIConcierge
      mode="page"
      open={true}
      onClose={() => navigate('/home')}
      seedQuery=""
    />
  );
}
