import { apiUrl } from "@/lib/apiUrl";
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasAnalyticsConsent } from "../utils/consent";

// Event types (muszą być zgodne z backend)
export const EVENT_TYPES = {
  PAGE_VIEW: 'page_view',
  PROVIDER_VIEW: 'provider_view',
  ORDER_VIEW: 'order_view',
  SEARCH: 'search',
  FILTER_APPLIED: 'filter_applied',
  CATEGORY_SELECTED: 'category_selected',
  PROVIDER_CONTACT: 'provider_contact',
  PROVIDER_COMPARE: 'provider_compare',
  QUOTE_REQUEST: 'quote_request',
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_STARTED: 'order_started',
  ORDER_COMPLETED: 'order_completed',
  ORDER_FORM_START: 'order_form_start',
  ORDER_STEP_VIEW: 'order_step_view',
  ORDER_FORM_ABANDON: 'order_form_abandon',
  ORDER_FORM_SUCCESS: 'order_form_success',
  OFFER_FORM_START: 'offer_form_start',
  OFFER_STEP_VIEW: 'offer_step_view',
  OFFER_FORM_SUBMIT: 'offer_form_submit',
  PAYMENT_INTENT_CREATED: 'payment_intent_created',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  LOGIN: 'login',
  REGISTER: 'register',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  DISPUTE_REPORTED: 'dispute_reported',
  REFUND_REQUESTED: 'refund_requested',
  CLIENT_API_ERROR: 'client_api_error'
};

function extractPageName(path) {
  const base = (path || '').split('?')[0] || '';
  const segments = base.split('/').filter((s) => s);
  if (segments.length === 0) return 'home';
  return segments[0];
}

function parseUtmFromSearch(search) {
  const q = typeof search === 'string' ? search : '';
  const params = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q);
  const utm = {};
  const keys = [
    ['utm_source', 'source'],
    ['utm_medium', 'medium'],
    ['utm_campaign', 'campaign'],
    ['utm_term', 'term'],
    ['utm_content', 'content']
  ];
  for (const [raw, key] of keys) {
    const val = params.get(raw);
    if (val && val.trim()) utm[key] = val.trim().slice(0, 120);
  }
  return Object.keys(utm).length ? utm : undefined;
}

export function useTelemetry() {
  const { user } = useAuth();
  const sessionId = useRef(null);
  const eventQueue = useRef([]);
  const batchTimeout = useRef(null);

  // Generuj sessionId przy pierwszym użyciu
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Flush queue co 5 sekund lub gdy ma 10 eventów
  const flushQueue = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      const token = localStorage.getItem('token');
      const url = token
        ? apiUrl('/api/telemetry/batch')
        : apiUrl('/api/telemetry/public/batch');
      const headers = {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId.current || 'anon'
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Telemetry flush error:', error);
      // Przywróć eventy do queue jeśli błąd
      eventQueue.current.unshift(...events);
    }
  }, []);

  // Track pojedynczego eventu
  const track = useCallback(async (eventType, properties = {}, metadata = {}) => {
    if (!hasAnalyticsConsent()) return;
    // Dodaj do queue
    eventQueue.current.push({
      eventType,
      properties,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Flush jeśli queue jest pełny
    if (eventQueue.current.length >= 10) {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      await flushQueue();
    } else {
      // Ustaw timeout na flush
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      batchTimeout.current = setTimeout(flushQueue, 5000);
    }
  }, [flushQueue]);

  // Track page view (path może zawierać ?query — UTM zapisujemy osobno, path bez query)
  const trackPageView = useCallback((path, pageName = null) => {
    const full = typeof path === 'string' ? path : '';
    let pathname = full;
    let search = '';
    const qIdx = full.indexOf('?');
    if (qIdx >= 0) {
      pathname = full.slice(0, qIdx);
      search = full.slice(qIdx);
    }
    const utm = parseUtmFromSearch(search);
    track(EVENT_TYPES.PAGE_VIEW, {
      path: pathname || '/',
      page: pageName || extractPageName(pathname),
      ...(utm ? { utm } : {})
    });
  }, [track]);

  const trackClientApiError = useCallback((endpoint, statusCode, detail) => {
    let sc = statusCode;
    if (sc != null && (!Number.isFinite(Number(sc)) || Number(sc) < 0)) sc = null;
    else if (sc != null) sc = Math.round(Number(sc));
    track(EVENT_TYPES.CLIENT_API_ERROR, {
      endpoint: String(endpoint || '').slice(0, 300),
      statusCode: sc,
      detail: detail != null ? String(detail).slice(0, 200) : undefined
    });
  }, [track]);

  // Track search
  const trackSearch = useCallback((query, filters = {}, resultCount = 0) => {
    track(EVENT_TYPES.SEARCH, {
      query,
      filters,
      resultCount
    });
  }, [track]);

  // Track filter applied
  const trackFilterApplied = useCallback((filterType, filterValue) => {
    track(EVENT_TYPES.FILTER_APPLIED, {
      filterType,
      filterValue
    });
  }, [track]);

  // Track category selected
  const trackCategorySelected = useCallback((categoryId, categoryName) => {
    track(EVENT_TYPES.CATEGORY_SELECTED, {
      categoryId,
      categoryName
    });
  }, [track]);

  // Track provider view
  const trackProviderView = useCallback((providerId, viewType = 'profile') => {
    track(EVENT_TYPES.PROVIDER_VIEW, {
      providerId,
      viewType
    });
  }, [track]);

  // Track provider contact
  const trackProviderContact = useCallback((providerId, contactType) => {
    track(EVENT_TYPES.PROVIDER_CONTACT, {
      providerId,
      contactType
    });
  }, [track]);

  // Track provider compare
  const trackProviderCompare = useCallback((providerIds) => {
    track(EVENT_TYPES.PROVIDER_COMPARE, {
      providerIds,
      compareCount: providerIds.length
    });
  }, [track]);

  // Track order created
  const trackOrderCreated = useCallback((orderId, service, orderType = 'manual') => {
    track(EVENT_TYPES.ORDER_CREATED, {
      orderId,
      service,
      orderType
    });
  }, [track]);

  // Funnel: tworzenie zlecenia
  const trackOrderFormStart = useCallback(() => {
    track(EVENT_TYPES.ORDER_FORM_START, {});
  }, [track]);

  const trackOrderStepView = useCallback((step) => {
    track(EVENT_TYPES.ORDER_STEP_VIEW, { step });
  }, [track]);

  const trackOrderFormAbandon = useCallback((lastStep = null) => {
    track(EVENT_TYPES.ORDER_FORM_ABANDON, { lastStep });
  }, [track]);

  const trackOrderFormSuccess = useCallback((orderId, orderType) => {
    track(EVENT_TYPES.ORDER_FORM_SUCCESS, { orderId, orderType });
  }, [track]);

  // Funnel: składanie oferty
  const trackOfferFormStart = useCallback((orderId) => {
    track(EVENT_TYPES.OFFER_FORM_START, { orderId });
  }, [track]);

  const trackOfferStepView = useCallback((step, orderId) => {
    track(EVENT_TYPES.OFFER_STEP_VIEW, { step, orderId });
  }, [track]);

  const trackOfferFormSubmit = useCallback((orderId, amount) => {
    track(EVENT_TYPES.OFFER_FORM_SUBMIT, { orderId, amount });
  }, [track]);

  const trackOrderAccepted = useCallback((orderId, providerId) => {
    track(EVENT_TYPES.ORDER_ACCEPTED, { orderId, providerId });
  }, [track]);

  // Track payment
  const trackPayment = useCallback((orderId, amount, paymentMethod, success = true) => {
    const eventType = success ? EVENT_TYPES.PAYMENT_SUCCEEDED : EVENT_TYPES.PAYMENT_FAILED;
    track(eventType, {
      orderId,
      amount,
      paymentMethod,
      currency: 'PLN'
    });
  }, [track]);

  // Cleanup na unmount
  useEffect(() => {
    return () => {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      // Flush pozostałe eventy
      flushQueue();
    };
  }, [flushQueue]);

  return {
    track,
    trackPageView,
    trackClientApiError,
    trackSearch,
    trackFilterApplied,
    trackCategorySelected,
    trackProviderView,
    trackProviderContact,
    trackProviderCompare,
    trackOrderCreated,
    trackOrderFormStart,
    trackOrderStepView,
    trackOrderFormAbandon,
    trackOrderFormSuccess,
    trackOfferFormStart,
    trackOfferStepView,
    trackOfferFormSubmit,
    trackOrderAccepted,
    trackPayment,
    sessionId: sessionId.current
  };
}

// Hook do automatycznego trackowania page views
export function usePageTracking() {
  const { trackPageView } = useTelemetry();
  const location = window.location;

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search, trackPageView]);
}

