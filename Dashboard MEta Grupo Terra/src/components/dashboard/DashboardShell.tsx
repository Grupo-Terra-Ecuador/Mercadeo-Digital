import type { ReactNode } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import FilterBar from "@/components/dashboard/FilterBar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <FilterBar />
          {children}
        </main>
      </div>
    </div>
  );
}
