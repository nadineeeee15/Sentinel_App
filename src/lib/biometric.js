// Local-only biometric helpers using the WebAuthn platform authenticator.
// This provides a biometric unlock UX on supported devices; it is a local
// convenience gate (no server-side validation), complementing the app PIN.

const BIO_KEY = "sentinel_biometric";

export async function biometricAvailable() {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function biometricEnabled() {
  try {
    return !!localStorage.getItem(BIO_KEY);
  } catch {
    return false;
  }
}

function randomBytes(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function enableBiometric() {
  const challenge = randomBytes(32);
  const userId = randomBytes(16);
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Sentinel" },
      user: { id: userId, name: "Sentinel User", displayName: "Sentinel User" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
      timeout: 60000,
    },
  });
  const credentialId = toBase64(cred.rawId);
  localStorage.setItem(BIO_KEY, JSON.stringify({ credentialId }));
  return true;
}

export async function biometricUnlock() {
  const stored = JSON.parse(localStorage.getItem(BIO_KEY) || "null");
  if (!stored) return false;
  const challenge = randomBytes(32);
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: "required",
      allowCredentials: [{ type: "public-key", id: fromBase64(stored.credentialId) }],
    },
  });
  return !!assertion;
}

export function disableBiometric() {
  try {
    localStorage.removeItem(BIO_KEY);
  } catch {}
}