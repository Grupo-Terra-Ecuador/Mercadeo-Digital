import { DATASET } from "@/lib/mock/dataset";
import type { Campaign, CampaignStatus, CreativeDailyInsight, DailyInsight, Objective } from "@/lib/types";

export interface CampaignFilters {
  accountId: string;
  brandId: string;
  objective: Objective | "all";
  status: CampaignStatus | "all";
  campaignId: string;
}

export function getFilteredCampaigns(filters: CampaignFilters): Campaign[] {
  return DATASET.campaigns.filter((c) => {
    if (filters.accountId !== "all" && c.accountId !== filters.accountId) return false;
    if (filters.brandId !== "all" && c.brandId !== filters.brandId) return false;
    if (filters.objective !== "all" && c.objective !== filters.objective) return false;
    if (filters.status !== "all" && c.status !== filters.status) return false;
    if (filters.campaignId !== "all" && c.id !== filters.campaignId) return false;
    return true;
  });
}

export function getInsightsForCampaigns(
  campaigns: Campaign[],
  dateStart: string,
  dateEnd: string
): DailyInsight[] {
  const ids = new Set(campaigns.map((c) => c.id));
  return DATASET.dailyInsights.filter(
    (row) => ids.has(row.campaignId) && row.date >= dateStart && row.date <= dateEnd
  );
}

export function getCreativeInsightsForCampaigns(
  campaigns: Campaign[],
  dateStart: string,
  dateEnd: string
): CreativeDailyInsight[] {
  const ids = new Set(campaigns.map((c) => c.id));
  return DATASET.creativeDailyInsights.filter(
    (row) => ids.has(row.campaignId) && row.date >= dateStart && row.date <= dateEnd
  );
}

export function getBrandById(id: string) {
  return DATASET.brands.find((b) => b.id === id);
}

export function getAccountById(id: string) {
  return DATASET.accounts.find((a) => a.id === id);
}
