import { useState } from "react";
import { getPricing } from "../api/ai";

export function useAIPricing(token) {
  const [loading, setLoading] = useState(false);
  const [bands, setBands] = useState(null);
  const [error, setError] = useState("");

  async function run({ service, city, lat, lng, urgency }) {
    setLoading(true);
    setError("");
    try {
      const res = await getPricing({ token, service, city, lat, lng, urgency });
      setBands(res);
    } catch (e) {
      setError(e.message);
      setBands(null);
    } finally {
      setLoading(false);
    }
  }

  return { loading, bands, error, run };
}

























