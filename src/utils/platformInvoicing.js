/**
 * Faktury VAT od Helpfli (subskrypcje, boosty, opłaty platformy).
 * Wyłączone dopóki nie ma firmy / danych sprzedawcy — ustaw VITE_PLATFORM_INVOICING_ENABLED=true.
 */
export function isPlatformInvoicingEnabled() {
  const flag = import.meta.env.VITE_PLATFORM_INVOICING_ENABLED;
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  const nip = String(import.meta.env.VITE_INVOICE_SELLER_NIP || '').trim();
  return nip.length >= 10;
}
