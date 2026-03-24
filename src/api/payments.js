import { api } from "../lib/api";

// Stripe Connect – tworzenie konta i linków dla wykonawców

export const createStripeConnectAccount = () =>
  api("/api/payments/connect/create-account", {
    method: "POST",
    body: {},
  });

export const createStripeAccountLink = () =>
  api("/api/payments/connect/account-link", {
    method: "POST",
    body: {},
  });

export const getStripeConnectStatus = () =>
  api("/api/payments/connect/status", {
    method: "GET",
  });










