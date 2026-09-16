import React from "react";
import { motion } from "framer-motion";

// A single large, breathing neon glow that drifts slowly across the header —
// the "guardian light". Soft, premium, and calm.

export default function PixelDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Main glowing light — large, soft, breathing */}
      <motion.div
        className="absolute"
        style={{
          left: "50%",
          top: "40%",
          width: 320,
          height: 320,
          translateX: "-50%",
          translateY: "-50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(232,121,249,0.35) 25%, rgba(167,139,250,0.25) 50%, transparent 70%)",
          filter: "blur(20px)",
        }}
        initial={{ opacity: 0.5, scale: 0.85, x: -60 }}
        animate={{
          opacity: [0.45, 0.8, 0.45],
          scale: [0.85, 1.15, 0.85],
          x: [-60, 60, -60],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary smaller glow — offset, slower */}
      <motion.div
        className="absolute"
        style={{
          left: "30%",
          top: "25%",
          width: 180,
          height: 180,
          background:
            "radial-gradient(circle, rgba(192,132,252,0.4) 0%, rgba(232,121,249,0.2) 40%, transparent 70%)",
          filter: "blur(16px)",
        }}
        initial={{ opacity: 0.3, scale: 0.9 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.9, 1.1, 0.9],
          x: [30, -30, 30],
        }}
        transition={{ duration: 10, delay: 1, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle shimmer specks for texture */}
      {[
        { left: "20%", top: "30%", size: 3, dur: 3, delay: 0.3 },
        { left: "70%", top: "20%", size: 2, dur: 3.5, delay: 0.8 },
        { left: "55%", top: "55%", size: 3, dur: 2.8, delay: 1.4 },
        { left: "82%", top: "45%", size: 2, dur: 3.2, delay: 0.6 },
        { left: "38%", top: "65%", size: 2, dur: 3.8, delay: 1.1 },
      ].map((s, i) => (
        <motion.span
          key={`speck-${i}`}
          className="absolute rounded-full bg-white"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, filter: "blur(0.5px)" }}
          initial={{ opacity: 0.2, scale: 0.6 }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.6, 1.3, 0.6] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}