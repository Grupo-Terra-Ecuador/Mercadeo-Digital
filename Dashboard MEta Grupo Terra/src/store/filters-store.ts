import { create } from "zustand";
import { ANCHOR_DATE, WINDOW_DAYS, isoDateOffset } from "@/lib/mock/dataset";
import type { CampaignStatus, Objective } from "@/lib/types";

export const DEFAULT_RANGE_END = ANCHOR_DATE;
export const DEFAULT_RANGE_START = isoDateOffset(ANCHOR_DATE, -(WINDOW_DAYS - 1));

interface FiltersState {
  dateStart: string;
  dateEnd: string;
  accountId: string;
  brandId: string;
  objective: Objective | "all";
  status: CampaignStatus | "all";
  campaignId: string;
  setDateRange: (start: string, end: string) => void;
  setAccountId: (id: string) => void;
  setBrandId: (id: string) => void;
  setObjective: (objective: Objective | "all") => void;
  setStatus: (status: CampaignStatus | "all") => void;
  setCampaignId: (id: string) => void;
  resetFilters: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  dateStart: DEFAULT_RANGE_START,
  dateEnd: DEFAULT_RANGE_END,
  accountId: "all",
  brandId: "all",
  objective: "all",
  status: "all",
  campaignId: "all",
  setDateRange: (start, end) => set({ dateStart: start, dateEnd: end }),
  setAccountId: (id) => set({ accountId: id, brandId: "all", campaignId: "all" }),
  setBrandId: (id) => set({ brandId: id, campaignId: "all" }),
  setObjective: (objective) => set({ objective, campaignId: "all" }),
  setStatus: (status) => set({ status, campaignId: "all" }),
  setCampaignId: (id) => set({ campaignId: id }),
  resetFilters: () =>
    set({
      dateStart: DEFAULT_RANGE_START,
      dateEnd: DEFAULT_RANGE_END,
      accountId: "all",
      brandId: "all",
      objective: "all",
      status: "all",
      campaignId: "all",
    }),
}));
