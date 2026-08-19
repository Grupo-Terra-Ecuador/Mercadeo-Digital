"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFiltersStore } from "@/store/filters-store";
import { previousPeriod } from "@/lib/metrics";
import { DATASET } from "@/lib/mock/dataset";
import type { AdAccount, AudienceShare, Brand, Campaign, Creative, CreativeDailyInsight, DailyInsight } from "@/lib/types";
import type { DashboardDataResponse } from "@/app/api/meta/dashboard-data/route";

export interface DashboardDataState {
  accounts: AdAccount[];
  brands: Brand[];
  campaigns: Campaign[];
  dailyInsights: DailyInsight[];
  creatives: Creative[];
  creativeDailyInsights: CreativeDailyInsight[];
  audienceShares: AudienceShare[];
  isMock: boolean;
  loading: boolean;
  error: string | null;
}

const MOCK_STATE: DashboardDataState = {
  accounts: DATASET.accounts,
  brands: DATASET.brands,
  campaigns: DATASET.campaigns,
  dailyInsights: DATASET.dailyInsights,
  creatives: DATASET.creatives,
  creativeDailyInsights: DATASET.creativeDailyInsights,
  audienceShares: DATASET.audienceShares,
  isMock: true,
  loading: false,
  error: null,
};

const DashboardDataContext = createContext<DashboardDataState>(MOCK_STATE);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const dateStart = useFiltersStore((s) => s.dateStart);
  const dateEnd = useFiltersStore((s) => s.dateEnd);
  const [state, setState] = useState<DashboardDataState>(MOCK_STATE);

  const fetchRange = useMemo(() => {
    const prev = previousPeriod(dateStart, dateEnd);
    return { since: prev.start, until: dateEnd };
  }, [dateStart, dateEnd]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch(`/api/meta/dashboard-data?since=${fetchRange.since}&until=${fetchRange.until}`);
        const json: DashboardDataResponse = await res.json();
        if (cancelled) return;

        if (!json.connected) {
          setState({ ...MOCK_STATE });
          return;
        }

        setState({
          accounts: json.accounts,
          brands: json.brands,
          campaigns: json.campaigns,
          dailyInsights: json.dailyInsights,
          creatives: json.creatives,
          creativeDailyInsights: json.creativeDailyInsights,
          audienceShares: json.audienceShares,
          isMock: false,
          loading: false,
          error: json.error ?? null,
        });
      } catch {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: "No se pudo conectar con el servidor del dashboard." }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchRange]);

  return <DashboardDataContext.Provider value={state}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData(): DashboardDataState {
  return useContext(DashboardDataContext);
}
