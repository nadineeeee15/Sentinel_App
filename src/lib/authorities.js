// Find nearby local authorities using the OpenStreetMap Overpass API.
// No API key required. Supports category filtering (police, fire, government, civic).

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// OSM tag groups per category. "government" covers government offices & town
// halls — these are where cybercrime / digital-evidence units are typically housed.
const CATEGORY_QUERIES = {
  all: [["amenity", "police"], ["amenity", "fire_station"], ["office", "government"], ["amenity", "townhall"]],
  police: [["amenity", "police"]],
  fire: [["amenity", "fire_station"]],
  government: [["office", "government"], ["amenity", "townhall"]],
  civic: [["amenity", "townhall"]],
};

export const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "police", label: "Police" },
  { value: "fire", label: "Fire station" },
  { value: "government", label: "Gov / Cyber unit" },
  { value: "civic", label: "Civic" },
];

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function buildQuery(lat, lon, radiusMeters, category) {
  const filters = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;
  const lines = filters
    .flatMap(([k, v]) => [
      `node["${k}"="${v}"](around:${radiusMeters},${lat},${lon});`,
      `way["${k}"="${v}"](around:${radiusMeters},${lat},${lon});`,
    ])
    .join("\n  ");
  return `[out:json][timeout:20];
(
  ${lines}
);
out center 30;`;
}

function fetchWithTimeout(url, opts, ms = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

function mapElements(json, lat, lon) {
  const items = (json.elements || []).map((el) => {
    const elat = el.lat ?? el.center?.lat;
    const elon = el.lon ?? el.center?.lon;
    return {
      id: `${el.type}/${el.id}`,
      name: labelFor(el),
      kind: kindFor(el),
      lat: elat,
      lon: elon,
      distance: elat != null && elon != null ? haversineMeters(lat, lon, elat, elon) : null,
      phone: el.tags?.["phone"] || el.tags?.["contact:phone"] || null,
      website: el.tags?.["website"] || el.tags?.["contact:website"] || null,
    };
  });
  return items
    .filter((i) => i.distance != null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 25);
}

async function attemptEndpoint(endpoint, query, lat, lon) {
  const res = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`${endpoint} returned ${res.status}`);
  const json = await res.json();
  return mapElements(json, lat, lon);
}

function labelFor(element) {
  const tags = element.tags || {};
  if (tags.name) return tags.name;
  if (tags.amenity === "police") return "Police Station";
  if (tags.amenity === "fire_station") return "Fire Station";
  if (tags.office === "government") return "Government Office";
  if (tags.amenity === "townhall") return "Town Hall / Civic Office";
  return "Local Authority";
}

function kindFor(element) {
  const t = element.tags || {};
  if (t.amenity === "police") return "police";
  if (t.amenity === "fire_station") return "fire";
  if (t.office === "government") return "government";
  if (t.amenity === "townhall") return "civic";
  return "other";
}

export async function getNearbyAuthorities(lat, lon, { radiusMeters = 10000, category = "all" } = {}) {
  const query = buildQuery(lat, lon, radiusMeters, category);
  // Race all mirrors in parallel — first successful response wins, so a slow
  // or rate-limited endpoint never blocks the result.
  const attempts = OVERPASS_ENDPOINTS.map((ep) => attemptEndpoint(ep, query, lat, lon));
  try {
    return await Promise.any(attempts);
  } catch (e) {
    throw new Error("Could not reach the map service. Try again in a moment.");
  }
}

function kindFromType(cls, type) {
  if (cls === "amenity" && type === "police") return "police";
  if (cls === "amenity" && type === "fire_station") return "fire";
  if (cls === "amenity" && type === "townhall") return "civic";
  if (cls === "office" && type === "government") return "government";
  return "other";
}

// Text-based search via Nominatim (OpenStreetMap). No GPS required — the user
// types a department name / place, and we return matching places with their
// phone and website (from OSM extratags) so the website link can open externally.
export async function searchAuthorities(query) {
  const q = query.trim();
  if (!q) return [];
  const url =
    "https://nominatim.openstreetmap.org/search?q=" +
    encodeURIComponent(q) +
    "&format=json&extratags=1&addressdetails=1&limit=12";
  const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 12000);
  if (!res.ok) throw new Error("Could not reach the map service. Try again in a moment.");
  const json = await res.json();
  return (json || []).map((r) => {
    const tags = r.extratags || {};
    return {
      id: `${r.osm_type}/${r.osm_id}`,
      name: (r.display_name || "Result").split(",")[0],
      fullName: r.display_name || "",
      kind: kindFromType(r.class, r.type),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      phone: tags.phone || tags["contact:phone"] || null,
      website: tags.website || tags["contact:website"] || null,
    };
  });
}

export function formatDistance(m) {
  if (m == null) return "";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Could not get your location.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}