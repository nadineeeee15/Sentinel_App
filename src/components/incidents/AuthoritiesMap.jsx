import React, { useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const KIND_COLOR = {
  police: "#dc2626",
  fire: "#ea580c",
  government: "#2563eb",
  civic: "#7c3aed",
  other: "#475569",
};

const KIND_LABEL = {
  police: "Police station",
  fire: "Fire station",
  government: "Government office",
  civic: "Civic office",
  other: "Local authority",
};

// Keyless tile providers, in order of preference. If tiles from one keep
// failing to load, the map switches to the next so it never stays blank.
const TILE_SOURCES = [
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
];
const MAX_TILE_ERRORS = 3;

export default function AuthoritiesMap({ userPos, items }) {
  const [sourceIdx, setSourceIdx] = useState(0);
  const tileErrors = useRef(0);
  const source = TILE_SOURCES[sourceIdx];

  function handleTileError() {
    tileErrors.current += 1;
    if (tileErrors.current >= MAX_TILE_ERRORS && sourceIdx < TILE_SOURCES.length - 1) {
      tileErrors.current = 0;
      setSourceIdx((i) => i + 1);
    }
  }

  const center = userPos
    ? [userPos.lat, userPos.lon]
    : items[0]
    ? [items[0].lat, items[0].lon]
    : [-36.85, 174.76];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-64 w-full rounded-2xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        key={source.url}
        url={source.url}
        attribution={source.attribution}
        maxZoom={source.maxZoom}
        eventHandlers={{ tileerror: handleTileError }}
      />
      {userPos && (
        <CircleMarker
          center={center}
          radius={9}
          pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 0.9 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
      {items.map((it) => (
        <CircleMarker
          key={it.id}
          center={[it.lat, it.lon]}
          radius={7}
          pathOptions={{
            color: KIND_COLOR[it.kind] || KIND_COLOR.other,
            fillColor: KIND_COLOR[it.kind] || KIND_COLOR.other,
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{it.name}</p>
              <p className="text-slate-500">{KIND_LABEL[it.kind] || it.kind}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}