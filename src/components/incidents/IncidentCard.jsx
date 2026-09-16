import React from "react";
import { Link } from "react-router-dom";
import { MapPin, CalendarDays, ChevronRight } from "lucide-react";
import { SeverityBadge, StatusBadge } from "./IncidentBadge";
import { Image } from "@/components/ui/image";
import { formatRelative } from "@/lib/dates";

export default function IncidentCard({ incident }) {
  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <h3 className="mt-2 truncate text-[15px] font-semibold text-slate-900">
            {incident.title}
          </h3>
          {incident.location && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {incident.location}
            </p>
          )}
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatRelative(incident.incident_date)}
          </p>
        </div>
        {incident.photo_url ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={incident.photo_url}
              alt={incident.title}
              className="h-full w-full object-cover"
              fittingType="fill"
            />
          </div>
        ) : (
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
        )}
      </div>
    </Link>
  );
}