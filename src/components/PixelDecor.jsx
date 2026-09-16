import React from "react";
import { motion } from "framer-motion";

// Floating pixel-art particles — a subtle "digital guardian" field behind the header.
const PARTICLES = [
  { left: "8%", size: 10, color: "bg-violet-300/50", dur: 7, delay: 0, drift: 18 },
  { left: "22%", size: 6, color: "bg-amber-300/40", dur: 9, delay: 1.2, drift: 22 },
  { left: "38%", size: 12, color: "bg-violet-200/40", dur: 8, delay: 0.6, drift: 14 },
  { left: "52%", size: 7, color: "bg-fuchsia-300/30", dur: 10, delay: 2, drift: 26 },
  { left: "68%", size: 9, color: "bg-violet-300/45", dur: 7.5, delay: 0.3, drift: 20 },
  { left: "82%", size: 6, color: "bg-amber-200/40", dur: 9.5, delay: 1.6, drift: 16 },
  { left: "92%", size: 11, color: "bg-violet-200/35", dur: 8.5, delay: 0.9, drift: 24 },
  { left: "46%", size: 5, color: "bg-white/40", dur: 11, delay: 2.4, drift: 30 },
];

export default function PixelDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute bottom-0 ${p.color}`}
          style={{ left: p.left, width: p.size, height: p.size }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -260, x: [0, p.drift, -p.drift, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}