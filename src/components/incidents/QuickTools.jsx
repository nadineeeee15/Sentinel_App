import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, LifeBuoy, User } from "lucide-react";

const TOOLS = [
  { to: "/new", label: "New report", icon: Plus },
  { to: "/authorities", label: "Get Help", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: User },
];

export default function QuickTools() {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-violet-100">Quick tools</h2>
      <div className="grid grid-cols-3 gap-3">
        {TOOLS.map((t, i) => (
          <motion.div
            key={t.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to={t.to}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md transition hover:border-violet-400/40 hover:bg-white/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
                <t.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-violet-100">{t.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}