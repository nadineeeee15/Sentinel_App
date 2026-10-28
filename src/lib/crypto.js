// AES-GCM envelope encryption for local attachments, using the Web Crypto
// API only (no third-party crypto libraries).
//
// Key model:
//   DEK (data-encryption key) — one random 256-bit AES-GCM key per device;
//                               it actually encrypts the attachment bytes.
//   KEK (key-encryption key)  — derived from the user's PIN via PBKDF2; used
//                               to wrap (encrypt) the DEK in localStorage.
//   Bio KEK                  — derived from a random secret; used to wrap the
//                               DEK so biometric unlock can load it without
//                               re-entering the PIN (convenience gate).
//
// Only the *wrapped* DEK and salts are persisted. The plaintext DEK lives only
// in memory while the app is unlocked and is wiped on lock.

const WRAPPED_DEK_KEY = "sentinel_wrapped_dek";
const DEK_SALT_KEY = "sentinel_dek_salt";
const DEK_IV_KEY = "sentinel_dek_iv";
const BIO_SECRET_KEY = "sentinel_bio_secret";
const BIO_WRAPPED_DEK_KEY = "sentinel_bio_wrapped_dek";
const BIO_DEK_IV_KEY = "sentinel_bio_dek_iv";

const PBKDF2_ITERATIONS = 100000;

let sessionKey = null; // CryptoKey (DEK) held in memory while unlocked
// Older DEKs found on this device that differ from the current one (e.g. a
// biometric-only DEK from before the key-sync fix). Used for decryption only,
// never for encryption, so older reports stay readable. Wiped on lock.
let fallbackKeys = [];

export function cryptoAvailable() {
  return typeof window !== "undefined" && !!window.crypto?.subtle;
}

export function hasSessionKey() {
  return !!sessionKey;
}
export function getSessionKey() {
  return sessionKey;
}
export function setSessionKey(key) {
  sessionKey = key;
}
export function clearSessionKey() {
  sessionKey = null;
  fallbackKeys = [];
}

async function sameKey(a, b) {
  const [ra, rb] = await Promise.all([
    crypto.subtle.exportKey("raw", a),
    crypto.subtle.exportKey("raw", b),
  ]);
  return bufToB64(ra) === bufToB64(rb);
}

// --- base64 helpers ---
function bufToB64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64ToBytes(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function randomBytes(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

// --- key derivation / wrapping ---
async function deriveKek(pin, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["wrapKey", "unwrapKey"]
  );
}

async function generateDek() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
}

function storeWrappedDek(wrapped, iv, salt) {
  try {
    localStorage.setItem(WRAPPED_DEK_KEY, bufToB64(wrapped));
    localStorage.setItem(DEK_IV_KEY, bufToB64(iv));
    localStorage.setItem(DEK_SALT_KEY, bufToB64(salt));
  } catch {}
}

function loadWrappedDek() {
  try {
    const w = localStorage.getItem(WRAPPED_DEK_KEY);
    const iv = localStorage.getItem(DEK_IV_KEY);
    const salt = localStorage.getItem(DEK_SALT_KEY);
    if (!w || !iv || !salt) return null;
    return { wrapped: b64ToBytes(w), iv: b64ToBytes(iv), salt: b64ToBytes(salt) };
  } catch {
    return null;
  }
}

export function hasWrappedDek() {
  try {
    return !!localStorage.getItem(WRAPPED_DEK_KEY);
  } catch {
    return false;
  }
}

export function clearWrappedDek() {
  try {
    localStorage.removeItem(WRAPPED_DEK_KEY);
    localStorage.removeItem(DEK_SALT_KEY);
    localStorage.removeItem(DEK_IV_KEY);
  } catch {}
  removeBiometricWrappedDek();
  clearSessionKey();
}

// --- public lifecycle ---

// Generate a fresh DEK and hold it in memory (no persistence).
export async function generateSessionDek() {
  if (!cryptoAvailable()) return false;
  setSessionKey(await generateDek());
  return true;
}

// PIN setup: wrap the current DEK (or a fresh one) under the PIN, persist.
export async function setupNewPinEncryption(pin) {
  if (!cryptoAvailable()) return false;
  // Reuse the DEK already in memory (e.g. one created by biometric setup) so
  // existing reports stay readable. Only create a new key when there is none.
  if (!hasSessionKey()) await generateSessionDek();
  const dek = getSessionKey();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const kek = await deriveKek(pin, salt);
  const wrapped = await crypto.subtle.wrapKey("raw", dek, kek, { name: "AES-GCM", iv });
  storeWrappedDek(wrapped, iv, salt);
  // Keep the biometric wrap in sync with this new DEK so bio and PIN
  // unlocks always load the same key.
  if (hasBiometricWrappedDek()) {
    await wrapDekForBiometric(dek).catch(() => {});
  }
  return true;
}

// Unlock: derive KEK from PIN, unwrap the stored DEK, hold it in memory.
export async function unlockWithPin(pin) {
  if (!cryptoAvailable()) return false;
  const stored = loadWrappedDek();
  if (!stored) return false;
  try {
    const kek = await deriveKek(pin, stored.salt);
    const dek = await crypto.subtle.unwrapKey(
      "raw", stored.wrapped, kek, { name: "AES-GCM", iv: stored.iv },
      { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
    setSessionKey(dek);
    // Previously this overwrote the biometric-wrapped DEK with the PIN one,
    // which destroyed the biometric key if the two had diverged. Now, if the
    // biometric DEK differs, keep it in memory as a decrypt-only fallback so
    // reports encrypted under it remain readable, and leave it untouched.
    const bioDek = await loadBiometricDek().catch(() => null);
    if (bioDek && !(await sameKey(dek, bioDek))) {
      fallbackKeys = [bioDek];
      console.warn("[Sentinel] PIN and biometric keys differ; using biometric key as decrypt fallback.");
    }
    return true;
  } catch {
    return false;
  }
}

// Change PIN: re-wrap the current session DEK under the new PIN.
// Attachments are NOT re-encrypted (envelope encryption) — instant.
export async function changePinEncryption(newPin) {
  if (!cryptoAvailable() || !hasSessionKey()) return false;
  const dek = getSessionKey();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const kek = await deriveKek(newPin, salt);
  const wrapped = await crypto.subtle.wrapKey("raw", dek, kek, { name: "AES-GCM", iv });
  storeWrappedDek(wrapped, iv, salt);
  return true;
}

// Forgot-PIN reset: brand-new DEK. Attachments encrypted under the old DEK
// become permanently undecryptable (no backdoor).
export async function resetPinEncryption(newPin) {
  if (!cryptoAvailable()) return false;
  setSessionKey(await generateDek());
  const dek = getSessionKey();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const kek = await deriveKek(newPin, salt);
  const wrapped = await crypto.subtle.wrapKey("raw", dek, kek, { name: "AES-GCM", iv });
  storeWrappedDek(wrapped, iv, salt);
  removeBiometricWrappedDek();
  return true;
}

// --- biometric convenience wrapping ---
async function getBioKek() {
  let secretB64;
  try {
    secretB64 = localStorage.getItem(BIO_SECRET_KEY);
  } catch {
    secretB64 = null;
  }
  let secret;
  if (!secretB64) {
    secret = randomBytes(32);
    try {
      localStorage.setItem(BIO_SECRET_KEY, bufToB64(secret));
    } catch {}
  } else {
    secret = b64ToBytes(secretB64);
  }
  return crypto.subtle.importKey(
    "raw", secret, { name: "AES-GCM" }, false, ["wrapKey", "unwrapKey"]
  );
}

async function wrapDekForBiometric(dek) {
  const kek = await getBioKek();
  const iv = randomBytes(12);
  const wrapped = await crypto.subtle.wrapKey("raw", dek, kek, { name: "AES-GCM", iv });
  try {
    localStorage.setItem(BIO_WRAPPED_DEK_KEY, bufToB64(wrapped));
    localStorage.setItem(BIO_DEK_IV_KEY, bufToB64(iv));
  } catch {}
}

export function removeBiometricWrappedDek() {
  try {
    localStorage.removeItem(BIO_WRAPPED_DEK_KEY);
    localStorage.removeItem(BIO_DEK_IV_KEY);
  } catch {}
}

export function hasBiometricWrappedDek() {
  try {
    return !!localStorage.getItem(BIO_WRAPPED_DEK_KEY);
  } catch {
    return false;
  }
}

// Wrap the current session DEK for biometric unlock (call after enabling bio).
export async function enableBiometricEncryption() {
  if (!cryptoAvailable() || !hasSessionKey()) return false;
  await wrapDekForBiometric(getSessionKey());
  return true;
}

// Unwrap the bio-wrapped DEK without changing session state.
async function loadBiometricDek() {
  let w, iv;
  try {
    w = localStorage.getItem(BIO_WRAPPED_DEK_KEY);
    iv = localStorage.getItem(BIO_DEK_IV_KEY);
  } catch {
    return null;
  }
  if (!w || !iv) return null;
  const kek = await getBioKek();
  return crypto.subtle.unwrapKey(
    "raw", b64ToBytes(w), kek, { name: "AES-GCM", iv: b64ToBytes(iv) },
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
}

// Biometric unlock: unwrap the bio-wrapped DEK into memory.
export async function unlockWithBiometric() {
  if (!cryptoAvailable()) return false;
  try {
    const dek = await loadBiometricDek();
    if (!dek) return false;
    setSessionKey(dek);
    return true;
  } catch {
    return false;
  }
}

// --- attachment encrypt / decrypt (use the in-memory DEK) ---
export async function encryptDataUrl(dataUrl) {
  if (!hasSessionKey()) throw new Error("App is locked.");
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, sessionKey, new TextEncoder().encode(dataUrl)
  );
  return { iv: bufToB64(iv), ciphertext: bufToB64(ct) };
}

export async function decryptDataUrl(ivB64, ctB64) {
  if (!hasSessionKey()) throw new Error("App is locked.");
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(ivB64) }, sessionKey, b64ToBytes(ctB64)
  );
  return new TextDecoder().decode(pt);
}

// --- incident text field encryption (same DEK + AES-GCM as attachments) ---
// The encrypted value is a JSON string: { iv, ciphertext, encrypted, version }.
// Stored in the Base44 DB string fields so only ciphertext leaves the device.
export async function encryptText(plaintext) {
  if (!hasSessionKey()) throw new Error("App is locked.");
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, sessionKey, new TextEncoder().encode(plaintext)
  );
  return JSON.stringify({
    iv: bufToB64(iv),
    ciphertext: bufToB64(ct),
    encrypted: true,
    version: 1,
  });
}

export async function decryptText(stored) {
  if (!hasSessionKey()) throw new Error("App is locked.");
  if (!stored || typeof stored !== "string") return stored;
  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return stored; // legacy plaintext (pre-encryption) — pass through
  }
  if (!parsed || !parsed.encrypted || !parsed.iv || !parsed.ciphertext) {
    return stored; // not an encrypted envelope — plain text
  }
  const iv = b64ToBytes(parsed.iv);
  const ct = b64ToBytes(parsed.ciphertext);
  let lastErr;
  for (const key of [sessionKey, ...fallbackKeys]) {
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return new TextDecoder().decode(pt);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}