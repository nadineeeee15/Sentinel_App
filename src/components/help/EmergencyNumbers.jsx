import React from "react";
import { Phone } from "lucide-react";

// Curated New Zealand government & support emergency lines.
const NUMBERS = [
  { label: "Emergency — Police, Fire, Ambulance", number: "111" },
  { label: "Police non-emergency", number: "105" },
  { label: "Victim Support", number: "0800 842 746" },
  { label: "Women's Refuge", number: "0800 733 843" },
  { label: "Netsafe — online harm", number: "0800 338 338" },
  { label: "Safe to Talk — sexual harm", number: "0800 044 334" },
];

export default function EmergencyNumbers() {
  return (
    <div className="mt-2 rounded-2xl border-2 border-primary/60 bg-white p-4">
      <ul className="divide-y divide-slate-100">
        {NUMBERS.map((n) => (
          <li key={n.number} className="flex items-center justify-between gap-3 py-2.5">
            <p className="min-w-0 text-sm font-medium text-slate-800">{n.label}</p>
            <a
              href={`tel:${n.number.replace(/\s/g, "")}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary"
            >
              <Phone className="h-3.5 w-3.5" /> {n.number}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}