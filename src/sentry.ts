import * as Sentry from "@sentry/react";
import { hasAnalyticsConsent } from "./utils/consent";

let sentryInitialized = false;

export function initSentry() {
  if (sentryInitialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  if (!hasAnalyticsConsent()) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    }
  });
  sentryInitialized = true;
}















