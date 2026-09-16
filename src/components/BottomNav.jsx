import React from "react";
import { NavLink } from "react-router-dom";
import { Home, FilePlus, LifeBuoy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/new", label: "Log", icon: FilePlus },
  { to: "/authorities", label: "Help", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition",
                isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}