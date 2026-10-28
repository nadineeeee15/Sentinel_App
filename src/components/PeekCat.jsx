import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// A pixel-art calico cat that peeks over the top edge of the element it sits
// on (the Home header's buttons). Traced from Nadine's reference sprite, then
// split into layers so the ears flap and the eyes blink (CSS keyframes); now
// and then it ducks down and pops back up. Purely decorative; static when
// reduced motion is on.

const COLORS = {
  K: "#231F20", // outline
  W: "#FFFFFF", // fur
  O: "#FBA63F", // calico patch
  D: "#E28825", // patch shadow
  P: "#FFBABB", // inner ear, cheeks
  B: "#78403F", // eyes, mouth
  G: "#EAEAEA", // light shading
  S: "#C1C1C1", // toes
};

// 32 x 24 grid, one character per pixel ("." = transparent).
const LEFT_EAR = [
  ".......KKK......................",
  ".......KOOKK....................",
  "......KOOOOOK...................",
  "......KOPPPOOK..................",
  ".....KOOPPPPOOK.................",
  ".....KOOPPPPPOO.................",
];

// Drawn over the head's own top-right corner, so twitching it never leaves a gap.
const RIGHT_EAR = [
  ".........................KKKKK..",
  ".........................WWWWWKK",
  ".........................WPPPWWK",
  ".........................WWPPPWK",
  ".........................WWPPWWK",
  ".........................WWWPWK.",
];

const HEAD = [
  "................................",
  "................................",
  "................................",
  "................................",
  ".....KOOPPPPOOKKKKK.............",
  ".....KOOPPPPPOOOOWWKKK..........",
  ".....KOPPPPOOOOOOWWWWWKK........",
  ".....KOPPOOOOOOOOWWWWWWWKKKKKK..",
  ".....KOOOOOOOOOOWWWWWWWWGWWWWWKK",
  ".....KOOOOOOOOOWWWWWWWWWWWPPPWWK",
  "....KDOOOWWWWWWWWWWWWWWWWWWPPPWK",
  "....KGWWWWWWWWWWWWWWWWWWWWWPPWWK",
  "...KWWWWWWWWWWWWWWWWWWWWWWWWPWK.",
  "...KWWWWWWWWWWWWWWWWWWWWWWWWWWK.",
  "...KWWWWWWWWWWWWWWWWWWWWWWWWGK..",
  "...KWWWPPPWWWWWWWBBWWWWWWWWWGK..",
  "...KWWWPPPWWWWWWWWWWWWWWWWWWK...",
  "...KWWWPPPWWWWBWWBWWWWWWWWWWK...",
  "...KGGGGGWWWWWWBBWBBWWWWPPPWK...",
  "....KSSSSGWWWWWWWWWWWWWPSSSWK...",
  "....KWWWWSGWWWWWWWWWWWGSWWWK....",
  "...KWWWWWWSGWGGGGGWWWGSWWWWWK...",
  "...KWWSWSWSGGGGGGGGGGGSWSWSGK...",
  "KKKKKSGSGKKKKKKKKKKKKKKGGSGSKKKK",
];

const LEFT_EYE = ["WBBBW", "BWBBB", "BBBBB", "BBBBB", "WBBBW"]; // at x 10, y 11
const RIGHT_EYE = ["WBBBW", "BWBBB", "BBBBB", "BBBBB", "WBBBW"]; // at x 21, y 13

// Turn a grid into one <rect> per horizontal run of the same colour.
function Pixels({ rows, x0 = 0, y0 = 0 }) {
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x;
      while (end < row.length && row[end] === c) end++;
      if (c !== ".") {
        rects.push(
          <rect key={`${x}-${y}`} x={x0 + x} y={y0 + y} width={end - x} height={1} fill={COLORS[c]} />
        );
      }
      x = end;
    }
  });
  return rects;
}

const CSS = `
  @keyframes peekcat-ear-l { 0%, 70%, 100% { transform: rotate(0deg); } 77%, 91% { transform: rotate(-22deg); } 84% { transform: rotate(0deg); } }
  @keyframes peekcat-ear-r { 0%, 70%, 100% { transform: rotate(0deg); } 77%, 91% { transform: rotate(12deg); } 84% { transform: rotate(0deg); } }
  @keyframes peekcat-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.15); } }
  .peekcat-ear-l { transform-origin: 10px 5.5px; animation: peekcat-ear-l 3.5s ease-in-out infinite; }
  .peekcat-ear-r { transform-origin: 25px 12px; animation: peekcat-ear-r 3.5s ease-in-out infinite; }
  .peekcat-eye-l { transform-origin: 12.5px 13.5px; animation: peekcat-blink 4s linear infinite; }
  .peekcat-eye-r { transform-origin: 23.5px 15.5px; animation: peekcat-blink 4s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .peekcat-ear-l, .peekcat-ear-r, .peekcat-eye-l, .peekcat-eye-r { animation: none; }
  }
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
        viewBox="0 -1 32 25"
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
        {/* Left ear sits behind the head so its base stays hidden while flapping */}
        <g className="peekcat-ear-l"><Pixels rows={LEFT_EAR} /></g>
        <Pixels rows={HEAD} />
        <g className="peekcat-ear-r"><Pixels rows={RIGHT_EAR} y0={7} /></g>
        <g className="peekcat-eye-l"><Pixels rows={LEFT_EYE} x0={10} y0={11} /></g>
        <g className="peekcat-eye-r"><Pixels rows={RIGHT_EYE} x0={21} y0={13} /></g>
      </motion.svg>
    </div>
  );
}
