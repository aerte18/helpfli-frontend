import { apiUrl } from "../lib/apiUrl.js";

export const api = async (path, { method = "GET", body, token } = {}) => {
	const headers = { "Content-Type": "application/json" };
	const t = token || localStorage.getItem("token");
	if (t) headers.Authorization = `Bearer ${t}`;
	const res = await fetch(apiUrl(path), {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		const detail = [data.error, data.stripeCode].filter(Boolean).join(" • ");
		const msg = data.message || `API error ${res.status}`;
		throw new Error(detail ? `${msg} (${detail})` : msg);
	}
	return res.json();
};




























