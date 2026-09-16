// Shared app-lock PIN helpers. The PIN is a local-only convenience gate
// (hashed with djb2) — it is never sent anywhere.

export const NAME_KEY = "sentinel_user_name";
export const PIN_KEY = "sentinel_app_pin";

export function hashPin(pin) {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = (h * 33) + pin.charCodeAt(i);
  return String(h >>> 0);
}

export function getStoredPin() {
  try {
    return localStorage.getItem(PIN_KEY);
  } catch {
    return null;
  }
}

export function setStoredPin(pin) {
  try {
    localStorage.setItem(PIN_KEY, hashPin(pin));
  } catch {}
}

export function clearStoredPin() {
  try {
    localStorage.removeItem(PIN_KEY);
  } catch {}
}

export function getStoredName() {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}