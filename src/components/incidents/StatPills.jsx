import React, { useMemo } from "react";
import { motion } from "framer-motion";

export default function StatPills({ incidents }) {
  const counts = useMemo(() => {
    const base = { draft: 0, completed: 0 };
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
    { label: "Draft", value: counts.draft, tone: "text-amber-600" },
    { label: "Completed", value: counts.completed, tone: "text-emerald-600" },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {pills.map((p, i) => (
        <motion.div
          key={p.label}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 260, damping: 14 }}
          whileTap={{ scale: 0.92 }}
          className="cursor-pointer rounded-xl bg-slate-100 px-2 py-2 text-center transition hover:bg-slate-200/70"
        >
          <p className={`text-lg font-semibold leading-none ${p.tone}`}>
            {incidents === null ? "–" : p.value}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {p.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}