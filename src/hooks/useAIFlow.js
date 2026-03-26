import { apiUrl } from "@/lib/apiUrl";
import { useState } from "react";

export default function useAIFlow({ onProvidersPicked } = {}) {
  const [chat, setChat] = useState([]);           // {role:'user'|'ai', text}
  const [loading, setLoading] = useState(false);
  const [lastTags, setLastTags] = useState([]);
  const [lastProblem, setLastProblem] = useState(""); // 👈 nowość

  const send = async (text) => {
    const userMsg = { role: "user", text };
    setChat((c) => [...c, userMsg]);
    setLastProblem(text); // 👈 zapamiętujemy opis problemu
    setLoading(true);
    try {
      const r = await fetch(apiUrl("/api/ai/assist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await r.json(); // {steps, needsPro, tags}
      setLastTags(data.tags || []);
      const advice = [
        `OK, oto szybkie kroki:`,
        ...(data.steps || []).map((s, i) => `${i + 1}. ${s}`),
        "",
        data.needsPro
          ? "Wygląda na poważniejsze — chcesz, żebym znalazł najlepszego fachowca?"
          : "Możesz spróbować sam. Jeśli wolisz, znajdę też sprawdzonego wykonawcę.",
      ].join("\n");

      setChat((c) => [...c, { role: "ai", text: advice }]);
      setLoading(false);
      return { needsPro: data.needsPro, tags: data.tags || [] };
    } catch (e) {
      setLoading(false);
      setChat((c) => [...c, { role: "ai", text: "Coś poszło nie tak. Spróbuj ponownie." }]);
      return { needsPro: false, tags: [] };
    }
  };

  const findProviders = async (extra = {}) => {
    const params = new URLSearchParams({
      service: extra.service || lastTags[0] || "",
      location: extra.location || "",
      level: extra.level || "",
      b2b: extra.b2b ? "true" : "",
      ratingMin: extra.ratingMin || "",
    }).toString();

    const r = await fetch(apiUrl(`/api/search?${params}`));
    const { results = [] } = await r.json();

    if (typeof onProvidersPicked === "function") onProvidersPicked(results);
    return results;
  };

  return { chat, loading, send, findProviders, lastTags, lastProblem }; // 👈 eksport lastProblem
}
