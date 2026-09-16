import React from "react";
import { motion } from "framer-motion";

// Neon "guardian field" — glowing orbs, a sweeping scan line, and shimmering
// sparks behind the dashboard header. Purely decorative, pointer-events none.

const ORBS = [
  { left: "12%", top: "20%", size: 120, color: "167 139 250", dur: 6, delay: 0,    drift: 30 },
  { left: "70%", top: "10%", size: 150, color: "232 121 249", dur: 7, delay: 0.8,  drift: -26 },
  { left: "45%", top: "55%", size: 100, color: "139 92 246",  dur: 5, delay: 1.4,  drift: 20 },
  { left: "85%", top: "60%", size: 90,  color: "217 70 239",   dur: 8, delay: 0.4,  drift: -18 },
];

const SPARKS = [
  { left: "18%", size: 4, color: "bg-fuchsia-300", dur: 4.5, delay: 0.2,  rise: 120 },
  { left: "34%", size: 3, color: "bg-violet-200",  dur: 5.5, delay: 1.1,  rise: 90 },
  { left: "55%", size: 5, color: "bg-fuchsia-200", dur: 6,   delay: 0.6,  rise: 140 },
  { left: "68%", size: 3, color: "bg-violet-300",  dur: 4,   delay: 1.8,  rise: 100 },
  { left: "82%", size: 4, color: "bg-fuchsia-300", dur: 5,   delay: 0.9,  rise: 130 },
  { left: "26%", size: 3, color: "bg-violet-200",  dur: 5.2, delay: 2.2,  rise: 110 },
  { left: "92%", size: 4, color: "bg-fuchsia-200", dur: 4.8, delay: 1.5,  rise: 95 },
];

export default function PixelDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Pulsing neon orbs */}
      {ORBS.map((o, i) => (
        <motion.span
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            left: o.left,
            top: o.top,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, rgba(${o.color}, 0.55) 0%, rgba(${o.color}, 0.15) 45%, transparent 70%)`,
            filter: "blur(8px)",
          }}
          initial={{ opacity: 0.35, scale: 0.8 }}
          animate={{
            opacity: [0.35, 0.7, 0.35],
            scale: [0.85, 1.1, 0.85],
            x: [0, o.drift, 0],
          }}
          transition={{
            duration: o.dur,
            delay: o.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Sweeping scan line — a thin neon beam that travels across */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          top: "50%",
          background:
            "linear-gradient(90deg, transparent, rgba(232,121,249,0.8), rgba(167,139,250,0.9), transparent)",
          boxShadow: "0 0 12px 2px rgba(167,139,250,0.6)",
        }}
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: ["-100%", "100%"], opacity: [0, 1, 0] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Shimmering rising sparks */}
      {SPARKS.map((s, i) => (
        <motion.span
          key={`spark-${i}`}
          className={`absolute bottom-0 rounded-full ${s.color}`}
          style={{ left: s.left, width: s.size, height: s.size, filter: "blur(0.5px)" }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: -s.rise,
            opacity: [0, 1, 0],
            scale: [0.6, 1.4, 0.6],
          }}
          transition={{
            duration: s.dur,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Pulsing shield ring — a faint neon halo that breathes */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fuchsia-400/30"
        style={{ width: 180, height: 180, boxShadow: "0 0 24px 4px rgba(232,121,249,0.25)" }}
        initial={{ opacity: 0.2, scale: 0.9 }}
        animate={{ opacity: [0.15, 0.4, 0.15], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}