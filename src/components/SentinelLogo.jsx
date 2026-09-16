import React from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

const LOGO_URL = "https://media.base44.com/images/public/6aa9facc831bca800f220eb4/d81d6de40_CanvaAIImageSep172026at12_16_00AM.jpeg";

export default function SentinelLogo({ size = "h-28 w-28", animate = true }) {
  if (!animate) {
    return (
      <Image
        src={LOGO_URL}
        fittingType="fit"
        className={`${size} rounded-3xl shadow-lg shadow-violet-500/20`}
      />
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Protective aura rings — echo the shield emanating safety */}
      <motion.span
        aria-hidden
        className="absolute h-full w-full rounded-3xl bg-violet-400/30"
        initial={{ scale: 0.85, opacity: 0.5 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
      />
      <motion.span
        aria-hidden
        className="absolute h-full w-full rounded-3xl bg-violet-300/25"
        initial={{ scale: 0.85, opacity: 0.4 }}
        animate={{ scale: 2.3, opacity: 0 }}
        transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6, delay: 0.45 }}
      />
      {/* Logo pop-in */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 12, delay: 0.15 }}
        className="relative z-10"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={LOGO_URL}
            fittingType="fit"
            className={`${size} rounded-3xl shadow-lg shadow-violet-500/30`}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}