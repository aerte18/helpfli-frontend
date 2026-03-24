// frontend/src/lib/api.ts
// Użyj relatywnego URL (proxy w Vite) lub bezpośredniego jeśli VITE_API_URL jest ustawione
const API_BASE = (import.meta as any).env?.VITE_API_URL?.trim() || ""; // Pusty string = użyj proxy

function absolute(path: string) {
  // Jeśli path już jest pełnym URL, zwróć go
  if (path.startsWith("http")) return path;
  // Jeśli API_BASE jest pusty, użyj relatywnego URL (proxy w Vite)
  if (!API_BASE) return path;
  // W przeciwnym razie dodaj base URL
  return `${API_BASE}${path}`;
}

async function parseJsonSafe(res: Response) {
  if (res.status === 204) return {};
  const text = await res.text();
  if (!text || text.trim() === '') {
    console.warn('parseJsonSafe: Empty response body');
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('parseJsonSafe: JSON parse error', { text: text.substring(0, 200), error: e });
    throw new Error(`Invalid JSON response: ${e.message}`);
  }
}

export async function apiGet<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = absolute(path);
  const token = localStorage.getItem("token");
  const res = await fetch(url, { 
    method: "GET", 
    credentials: "omit",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    },
    ...(init || {}) 
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await parseJsonSafe(res)) as T;
}

export async function apiPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const url = absolute(path);
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}) 
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(init || {})
  });
  
  // Jeśli status 200 ale response zawiera requires2FA, zwróć dane bez rzucania błędu
  if (res.status === 200) {
    const data = await parseJsonSafe(res);
    return data as T;
  }
  
  if (!res.ok) {
    const errorData = await parseJsonSafe(res).catch(() => ({}));
    const error = new Error(errorData.message || `${res.status} ${res.statusText}`);
    (error as any).status = res.status;
    (error as any).data = errorData;
    throw error;
  }
  
  return (await parseJsonSafe(res)) as T;
}

export async function apiPut<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const url = absolute(path);
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method: "PUT",
    credentials: "omit",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(init || {})
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await parseJsonSafe(res)) as T;
}

// Wrapper function for compatibility with payments.js
export async function api(path: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}): Promise<any> {
  const { method = "GET", body, headers } = options;
  
  if (method === "GET") {
    return apiGet(path, { headers });
  } else if (method === "POST") {
    return apiPost(path, body, { headers });
  } else if (method === "PUT") {
    return apiPut(path, body, { headers });
  } else {
    throw new Error(`Unsupported method: ${method}`);
  }
}

