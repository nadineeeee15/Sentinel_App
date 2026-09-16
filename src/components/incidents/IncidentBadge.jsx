import React from "react";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  medium: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  high: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30",
  critical: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
};

const STATUS_STYLES = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
};

export function SeverityBadge({ severity, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.medium,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {severity}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const label = (status || "draft").replace("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
        className
      )}
    >
      {label}
    </span>
  );
}