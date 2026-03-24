import { api } from "./client";

/**
 * Pobiera role firmy
 * @param {string} companyId - ID firmy
 * @returns {Promise<{success: boolean, roles: Array}>}
 */
export const getCompanyRoles = async (companyId) => {
  return api(`/api/companies/${companyId}/roles`);
};

/**
 * Asystent AI dla firmy – jedna wiadomość i odpowiedź
 * @param {string} companyId - ID firmy
 * @param {string} message - Treść wiadomości
 * @param {Array} conversationHistory - Opcjonalna historia [{ role, content }]
 * @returns {Promise<{ response: string }>}
 */
export const companyAiChat = async (companyId, message, conversationHistory = []) => {
  return api(`/api/companies/${companyId}/ai/chat`, {
    method: 'POST',
    body: { message, conversationHistory }
  });
};

/**
 * Przypisuje custom rolę użytkownikowi w firmie
 * @param {string} companyId - ID firmy
 * @param {string} userId - ID użytkownika
 * @param {string|null} roleId - ID roli (null aby usunąć rolę)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const assignCustomRole = async (companyId, userId, roleId) => {
  return api(`/api/companies/${companyId}/members/${userId}/custom-role`, {
    method: 'PUT',
    body: { roleId }
  });
};

/**
 * Oznacza onboarding firmy jako ukończony
 * @param {string} companyId - ID firmy
 * @returns {Promise<{success: boolean, company: Object}>}
 */
export const completeOnboarding = async (companyId) => {
  return api(`/api/companies/${companyId}/complete-onboarding`, {
    method: 'POST'
  });
};

/**
 * Pobiera analitykę firmy
 * @param {string} companyId - ID firmy
 * @param {Object} params - Parametry (from, to)
 * @returns {Promise<Object>}
 */
export const getCompanyAnalytics = async (companyId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api(`/api/companies/${companyId}/analytics/summary?${queryParams}`);
};

/**
 * Pobiera wydajność zespołu
 * @param {string} companyId - ID firmy
 * @param {Object} params - Parametry (from, to)
 * @returns {Promise<Object>}
 */
export const getTeamPerformance = async (companyId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api(`/api/companies/${companyId}/analytics/team-performance?${queryParams}`);
};

/**
 * Pobiera raport przychodów
 * @param {string} companyId - ID firmy
 * @param {Object} params - Parametry (from, to, groupBy)
 * @returns {Promise<Object>}
 */
export const getRevenueReport = async (companyId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api(`/api/companies/${companyId}/analytics/revenue-report?${queryParams}`);
};

/**
 * Eksportuje dane firmy
 * @param {string} companyId - ID firmy
 * @param {string} format - Format eksportu ('csv', 'json', 'xlsx')
 * @param {string} dataset - Zestaw danych ('orders', 'summary', 'team', 'revenue')
 * @param {Object} dateRange - Zakres dat (from, to)
 * @returns {Promise<Blob>}
 */
export const exportCompanyData = async (companyId, format, dataset, dateRange = {}) => {
  const params = new URLSearchParams({
    format,
    dataset,
    ...dateRange
  }).toString();
  
  const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/companies/${companyId}/analytics/export?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Błąd eksportu danych');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `company-${dataset}-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  
  return blob;
};

/**
 * Pobiera podsumowanie rozliczeń firmy
 * @param {string} companyId - ID firmy
 * @param {Object} params - Parametry (from, to)
 * @returns {Promise<Object>}
 */
export const getBillingSummary = async (companyId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api(`/api/companies/${companyId}/billing/summary?${queryParams}`);
};

/**
 * Pobiera faktury firmy
 * @param {string} companyId - ID firmy
 * @param {Object} params - Parametry (from, to, status)
 * @returns {Promise<Object>}
 */
export const getInvoices = async (companyId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api(`/api/companies/${companyId}/billing/invoices?${queryParams}`);
};

// Uwaga: Funkcja generateInvoice została usunięta
// Faktury są teraz wystawiane przez KSeF

/**
 * Pobiera faktury zleceń od providerów firmy
 * @param {string} companyId - ID firmy
 * @param {Object} params - Parametry (from, to, providerId)
 * @returns {Promise<Object>}
 */
export const getCompanyOrderInvoices = async (companyId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api(`/api/companies/${companyId}/billing/orders/invoices?${queryParams}`);
};

/**
 * Pobiera faktury Helpfli dla firmy (subskrypcje, boosty, etc.)
 * @param {string} companyId - ID firmy
 * @param {Object} params - Parametry (from, to)
 * @returns {Promise<Object>}
 */
export const getCompanyHelpfliInvoices = async (companyId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api(`/api/companies/${companyId}/billing/helpfli-invoices?${queryParams}`);
};

/**
 * Pobiera subskrypcję biznesową dla firmy
 * @param {string} companyId - ID firmy
 * @returns {Promise<{success: boolean, subscription: Object|null}>}
 */
export const getCompanySubscription = async (companyId) => {
  return api(`/api/companies/${companyId}/subscription`);
};
