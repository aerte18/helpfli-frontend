const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

/** Bezpieczna ścieżka wewnętrzna (bez open redirect). */
export function safeNextPath(next, fallback = "") {
  if (!next || typeof next !== "string") return fallback;
  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
  if (AUTH_PATHS.some((p) => decoded === p || decoded.startsWith(`${p}?`))) return fallback;
  return decoded;
}

export function storePostOnboardingNext(nextParam) {
  const safe = safeNextPath(nextParam, "");
  if (!safe) return;
  try {
    sessionStorage.setItem("postOnboardingNext", safe);
  } catch {
    /* ignore */
  }
}

export function consumePostOnboardingNext() {
  try {
    const stored = sessionStorage.getItem("postOnboardingNext");
    sessionStorage.removeItem("postOnboardingNext");
    return safeNextPath(stored, "");
  } catch {
    return "";
  }
}

export function defaultPathForRole(userData) {
  if (userData?.role === "admin") return "/admin";

  const isCompanyUser =
    userData?.role === "company_owner" ||
    userData?.role === "company_manager" ||
    (userData?.company &&
      (userData?.roleInCompany === "owner" || userData?.roleInCompany === "manager"));

  if (isCompanyUser) return "/account/company";
  if (userData?.role === "provider") return "/provider-home";
  return "/home";
}

/** Docelowa ścieżka po udanym logowaniu / onboardingu. */
export function getPostLoginPath(userData, nextParam) {
  if (!userData?.onboardingCompleted) {
    storePostOnboardingNext(nextParam);
    return "/onboarding";
  }

  const safeNext = safeNextPath(nextParam, "");
  if (safeNext) return safeNext;

  const deferred = consumePostOnboardingNext();
  if (deferred) return deferred;

  return defaultPathForRole(userData);
}

export function loginUrlWithNext(pathname, search = "") {
  const target = `${pathname}${search}`;
  return `/login?next=${encodeURIComponent(target)}`;
}
