import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

// Push/pop route transitions: the outgoing screen slides/fades out to the left
// while the incoming screen slides in from the right. initial={false} skips the
// animation on first mount so the app appears without sliding on cold load.
export default function RouteTransitions() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}