/**
 * Docelowa trasa po kliknięciu powiadomienia (SPA).
 * Obsługuje linki względne, pełne URL oraz fallback z metadata.orderId.
 */
export function getNotificationNavigateTarget(notification) {
  if (!notification) return null;

  const meta =
    notification.metadata && typeof notification.metadata === "object"
      ? notification.metadata
      : {};
  const oid = meta.orderId != null ? String(meta.orderId) : "";

  const parseLink = (raw) => {
    if (raw == null || typeof raw !== "string") return null;
    const t = raw.trim();
    if (!t) return null;
    try {
      const u =
        t.startsWith("http://") || t.startsWith("https://")
          ? new URL(t)
          : new URL(t, window.location.origin);
      return { pathname: u.pathname, search: u.search || "" };
    } catch {
      if (t.startsWith("/")) {
        const q = t.indexOf("?");
        if (q === -1) return { pathname: t, search: "" };
        return { pathname: t.slice(0, q), search: t.slice(q) };
      }
      return null;
    }
  };

  let target = parseLink(notification.link);

  if (!target && oid) {
    const type = notification.type;
    if (type === "chat_message") {
      target = { pathname: `/orders/${oid}/chat`, search: "" };
    } else if (type === "new_offer" || type === "new_quote") {
      target = { pathname: `/orders/${oid}`, search: "?tab=details" };
    } else {
      target = { pathname: `/orders/${oid}`, search: "" };
    }
  }

  if (!target && notification.type === "chat_message" && meta.conversationId) {
    target = { pathname: "/messages", search: "" };
  }

  if (
    !target &&
    (notification.type === "subscription_expiring" ||
      notification.type === "subscription_expired" ||
      notification.type === "subscription_renewed")
  ) {
    target = { pathname: "/account/subscriptions", search: "" };
  }

  return target;
}
