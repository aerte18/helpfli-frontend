import { Navigate, useSearchParams } from "react-router-dom";

/** Legacy /search → /home z mapowaniem parametrów wyszukiwania. */
export default function SearchRedirect() {
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams();

  const text =
    searchParams.get("search") ||
    searchParams.get("q") ||
    searchParams.get("query") ||
    "";
  const service = searchParams.get("service") || "";

  if (text.trim()) params.set("search", text.trim());
  if (service.trim()) params.set("service", service.trim());

  searchParams.forEach((value, key) => {
    if (["search", "q", "query", "service"].includes(key)) return;
    if (value) params.set(key, value);
  });

  const qs = params.toString();
  return <Navigate to={qs ? `/home?${qs}` : "/home"} replace />;
}
