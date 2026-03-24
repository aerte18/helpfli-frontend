// src/hooks/useAIConcierge.js
import { useState } from "react";
import { postConcierge, searchProviders } from "../api/ai";

export function useAIConcierge(token) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState("");

  async function run(problemText, geo) {
    setLoading(true);
    setError("");
    setProviders([]);
    try {
      const concierge = await postConcierge({ token, problemText, location: geo || null });
      setResult(concierge);

      // Dociągnij top 3 wykonawców przez /api/search
      const list = await searchProviders({
        service: concierge?.query?.service,
        city: concierge?.query?.city,
        lat: concierge?.query?.lat,
        lng: concierge?.query?.lng,
        limit: concierge?.query?.limit || 3,
        token,
      });
      setProviders(list.slice(0, 3));
    } catch (e) {
      setError(e.message || "Błąd Asystenta AI");
    } finally {
      setLoading(false);
    }
  }

  return { loading, result, providers, error, run };
}

























