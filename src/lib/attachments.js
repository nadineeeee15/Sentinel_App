// Local-only attachment storage using IndexedDB.
// Attachments (e.g. sensitive screenshots/photos) never leave the device.
// They are keyed by the incident id so they stay linked to a report without
// being uploaded to the server.

const DB_NAME = "cybersec-attachments";
const STORE = "attachments";
const VERSION = 1;

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

export async function addInMemoryAttachment(incidentId, att) {
  const db = await openDB();
  const record = {
    incident_id: incidentId,
    name: att.name || "attachment",
    type: att.type || "image/*",
    size: att.size || 0,
    dataUrl: att.dataUrl,
    created_date: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(record);
    req.onsuccess = () => resolve({ ...record, id: req.result });
    req.onerror = () => reject(req.error);
  });
}

export async function addAttachment(incidentId, file) {
  const dataUrl = await fileToDataUrl(file);
  const record = {
    incident_id: incidentId,
    name: file.name || "attachment",
    type: file.type || "image/*",
    size: file.size,
    dataUrl,
    created_date: new Date().toISOString(),
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(record);
    req.onsuccess = () => resolve({ ...record, id: req.result });
    req.onerror = () => reject(req.error);
  });
}

export async function getAttachments(incidentId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      resolve(all.filter((a) => a.incident_id === incidentId));
    };
    req.onerror = () => reject(req.error);
  });
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

// Used by the wizard: persist a set of in-memory attachment objects (already
// read as data URLs) against a newly created incident id.
export async function persistInMemoryAttachments(incidentId, attachments) {
  const db = await openDB();
  const records = attachments.map((a) => ({
    incident_id: incidentId,
    name: a.name,
    type: a.type,
    size: a.size,
    dataUrl: a.dataUrl,
    created_date: new Date().toISOString(),
  }));
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    records.forEach((r) => store.add(r));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Helper for the wizard: read a File into an in-memory attachment object.
export async function readAttachmentObject(file) {
  const dataUrl = await fileToDataUrl(file);
  return {
    name: file.name || "attachment",
    type: file.type || "image/*",
    size: file.size,
    dataUrl,
  };
}