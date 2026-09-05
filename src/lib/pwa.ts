/**
 * True when the app is running as an INSTALLED progressive web app
 * (launched from the home screen in standalone/fullscreen or iOS Safari
 * standalone), false when opened as a plain browser tab. Used to gate the
 * phone-native actions (e.g. opening the SMS app via sms: URI) to the PWA
 * experience only.
 */
export function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  if (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches
  ) {
    return true;
  }
  // iOS Safari legacy — navigator.standalone is true when added to Home Screen.
  return !!(
    navigator as Navigator & { standalone?: boolean }
  ).standalone;
}

/**
 * True when the current device can actually hand over to a native SMS app
 * via a sms: URI. This covers BOTH the installed PWA and any touch/mobile
 * browser tab (mobile Chrome / iOS Safari both support sms: links). Only
 * plain desktop browsers (no touch, no standalone) are excluded, because
 * there sms: links usually do nothing.
 */
export function canLaunchSms(): boolean {
  if (isPwaInstalled()) return true;
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0)
  );
}