// Find nearby local authorities (police stations, government offices) using
// the OpenStreetMap Overpass API. No API key required.

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
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

function buildQuery(lat, lon, radiusMeters) {
  return `[out:json][timeout:25];
(
  node["amenity"="police"](around:${radiusMeters},${lat},${lon});
  way["amenity"="police"](around:${radiusMeters},${lat},${lon});
  node["office"="government"](around:${radiusMeters},${lat},${lon});
  way["office"="government"](around:${radiusMeters},${lat},${lon});
  node["amenity"="townhall"](around:${radiusMeters},${lat},${lon});
  way["amenity"="townhall"](around:${radiusMeters},${lat},${lon});
);
out center 30;`;
}

function labelFor(element) {
  const tags = element.tags || {};
  if (tags.name) return tags.name;
  if (element.tags && element.tags.amenity === "police") return "Police Station";
  if (element.tags && element.tags.office === "government") return "Government Office";
  if (element.tags && element.tags.amenity === "townhall") return "Town Hall / Civic Office";
  return "Local Authority";
}

function kindFor(element) {
  const t = element.tags || {};
  if (t.amenity === "police") return "police";
  if (t.office === "government") return "government";
  if (t.amenity === "townhall") return "civic";
  return "other";
}

export async function getNearbyAuthorities(lat, lon, radiusMeters = 12000) {
  const query = buildQuery(lat, lon, radiusMeters);
  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) {
        lastError = new Error(`Overpass returned ${res.status}`);
        continue;
      }
      const json = await res.json();
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
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Could not reach the map service.");
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
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}