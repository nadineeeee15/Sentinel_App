// Shared app-lock PIN helpers. The PIN never leaves the device.
//
// Stored as {"v":2,"salt":"<b64>","hash":"<b64>"}: PBKDF2-SHA-256, a random
// 16-byte salt, 100,000 iterations. Older installs stored a djb2 string; it is
// still accepted once and silently re-saved in the new format.
//
// Honest limit: a 4-digit PIN has only 10,000 possibilities. The salt, slow
// hash and lockout below stop guessing THROUGH THE APP, but someone who copies
// this browser's storage can still try every PIN offline. The PIN is a quick
// on-device gate, not protection against a forensic copy of the device.

export const NAME_KEY = "sentinel_user_name";
export const PIN_KEY = "sentinel_app_pin";
const LOCKOUT_KEY = "sentinel_pin_lockout";

const PBKDF2_ITERATIONS = 100000;
const FAILS_PER_LOCK = 5;
const BASE_LOCK_MS = 30 * 1000;
const MAX_LOCK_MS = 15 * 60 * 1000;

function bytesToB64(bytes) {
  let s = "";
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s);
}

function b64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function derivePinHash(pin, salt) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS }, key, 256
  );
  return new Uint8Array(bits);
}

// Constant-time comparison: always walks every byte, no early return.
function timingSafeEqual(a, b) {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

// Pre-v2 hash, kept only to recognise and migrate old stored PINs.
function legacyDjb2(pin) {
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

export async function setStoredPin(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinHash(pin, salt);
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify({ v: 2, salt: bytesToB64(salt), hash: bytesToB64(hash) }));
  } catch {}
}

export async function verifyPin(pin) {
  const stored = getStoredPin();
  if (!stored) return false;

  let parsed = null;
  try { parsed = JSON.parse(stored); } catch {}
  if (parsed && parsed.v === 2 && parsed.salt && parsed.hash) {
    const hash = await derivePinHash(pin, b64ToBytes(parsed.salt));
    return timingSafeEqual(hash, b64ToBytes(parsed.hash));
  }

  // Legacy djb2 value: accept a match, then upgrade it in place.
  const enc = new TextEncoder();
  if (timingSafeEqual(enc.encode(legacyDjb2(pin)), enc.encode(stored))) {
    await setStoredPin(pin);
    return true;
  }
  return false;
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

// --- Failed-attempt lockout -------------------------------------------------
// After every 5 wrong PINs the keypad is locked: 30 s, then 1 min, 2 min, ...
// capped at 15 min. A correct PIN (or Face ID) resets the count.
//
// Deliberately NEVER wipes data on failed attempts: an abuser with the phone
// could otherwise destroy the victim's evidence just by typing wrong PINs.
// The counter lives in localStorage, so it slows guessing through the app; it
// is not a defence against someone editing the browser's storage directly.

function readLockout() {
  try {
    const v = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "null");
    if (v && typeof v.fails === "number") return { fails: v.fails, until: v.until || 0 };
  } catch {}
  return { fails: 0, until: 0 };
}

function writeLockout(v) {
  try { localStorage.setItem(LOCKOUT_KEY, JSON.stringify(v)); } catch {}
}

// Milliseconds left in the current lockout (0 when not locked).
export function pinLockRemainingMs() {
  return Math.max(0, readLockout().until - Date.now());
}

// Records a wrong PIN; returns the new lockout's length in ms (0 if none yet).
export function recordFailedPin() {
  const { fails } = readLockout();
  const next = fails + 1;
  let until = 0;
  let wait = 0;
  if (next % FAILS_PER_LOCK === 0) {
    wait = Math.min(BASE_LOCK_MS * 2 ** (next / FAILS_PER_LOCK - 1), MAX_LOCK_MS);
    until = Date.now() + wait;
  }
  writeLockout({ fails: next, until });
  return wait;
}

export function resetPinFailures() {
  try { localStorage.removeItem(LOCKOUT_KEY); } catch {}
}
