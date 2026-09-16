import React from "react";
import { motion } from "framer-motion";

// Neon "meteor shower" — glowing stars and meteor streaks raining from the
// top of the header, with soft pulsing nebula orbs behind them.

const METEORS = [
  { left: "10%", angle: 18, dur: 2.6, delay: 0,   len: 70,  color: "167 139 250" },
  { left: "28%", angle: 14, dur: 3.2, delay: 0.8, len: 90,  color: "232 121 249" },
  { left: "44%", angle: 20, dur: 2.9, delay: 1.5, len: 60,  color: "167 139 250" },
  { left: "60%", angle: 12, dur: 3.5, delay: 0.3, len: 100, color: "232 121 249" },
  { left: "76%", angle: 22, dur: 2.4, delay: 1.1, len: 75,  color: "192 132 252" },
  { left: "90%", angle: 16, dur: 3.1, delay: 1.8, len: 85,  color: "232 121 249" },
];

const STARS = [
  { left: "15%", top: "18%", size: 3, dur: 2.5, delay: 0.2 },
  { left: "35%", top: "40%", size: 2, dur: 3,   delay: 0.7 },
  { left: "52%", top: "15%", size: 3, dur: 2.8, delay: 1.2 },
  { left: "68%", top: "35%", size: 2, dur: 3.2, delay: 0.5 },
  { left: "82%", top: "22%", size: 3, dur: 2.6, delay: 1.6 },
  { left: "24%", top: "60%", size: 2, dur: 3.4, delay: 0.9 },
  { left: "88%", top: "55%", size: 3, dur: 2.9, delay: 1.3 },
];

const ORBS = [
  { left: "20%", top: "15%", size: 130, color: "167 139 250", dur: 6, delay: 0 },
  { left: "72%", top: "20%", size: 150, color: "232 121 249", dur: 7, delay: 1 },
];

export default function PixelDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Soft pulsing nebula glow */}
      {ORBS.map((o, i) => (
        <motion.span
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            left: o.left,
            top: o.top,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, rgba(${o.color}, 0.5) 0%, rgba(${o.color}, 0.12) 45%, transparent 70%)`,
            filter: "blur(10px)",
          }}
          initial={{ opacity: 0.3, scale: 0.85 }}
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: o.dur, delay: o.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Twinkling stars */}
      {STARS.map((s, i) => (
        <motion.span
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, filter: "blur(0.5px)" }}
          initial={{ opacity: 0.2, scale: 0.6 }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.3, 0.6] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Shooting meteors from the top */}
      {METEORS.map((m, i) => (
        <motion.div
          key={`meteor-${i}`}
          className="absolute top-0"
          style={{
            left: m.left,
            width: 2,
            height: m.len,
            background: `linear-gradient(to bottom, transparent, rgba(${m.color}, 0.95), rgba(${m.color}, 0.3), transparent)`,
            boxShadow: `0 0 8px 1px rgba(${m.color}, 0.7)`,
            borderRadius: 4,
            transformOrigin: "top center",
            rotate: `${m.angle}deg`,
          }}
          initial={{ y: -m.len, opacity: 0 }}
          animate={{ y: 260, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: m.dur,
            delay: m.delay,
            repeat: Infinity,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}