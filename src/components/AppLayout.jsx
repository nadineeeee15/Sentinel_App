import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

export default function AppLayout() {
  return (
    <>
      <div style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}