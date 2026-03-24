import { api } from "./client";

export const getMyReferral = () => api("/api/referrals/me");
export const useReferralCode = (referralCode, userId) => 
  api("/api/referrals/use", { method: "POST", body: { referralCode, userId }});
export const completeReferral = (referralId, action) => 
  api("/api/referrals/complete", { method: "POST", body: { referralId, action }});
export const getReferralHistory = () => api("/api/referrals/history");
export const getReferralStats = () => api("/api/referrals/stats");





