import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

// Animated circular "safety readiness" ring. Readiness = share of incidents
// that are completed (resolved). When there are no incidents, you're fully
// covered — tools are ready.

export default function SafetyOverview({ incidents }) {
  const pct = useMemo(() => {
    if (!incidents || incidents.length === 0) return 100;
    const completed = incidents.filter((i) => i.status === "completed").length;
    return Math.round((completed / incidents.length) * 100);
  }, [incidents]);

  const R = 34;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileTap={{ scale: 0.98 }}
      className="relative mt-4 flex items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <div className="relative">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" /> You're covered
        </div>
        <h3 className="text-base font-semibold text-white">Safety readiness</h3>
        <p className="mt-1 max-w-[11rem] text-xs text-violet-200/70">
          Your safety tools are ready when you need them.
        </p>
      </div>

      <div className="relative h-20 w-20 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            stroke="#a594fd"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 4px rgba(165,148,253,0.6))" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={pct}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
            className="text-lg font-semibold text-white"
          >
            {pct}%
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}