import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

export default function AppLayout() {
  return (
    <>
      {/* The bottom nav grows by the iOS home-indicator inset, so pad by the
          same amount (plus a little room) or the end of each page hides behind it. */}
      <div
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
        }}
      >
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}