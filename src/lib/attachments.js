// Local-only attachment storage using IndexedDB.
// Attachments (e.g. sensitive screenshots/photos) never leave the device.
// They are encrypted at rest with AES-GCM (see crypto.js) using a
// data-encryption key held in memory only while the app is unlocked.
// Legacy plaintext records are migrated on first unlock via
// migrateLegacyAttachments().

import {
  cryptoAvailable, hasSessionKey, encryptDataUrl, decryptDataUrl,
} from "@/lib/crypto";

const DB_NAME = "cybersec-attachments";
const STORE = "attachments";
const VERSION = 1;
const MIGRATION_FLAG = "sentinel_migration_v1";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Local storage is not available in this browser."));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Downscale an image file to a max dimension (default 1280px) and re-encode as
// JPEG to keep IndexedDB usage small. Returns a data URL.
const MAX_IMAGE_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function downscaleDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
        resolve(dataUrl);
        return;
      }
      const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function canEncrypt() {
  return cryptoAvailable() && hasSessionKey();
}

async function encryptIfPossible(dataUrl) {
  if (canEncrypt()) {
    const { iv, ciphertext } = await encryptDataUrl(dataUrl);
    return { iv, ciphertext, encrypted: true, version: 1 };
  }
  return { dataUrl, encrypted: false, version: 1 };
}

export async function addInMemoryAttachment(incidentId, att) {
  const db = await openDB();
  const enc = await encryptIfPossible(att.dataUrl);
  const record = {
    incident_id: incidentId,
    name: att.name || "attachment",
    type: att.type || "image/*",
    size: att.size || 0,
    created_date: new Date().toISOString(),
    ...enc,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(record);
    req.onsuccess = () => resolve({ ...record, id: req.result, dataUrl: att.dataUrl });
    req.onerror = () => reject(req.error);
  });
}

export async function addAttachment(incidentId, file) {
  const dataUrl = await fileToDataUrl(file);
  return addInMemoryAttachment(incidentId, {
    name: file.name || "attachment",
    type: file.type || "image/*",
    size: file.size,
    dataUrl,
  });
}

async function decryptRecord(a) {
  if (a.encrypted && a.iv != null && a.ciphertext != null) {
    if (!canEncrypt()) return { ...a, dataUrl: "" };
    try {
      const dataUrl = await decryptDataUrl(a.iv, a.ciphertext);
      return { ...a, dataUrl };
    } catch {
      return { ...a, dataUrl: "" };
    }
  }
  return a;
}

export async function getAttachments(incidentId) {
  const db = await openDB();
  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  const mine = all.filter((a) => a.incident_id === incidentId);
  return Promise.all(mine.map(decryptRecord));
}

export async function deleteAttachment(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAttachmentsForIncident(incidentId) {
  const items = await getAttachments(incidentId);
  await Promise.all(items.map((a) => deleteAttachment(a.id)));
}

// Wipe every attachment record (used during account deletion).
export async function clearAllAttachments() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Used by the wizard: persist a set of in-memory attachment objects (already
// read as data URLs) against a newly created incident id.
export async function persistInMemoryAttachments(incidentId, attachments) {
  const db = await openDB();
  const records = [];
  for (const a of attachments) {
    const enc = await encryptIfPossible(a.dataUrl);
    records.push({
      incident_id: incidentId,
      name: a.name,
      type: a.type,
      size: a.size,
      created_date: new Date().toISOString(),
      ...enc,
    });
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    records.forEach((r) => store.add(r));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Helper for the wizard: read a File into an in-memory attachment object.
// Large images are auto-downscaled to keep local storage small.
export async function readAttachmentObject(file) {
  const rawUrl = await fileToDataUrl(file);
  const dataUrl = file.type?.startsWith("image/") ? await downscaleDataUrl(rawUrl) : rawUrl;
  return {
    name: file.name || "attachment",
    type: file.type || "image/*",
    size: file.size,
    dataUrl,
  };
}

// One-time migration: encrypt legacy plaintext records using the session DEK.
export async function migrateLegacyAttachments() {
  try {
    if (localStorage.getItem(MIGRATION_FLAG) === "done") return { migrated: 0 };
  } catch {}
  if (!canEncrypt()) return { migrated: 0 };
  const db = await openDB();
  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  const legacy = all.filter((a) => !a.encrypted && a.dataUrl);
  if (!legacy.length) {
    try { localStorage.setItem(MIGRATION_FLAG, "done"); } catch {}
    return { migrated: 0 };
  }
  let migrated = 0;
  for (const rec of legacy) {
    try {
      const { iv, ciphertext } = await encryptDataUrl(rec.dataUrl);
      const updated = { ...rec, iv, ciphertext, encrypted: true, version: 1 };
      delete updated.dataUrl;
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      migrated++;
    } catch {}
  }
  try { localStorage.setItem(MIGRATION_FLAG, "done"); } catch {}
  return { migrated };
}