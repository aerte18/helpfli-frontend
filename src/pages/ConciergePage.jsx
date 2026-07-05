import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import UnifiedAIConcierge from "../components/ai/UnifiedAIConcierge";
import SEOHead from "../components/SEOHead";

export default function ConciergePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'provider') {
      navigate('/provider-home');
    }
  }, [navigate, user]);

  return (
    <>
      <SEOHead
        title="AI Concierge — znajdź wykonawcę | Helpfli"
        description="Asystent AI pomoże opisać problem i dopasować usługę oraz wykonawców w Twojej okolicy."
        canonical="/concierge"
      />
    <UnifiedAIConcierge
      mode="page"
      open={true}
      onClose={() => navigate('/home')}
      seedQuery=""
    />
    </>
  );
}
