import { api } from "./client";

export const getMyReferral = () => api("/api/referrals/me");
export const getReferralRules = () => api("/api/referrals/rules");

/** @deprecated Stary program zniżki na subskrypcję (ReferralCode). Nowy program: link /register?ref= */
export const useReferralCode = (referralCode, planKey) =>
  api("/api/referrals/use", { method: "POST", body: { code: referralCode, planKey } });
export const getReferralHistory = () => api("/api/referrals/history");
export const getReferralStats = () => api("/api/referrals/stats");





