import { useEffect, useState } from "react";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const API = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${API}/api/services`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Nie udało się pobrać usług");
        setServices(data.items || data || []);
      } catch (e) {
        setError(e.message || "Nie udało się pobrać usług");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return { services, loading, error };
}
