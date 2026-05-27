/** Trasy, na których FAB AI i dolny tab bar kolidują z kompozytorem czatu (mobile). */
export function isChatContextRoute(location) {
  const pathname = location?.pathname || "";
  const search = location?.search || "";
  const params = new URLSearchParams(search);
  const isOrdersChatTab =
    pathname.startsWith("/orders/") && params.get("tab") === "chat";
  const isMessagesRoute =
    pathname === "/messages" || pathname === "/inbox";
  return isOrdersChatTab || isMessagesRoute;
}

const KEYBOARD_OPEN_PX = 80;

export function syncMobileKeyboardInset() {
  const root = document.documentElement;
  const vv = window.visualViewport;
  if (!vv || !window.matchMedia("(max-width: 767px)").matches) {
    root.style.setProperty("--qs-keyboard-inset", "0px");
    document.body.classList.remove("qs-keyboard-open");
    return 0;
  }
  const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  const open = inset >= KEYBOARD_OPEN_PX;
  root.style.setProperty("--qs-keyboard-inset", open ? `${inset}px` : "0px");
  document.body.classList.toggle("qs-keyboard-open", open);
  return inset;
}

export function clearMobileKeyboardInset() {
  document.documentElement.style.setProperty("--qs-keyboard-inset", "0px");
  document.body.classList.remove("qs-keyboard-open");
}
