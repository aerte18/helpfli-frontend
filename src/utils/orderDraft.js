const ORDER_DRAFT_KEY = "helpfli_order_draft_v1";
const ORDER_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const DRAFT_FIELDS = [
  "service",
  "serviceDetails",
  "description",
  "location",
  "orderType",
  "budget",
  "urgency",
  "contactPreference",
  "paymentPreference",
  "requestInvoice",
  "orderMode",
  "selectedCategory",
  "selectedProvider",
  "isOtherSubcategory",
  "acquisitionSource",
];

function pickDraftFields(value = {}) {
  const result = DRAFT_FIELDS.reduce((draft, key) => {
    if (value[key] !== undefined) draft[key] = value[key];
    return draft;
  }, {});
  if (result.selectedProvider) {
    result.selectedProvider = {
      id: String(result.selectedProvider.id || "").slice(0, 64),
      name: String(result.selectedProvider.name || "").slice(0, 120),
    };
    if (!result.selectedProvider.id) delete result.selectedProvider;
  }
  return result;
}

export function saveOrderDraft(value) {
  if (typeof window === "undefined") return false;
  try {
    const draft = pickDraftFields(value);
    const hasMeaningfulContent = Boolean(
      String(draft.service || "").trim() ||
        String(draft.description || "").trim() ||
        String(draft.location || "").trim()
    );
    if (!hasMeaningfulContent) return false;

    window.localStorage.setItem(
      ORDER_DRAFT_KEY,
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        expiresAt: Date.now() + ORDER_DRAFT_TTL_MS,
        draft,
      })
    );
    window.dispatchEvent(new CustomEvent("helpfli-order-draft-changed"));
    return true;
  } catch {
    return false;
  }
}

export function loadOrderDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORDER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.draft || !parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      clearOrderDraft();
      return null;
    }
    return pickDraftFields(parsed.draft);
  } catch {
    clearOrderDraft();
    return null;
  }
}

export function clearOrderDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ORDER_DRAFT_KEY);
    window.dispatchEvent(new CustomEvent("helpfli-order-draft-changed"));
  } catch {
    // localStorage may be unavailable in privacy mode.
  }
}

export { ORDER_DRAFT_KEY, ORDER_DRAFT_TTL_MS };
