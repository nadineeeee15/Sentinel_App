import React from "react";
import { Link } from "react-router-dom";
import { MapPin, CalendarDays, ChevronRight, FileText, Hash, Lock } from "lucide-react";
import { SeverityBadge, StatusBadge } from "./IncidentBadge";
import { CATEGORY_LABELS } from "./CategorySelect";
import { formatRelative } from "@/lib/dates";

export default function IncidentCard({ incident }) {
  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99] dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-white/20 dark:hover:shadow-none dark:backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {incident.report_number && (
            <p className="mb-1.5 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-violet-300/70">
              <Hash className="h-3 w-3" /> {incident.report_number}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <h3 className="mt-2 truncate text-[15px] font-semibold text-slate-900 dark:text-white">
            {incident._locked ? (
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-violet-200/70">
                <Lock className="h-3.5 w-3.5" /> Locked report
              </span>
            ) : (
              incident.title
            )}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-violet-200/70">
            {CATEGORY_LABELS[incident.category] || incident.category}
          </p>
          {!incident._locked && incident.location && (
            <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500 dark:text-violet-200/70">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {incident.location}
            </p>
          )}
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-violet-200/60">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatRelative(incident.incident_date)}
          </p>
          {incident.ai_report && (
            <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <FileText className="h-3.5 w-3.5" /> Report ready
            </p>
          )}
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-violet-300/40 dark:group-hover:text-violet-200" />
      </div>
    </Link>
  );
}