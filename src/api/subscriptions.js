import { api } from "./client";

export const getPlans = (audience) => api(`/api/subscriptions/plans${audience ? `?audience=${audience}` : ""}`);
export const getMySubscription = () => api("/api/subscriptions/me");
export const subscribePlan = (planKeyOrCode, requestInvoice = false) => {
	// backend expects planKey (our model uses key)
	return api("/api/subscriptions/subscribe", { method: "POST", body: { planKey: planKeyOrCode, requestInvoice }});
};
export const startTrial = (planKey) => {
	// Start 7-day trial for PRO plans
	return api("/api/subscriptions/start-trial", { method: "POST", body: { planKey }});
};
export const cancelSubscription = () => api("/api/subscriptions/cancel", { method: "POST" });

export const getBoostOptions = () => api("/api/boosts/options");
export const buyBoost = (code, requestInvoice = false) => api("/api/boosts/purchase", { method: "POST", body: { code, requestInvoice }});

export const getMyPoints = () => api("/api/points/me");
export const redeemPoints = (deltaNegative, reason) => api("/api/points/redeem", { method: "POST", body: { deltaNegative, reason }});











