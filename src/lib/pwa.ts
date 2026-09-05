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