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
    { label: "Draft", value: counts.draft, tone: "text-amber-700 dark:text-amber-400" },
    { label: "Completed", value: counts.completed, tone: "text-emerald-700 dark:text-emerald-400" },
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
          className="cursor-pointer rounded-xl border border-border bg-card px-2 py-2 text-center backdrop-blur transition hover:bg-accent dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <p className={`text-lg font-semibold leading-none ${p.tone}`}>
            {incidents === null ? "–" : p.value}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground dark:text-violet-300/70">
            {p.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}