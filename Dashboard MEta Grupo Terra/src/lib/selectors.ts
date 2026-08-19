import type {
  AdAccount,
  Brand,
  Campaign,
  CampaignStatus,
  CreativeDailyInsight,
  DailyInsight,
  Objective,
} from "@/lib/types";

export interface CampaignFilters {
  accountId: string;
  brandId: string;
  objective: Objective | "all";
  status: CampaignStatus | "all";
  campaignId: string;
}

export function getFilteredCampaigns(campaigns: Campaign[], filters: CampaignFilters): Campaign[] {
  return campaigns.filter((c) => {
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
  dailyInsights: DailyInsight[],
  dateStart: string,
  dateEnd: string
): DailyInsight[] {
  const ids = new Set(campaigns.map((c) => c.id));
  return dailyInsights.filter((row) => ids.has(row.campaignId) && row.date >= dateStart && row.date <= dateEnd);
}

export function getCreativeInsightsForCampaigns(
  campaigns: Campaign[],
  creativeDailyInsights: CreativeDailyInsight[],
  dateStart: string,
  dateEnd: string
): CreativeDailyInsight[] {
  const ids = new Set(campaigns.map((c) => c.id));
  return creativeDailyInsights.filter(
    (row) => ids.has(row.campaignId) && row.date >= dateStart && row.date <= dateEnd
  );
}

export function getBrandById(brands: Brand[], id: string) {
  return brands.find((b) => b.id === id);
}

export function getAccountById(accounts: AdAccount[], id: string) {
  return accounts.find((a) => a.id === id);
}
