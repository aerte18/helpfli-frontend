/**
 * Operator serwisu Helpfli — dane publikowane w regulaminie, polityce prywatności, stopce, P24.
 * Na razie bez formy spółki (KRS/NIP) — tylko marka Helpfli i kontakt.
 */
const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const CONTACT_EMAIL =
  env.VITE_COMPANY_EMAIL_CONTACT ||
  env.VITE_COMPANY_EMAIL_LEGAL ||
  env.VITE_COMPANY_EMAIL_PRIVACY ||
  "helpfli@outlook.com";

export const companyPublicInfo = {
  brand: "Helpfli",
  legalName: env.VITE_COMPANY_LEGAL_NAME || "Helpfli",
  /** false = nie pokazuj KRS/NIP/REGON w UI (do czasu rejestracji spółki) */
  showRegistry: env.VITE_COMPANY_SHOW_REGISTRY === "true",
  addressLine1: env.VITE_COMPANY_ADDRESS_LINE1 || "",
  addressLine2: env.VITE_COMPANY_ADDRESS_LINE2 || "",
  country: env.VITE_COMPANY_COUNTRY || "Polska",
  krs: env.VITE_COMPANY_KRS || "",
  nip: env.VITE_COMPANY_NIP || "",
  regon: env.VITE_COMPANY_REGON || "",
  emailContact: CONTACT_EMAIL,
  emailLegal: CONTACT_EMAIL,
  emailPrivacy: CONTACT_EMAIL,
  emailSupport: CONTACT_EMAIL,
  phone: env.VITE_COMPANY_PHONE || "",
  siteUrl: env.VITE_PUBLIC_SITE_URL || "https://helpfli.pl",
};

/** Profile w mediach społecznościowych (stopka, kontakt). Nadpisanie przez VITE_SOCIAL_* */
export const companySocialLinks = [
  {
    id: "facebook",
    label: "Facebook",
    href: env.VITE_SOCIAL_FACEBOOK || "https://www.facebook.com/profile.php?id=61590230825976",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: env.VITE_SOCIAL_INSTAGRAM || "https://www.instagram.com/helpfli/",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: env.VITE_SOCIAL_TIKTOK || "https://www.tiktok.com/@helpfli",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: env.VITE_SOCIAL_YOUTUBE || "https://www.youtube.com/channel/UCgcEFMcLXQChzBo7ws5l4Hw",
  },
  {
    id: "x",
    label: "X (Twitter)",
    href: env.VITE_SOCIAL_X || "https://x.com/helpflipl",
  },
].filter((item) => item.href?.trim());

/** Akapit o operatorze do regulaminu / polityki */
export function operatorIntroParagraph() {
  const c = companyPublicInfo;
  const site = c.siteUrl.replace(/^https?:\/\//, "");
  let text = `Platformę ${c.brand} (${site}) prowadzi ${c.legalName}`;
  if (c.addressLine1?.trim()) {
    text += `, ${c.addressLine1}${c.addressLine2?.trim() ? `, ${c.addressLine2}` : ""}, ${c.country}`;
  } else {
    text += ` (${c.country})`;
  }
  if (c.showRegistry && c.krs?.trim()) {
    text += `, wpisaną do KRS pod numerem ${c.krs}`;
    if (c.nip?.trim()) text += `, NIP: ${c.nip}`;
    if (c.regon?.trim()) text += `, REGON: ${c.regon}`;
  }
  text += ".";
  return text;
}

export function companyLegalBlockLines() {
  const c = companyPublicInfo;
  const lines = [c.legalName];
  if (c.addressLine1?.trim()) {
    lines.push(c.addressLine1);
    if (c.addressLine2?.trim()) lines.push(c.addressLine2);
    lines.push(c.country);
  }
  if (c.showRegistry && c.krs?.trim()) {
    const reg = [c.krs && `KRS: ${c.krs}`, c.nip && `NIP: ${c.nip}`, c.regon && `REGON: ${c.regon}`]
      .filter(Boolean)
      .join(" · ");
    if (reg) lines.push(reg);
  }
  lines.push(`E-mail: ${c.emailContact}${c.phone?.trim() ? ` · Tel.: ${c.phone}` : ""}`);
  return lines;
}
