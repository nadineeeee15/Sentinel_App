import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// A small cat that peeks over the top edge of the element it sits on (the
// Home header's buttons), blinks, flicks an ear and now and then ducks down
// and pops back up. Purely decorative; static when reduced motion is on.
export default function PeekCat({ className = "" }) {
  const reduce = useReducedMotion();
  const [ducked, setDucked] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let popTimer;
    const loop = setInterval(() => {
      setDucked(true);
      popTimer = setTimeout(() => setDucked(false), 1400);
    }, 9000);
    return () => {
      clearInterval(loop);
      clearTimeout(popTimer);
    };
  }, [reduce]);

  return (
    <div aria-hidden="true" className={"pointer-events-none overflow-hidden " + className}>
      <motion.svg
        viewBox="0 0 64 56"
        className="block h-full w-full"
        initial={reduce ? false : { y: 56 }}
        animate={{ y: ducked ? 56 : 0 }}
        transition={
          ducked
            ? { duration: 0.35, ease: "easeIn" }
            : { type: "spring", stiffness: 260, damping: 14, delay: reduce ? 0 : 0.5 }
        }
      >
        {/* Ears */}
        <motion.g
          style={{ transformBox: "fill-box", originX: 0.5, originY: 1 }}
          animate={reduce ? undefined : { rotate: [0, 0, -14, 0, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        >
          <path d="M12 26 L15 6 L28 18 Z" fill="#FFF7ED" />
          <path d="M15.5 22 L17 11 L24.5 18 Z" fill="#F9A8D4" />
        </motion.g>
        <path d="M52 26 L49 6 L36 18 Z" fill="#FFF7ED" />
        <path d="M48.5 22 L47 11 L39.5 18 Z" fill="#F9A8D4" />

        {/* Head */}
        <ellipse cx="32" cy="36" rx="22" ry="19" fill="#FFF7ED" />

        {/* Eyes */}
        <motion.g
          style={{ transformBox: "fill-box", originY: 0.5 }}
          animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }}
        >
          <ellipse cx="23.5" cy="33" rx="3" ry="3.6" fill="#2E1065" />
          <ellipse cx="40.5" cy="33" rx="3" ry="3.6" fill="#2E1065" />
          <circle cx="24.6" cy="31.6" r="1" fill="#FFFFFF" />
          <circle cx="41.6" cy="31.6" r="1" fill="#FFFFFF" />
        </motion.g>

        {/* Blush, nose, mouth */}
        <ellipse cx="17.5" cy="40" rx="3.2" ry="2" fill="#F9A8D4" opacity="0.8" />
        <ellipse cx="46.5" cy="40" rx="3.2" ry="2" fill="#F9A8D4" opacity="0.8" />
        <path d="M30.5 38.5 h3 l-1.5 1.8 z" fill="#EC4899" />
        <path
          d="M28.5 42 q1.75 1.6 3.5 0 q1.75 1.6 3.5 0"
          fill="none"
          stroke="#7C2D12"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        {/* Paws resting on the edge */}
        <ellipse cx="21" cy="54" rx="6.5" ry="4.5" fill="#FFF7ED" />
        <ellipse cx="43" cy="54" rx="6.5" ry="4.5" fill="#FFF7ED" />
        <path d="M19 52.5 v2 M23 52.5 v2" stroke="#E9D5FF" strokeWidth="1" strokeLinecap="round" />
        <path d="M41 52.5 v2 M45 52.5 v2" stroke="#E9D5FF" strokeWidth="1" strokeLinecap="round" />
      </motion.svg>
    </div>
  );
}
