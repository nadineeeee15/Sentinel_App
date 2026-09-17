// Encrypt/decrypt the sensitive text fields of an incident using the
// in-session DEK (AES-GCM). Only ciphertext is ever sent to the Base44 DB.
// Shared by NewReport (write), IncidentDetail/Home/Reports (read).
import { encryptText, decryptText } from "@/lib/crypto";

const FIELDS = ["title", "description", "location", "ai_report"];

// Returns a copy of `plain` with the sensitive fields replaced by ciphertext.
// Throws "App is locked" if no DEK is available (propagated from encryptText).
export async function encryptIncident(plain) {
  const enc = {};
  for (const f of FIELDS) {
    const v = plain[f];
    enc[f] = v != null && v !== "" ? await encryptText(v) : v;
  }
  return { ...plain, ...enc };
}

// Returns a copy of `stored` with the sensitive fields decrypted to plaintext.
// Falls back to the raw value if a field isn't encrypted or can't be decrypted
// (e.g. legacy plaintext records, or records from before a PIN reset).
export async function decryptIncident(stored) {
  if (!stored) return stored;
  const dec = {};
  for (const f of FIELDS) {
    const v = stored[f];
    if (v != null && v !== "") {
      try {
        dec[f] = await decryptText(v);
      } catch {
        dec[f] = v;
      }
    } else {
      dec[f] = v;
    }
  }
  return { ...stored, ...dec };
}