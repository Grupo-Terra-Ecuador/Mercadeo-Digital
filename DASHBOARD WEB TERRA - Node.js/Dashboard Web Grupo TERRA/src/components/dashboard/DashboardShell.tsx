"use client";

import { useEffect, type ReactNode } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import TooltipHost from "@/components/layout/TooltipHost";
import { initTooltip } from "@/lib/ui/tooltip";
import { initNav, scheduleActiveNavSync } from "@/lib/ui/nav";
import { initTrendToggleDelegation } from "@/lib/charts/trend-registry";

export default function DashboardShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    initTooltip();
    initTrendToggleDelegation();
    initNav();
    scheduleActiveNavSync();
  }, []);

  return (
    <div className="shell grid min-h-screen grid-cols-[230px_1fr] max-[900px]:block">
      <TopBar />
      <Sidebar />
      <main className="content min-w-0 px-[26px] pb-[60px] pt-6 max-[900px]:px-3 max-[900px]:pb-12 max-[900px]:pt-4">{children}</main>
      <TooltipHost />
    </div>
  );
}
