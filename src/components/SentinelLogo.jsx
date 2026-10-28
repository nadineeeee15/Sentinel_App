import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image } from "@/components/ui/image";

const LOGO_URL = "https://media.base44.com/images/public/6aa9facc831bca800f220eb4/c5079543f_Untitleddesign.png";

export default function SentinelLogo({ size = "h-28 w-28", animate = true }) {
  const [bursts, setBursts] = useState([]);

  function handleTap() {
    const id = Date.now();
    setBursts((b) => [...b, id]);
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 1400);
  }

  if (!animate) {
    return (
      <Image
        src={LOGO_URL}
        alt="Sentinel logo: a knight guarding a padlock"
        fittingType="fit"
        className={`${size} rounded-3xl shadow-lg shadow-violet-500/20`}
      />
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Continuous protective aura rings */}
      <motion.span
        aria-hidden
        className="absolute h-full w-full rounded-full bg-violet-400/30 blur-[2px]"
        initial={{ scale: 0.85, opacity: 0.5 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
      />
      <motion.span
        aria-hidden
        className="absolute h-full w-full rounded-full bg-violet-300/25 blur-[2px]"
        initial={{ scale: 0.85, opacity: 0.4 }}
        animate={{ scale: 2.3, opacity: 0 }}
        transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6, delay: 0.45 }}
      />

      {/* Tap-triggered aura bursts */}
      <AnimatePresence>
        {bursts.map((id) => (
          <motion.span
            key={id}
            aria-hidden
            className="absolute h-full w-full rounded-full border-2 border-violet-400/60"
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 2.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Logo — pop-in, float, and interactive tap/hover */}
      <motion.button
        type="button"
        onClick={handleTap}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 12, delay: 0.15 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        className="relative z-10 cursor-pointer rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        aria-label="Sentinel logo: a knight guarding a padlock"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={LOGO_URL}
            alt=""
            fittingType="fit"
            className={`${size} rounded-3xl shadow-lg shadow-violet-500/30`}
          />
        </motion.div>
      </motion.button>
    </div>
  );
}