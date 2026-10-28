import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, FilePlus, LifeBuoy, User, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/reports", label: "Reports", icon: FolderOpen },
  { to: "/new", label: "Log", icon: FilePlus },
  { to: "/authorities", label: "Help", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 select-none border-t border-border bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => {
              // Tapping a tab (including the active one) returns to its root.
              navigate(to);
              window.scrollTo(0, 0);
            }}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 text-sm font-medium transition",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
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