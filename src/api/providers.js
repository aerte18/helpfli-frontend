import { apiUrl } from "@/lib/apiUrl";
export async function getProviderMini({ token, providerId }) {
  const res = await fetch(apiUrl(`/api/providers/${providerId}/mini`), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Błąd wczytywania profilu wykonawcy");
  return data;
}

























