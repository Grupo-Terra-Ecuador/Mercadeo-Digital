export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

export type Objective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES";

export type CreativeFormat = "image" | "video" | "carousel" | "collection";

export type AudienceDimension = "age" | "gender" | "placement" | "device";

export type BudgetType = "daily" | "lifetime" | "none";

export type QualityRanking = "above_average" | "average" | "below_average" | "unknown";

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
}

export interface Brand {
  id: string;
  name: string;
  accountId: string;
  color: string;
}

export interface Campaign {
  id: string;
  accountId: string;
  brandId: string;
  name: string;
  status: CampaignStatus;
  objective: Objective;
  budgetType: BudgetType;
  /** Monto del presupuesto en la moneda de la cuenta (dólares, no centavos). 0 si budgetType es "none". */
  budgetAmount: number;
  /** Solo aplica a presupuesto de por vida ("lifetime") — lo que queda por gastar. */
  budgetRemaining?: number;
  startDate: string;
}

export interface Creative {
  id: string;
  campaignId: string;
  name: string;
  headline: string;
  format: CreativeFormat;
  swatch: string;
  thumbnailUrl?: string;
  qualityRanking?: QualityRanking;
  engagementRanking?: QualityRanking;
  conversionRanking?: QualityRanking;
}

export interface DailyInsight {
  date: string;
  campaignId: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  results: number;
  landingPageViews: number;
}

export interface CreativeDailyInsight {
  date: string;
  creativeId: string;
  campaignId: string;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
}

export interface AudienceShare {
  campaignId: string;
  dimension: AudienceDimension;
  segment: string;
  share: number;
}

export interface MetricTotals {
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  results: number;
  landingPageViews: number;
}
