import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UnifiedAIConcierge from "../components/ai/UnifiedAIConcierge";

export default function AIConciergePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <UnifiedAIConcierge
      mode="page"
      open={true}
      onClose={() => navigate('/home')}
      seedQuery=""
    />
  );
}
