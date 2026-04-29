import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function OrderChat() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;
    navigate(`/orders/${orderId}?tab=chat`, { replace: true });
  }, [orderId, navigate]);

  return (
    <div className="max-w-4xl mx-auto p-6 text-sm text-slate-600">
      Przekierowuję do czatu zlecenia...
    </div>
  );
}
