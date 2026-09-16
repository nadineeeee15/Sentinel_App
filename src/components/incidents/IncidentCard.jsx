import React from "react";
import { Link } from "react-router-dom";
import { MapPin, CalendarDays, ChevronRight, FileText } from "lucide-react";
import { SeverityBadge, StatusBadge } from "./IncidentBadge";
import { CATEGORY_LABELS } from "./CategorySelect";
import { formatRelative } from "@/lib/dates";

export default function IncidentCard({ incident }) {
  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group block rounded-2xl border border-white/10 bg-white p-4 shadow-lg shadow-violet-950/40 transition-all hover:border-violet-300 hover:shadow-xl hover:shadow-violet-700/30 active:scale-[0.99]"
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
          <p className="mt-0.5 text-xs text-slate-400">
            {CATEGORY_LABELS[incident.category] || incident.category}
          </p>
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
          {incident.ai_report && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <FileText className="h-3.5 w-3.5" /> Report ready
            </p>
          )}
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
      </div>
    </Link>
  );
}