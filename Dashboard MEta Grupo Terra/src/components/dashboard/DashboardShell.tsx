import type { ReactNode } from "react";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import FilterBar from "@/components/dashboard/FilterBar";
import { isOAuthConfigured } from "@/lib/meta/config";
import { getActiveAccessTokens } from "@/lib/meta/session";
import { DashboardDataProvider } from "@/store/dashboard-data-context";
import type { MetaConnectionStatus } from "@/components/layout/TopBar";

async function resolveConnectionStatus(): Promise<MetaConnectionStatus> {
  const active = await getActiveAccessTokens();
  if (active.length > 0) return "connected";
  return isOAuthConfigured() ? "disconnected" : "not_configured";
}

export default async function DashboardShell({ children }: { children: ReactNode }) {
  const connectionStatus = await resolveConnectionStatus();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar connectionStatus={connectionStatus} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <DashboardDataProvider>
            <FilterBar />
            {children}
          </DashboardDataProvider>
        </main>
      </div>
    </div>
  );
}
