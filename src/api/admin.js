import { api } from "./client";

export const getRankingConfig = () => api("/api/admin/config/ranking");
export const updateRankingConfig = (payload) => api("/api/admin/config/ranking", { method: "PUT", body: payload });
export const recomputeAllRanking = () => api("/api/admin/ranking/recompute-all", { method: "POST" });
export const getRankingAudit = (limit = 50) => api(`/api/admin/config/ranking/audit?limit=${limit}`);




























