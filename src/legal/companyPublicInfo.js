/**
 * Dane publikowane na stronie (P24, Stripe, konsument).
 * Uzupełnij zmienne środowiskowe VITE_COMPANY_* w produkcji lub edytuj domyślne wartości po wpisie do KRS.
 */
const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

export const companyPublicInfo = {
  brand: "Helpfli",
  legalName: env.VITE_COMPANY_LEGAL_NAME || "Helpfli Sp. z o.o.",
  /** Pełny adres do korespondencji i rejestru */
  addressLine1: env.VITE_COMPANY_ADDRESS_LINE1 || "[ulica i numer — uzupełnij]",
  addressLine2: env.VITE_COMPANY_ADDRESS_LINE2 || "[kod pocztowy i miejscowość — uzupełnij]",
  country: env.VITE_COMPANY_COUNTRY || "Polska",
  krs: env.VITE_COMPANY_KRS || "[numer KRS — uzupełnij]",
  nip: env.VITE_COMPANY_NIP || "[NIP — uzupełnij]",
  regon: env.VITE_COMPANY_REGON || "[REGON — uzupełnij]",
  emailLegal: env.VITE_COMPANY_EMAIL_LEGAL || "kontakt@helpfli.pl",
  emailPrivacy: env.VITE_COMPANY_EMAIL_PRIVACY || "kontakt@helpfli.pl",
  phone: env.VITE_COMPANY_PHONE || "[telefon — uzupełnij]",
  siteUrl: env.VITE_PUBLIC_SITE_URL || "https://helpfli.pl",
};

export function companyLegalBlockLines() {
  const c = companyPublicInfo;
  return [
    c.legalName,
    c.addressLine1,
    c.addressLine2,
    `${c.country} · KRS: ${c.krs} · NIP: ${c.nip} · REGON: ${c.regon}`,
    `E-mail: ${c.emailLegal} · Tel.: ${c.phone}`,
  ];
}
