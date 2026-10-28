import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// A pixel-art calico cat that peeks over the top edge of the element it sits
// on (the Home header's buttons). Ears flap and eyes blink via CSS keyframes;
// now and then it ducks down and pops back up. Purely decorative; static when
// reduced motion is on.

const COLORS = {
  K: "#2B1B3D", // outline
  W: "#FFFFFF", // fur
  O: "#F6A04D", // calico patch
  P: "#F7A8B8", // inner ear
  B: "#6B3A2E", // eyes
  H: "#FFFFFF", // eye shine
  R: "#F59AA9", // cheeks
  G: "#C9C3D6", // toe lines
};

// 28 x 20 grid, one character per pixel ("." = transparent).
const LEFT_EAR = [
  "......KK....................",
  ".....KOOK...................",
  "....KOOOOK..................",
  "....KOPPOOK.................",
  "...KOPPPOOOK................",
  "...KOOPPOOOOK...............",
  "...KOOOOOOOOOK..............",
  "...KOOOOOOOOOOK.............",
];

const RIGHT_EAR = [
  "....................KK......",
  "...................KWWK.....",
  "..................KWWWWK....",
  ".................KWWPPWK....",
  "................KWWWPPPWK...",
  "...............KWWWWPPWWK...",
  "..............KWWWWWWWWWK...",
  ".............KWWWWWWWWWWK...",
];

const HEAD = [
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "....KKKKKKKKKKKKKKKKKKKK....",
  "...KOOOOOWWWWWWWWWWWWWWWK...",
  "..KOOOOWWWWWWWWWWWWWWWWWWK..",
  ".KWWWWWWWWWWWWWWWWWWWWWWWWK.",
  ".KWWWWWWWWWWWWWWWWWWWWWWWWK.",
  ".KWWWWWWWWWWWWWWWWWWWWWWWWK.",
  ".KWWWWWWWWWKWWWWKWWWWWWWWWK.",
  ".KWWRRWWWWWWKKKKWWWWWWRRWWK.",
  ".KWWWWWWWWWWWWWWWWWWWWWWWWK.",
  ".KWWWWWWWWWWWWWWWWWWWWWWWWK.",
  ".KWWWWWWWWWWWWWWWWWWWWWWWWK.",
  ".KWWKKKKKKWWWWWWWWKKKKKKWWK.",
  ".KWKWWWWWWKWWWWWWKWWWWWWKWK.",
  ".KWKWGWWGWKWWWWWWKWGWWGWKWK.",
];

const EYES = [
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "......HBB..........HBB......",
  "......BBB..........BBB......",
  "......BBB..........BBB......",
];

// Turn a grid into one <rect> per horizontal run of the same colour.
function Pixels({ rows }) {
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x;
      while (end < row.length && row[end] === c) end++;
      if (c !== ".") {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={COLORS[c]} />);
      }
      x = end;
    }
  });
  return rects;
}

const CSS = `
  @keyframes peekcat-ear-l { 0%, 70%, 100% { transform: rotate(0deg); } 77%, 91% { transform: rotate(-20deg); } 84% { transform: rotate(0deg); } }
  @keyframes peekcat-ear-r { 0%, 70%, 100% { transform: rotate(0deg); } 77%, 91% { transform: rotate(20deg); } 84% { transform: rotate(0deg); } }
  @keyframes peekcat-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.15); } }
  .peekcat-ear-l { transform-origin: 8px 7px; animation: peekcat-ear-l 3.5s ease-in-out infinite; }
  .peekcat-ear-r { transform-origin: 20px 7px; animation: peekcat-ear-r 3.5s ease-in-out infinite; }
  .peekcat-eyes { transform-origin: 14px 11.5px; animation: peekcat-blink 4s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .peekcat-ear-l, .peekcat-ear-r, .peekcat-eyes { animation: none; } }
`;

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
        viewBox="0 -2 28 22"
        shapeRendering="crispEdges"
        className="block h-full w-full"
        initial={reduce ? false : { y: "100%" }}
        animate={{ y: ducked ? "100%" : "0%" }}
        transition={
          ducked
            ? { duration: 0.35, ease: "easeIn" }
            : { type: "spring", stiffness: 260, damping: 14, delay: reduce ? 0 : 0.5 }
        }
      >
        <style>{CSS}</style>
        {/* Ears sit behind the head so their bases stay hidden while flapping */}
        <g className="peekcat-ear-l"><Pixels rows={LEFT_EAR} /></g>
        <g className="peekcat-ear-r"><Pixels rows={RIGHT_EAR} /></g>
        <Pixels rows={HEAD} />
        <g className="peekcat-eyes"><Pixels rows={EYES} /></g>
      </motion.svg>
    </div>
  );
}
