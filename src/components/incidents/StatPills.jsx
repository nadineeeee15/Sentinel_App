import React, { useMemo } from "react";

export default function StatPills({ incidents }) {
  const counts = useMemo(() => {
    const base = { reported: 0, in_review: 0, escalated: 0, resolved: 0, closed: 0 };
    if (!incidents) return { ...base, total: 0 };
    return incidents.reduce(
      (acc, i) => {
        acc.total += 1;
        if (acc[i.status] != null) acc[i.status] += 1;
        return acc;
      },
      { ...base, total: incidents.length }
    );
  }, [incidents]);

  const pills = [
    { label: "Reported", value: counts.reported, tone: "text-rose-600" },
    { label: "In review", value: counts.in_review, tone: "text-blue-600" },
    { label: "Resolved", value: counts.resolved, tone: "text-emerald-600" },
    { label: "Closed", value: counts.closed, tone: "text-slate-500" },
  ];

  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {pills.map((p) => (
        <div key={p.label} className="rounded-xl bg-slate-100 px-2 py-2 text-center">
          <p className={`text-lg font-semibold leading-none ${p.tone}`}>
            {incidents === null ? "–" : p.value}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {p.label}
          </p>
        </div>
      ))}
    </div>
  );
}