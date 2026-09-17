import React from "react";
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

export default function AuthoritiesMap({ userPos, items }) {
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
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        subdomains="abcd"
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