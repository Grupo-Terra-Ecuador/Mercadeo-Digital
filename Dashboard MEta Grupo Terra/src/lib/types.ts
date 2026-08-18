export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

export type Objective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES";

export type CreativeFormat = "image" | "video" | "carousel" | "collection";

export type AudienceDimension = "age" | "gender" | "placement" | "device";

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
  dailyBudget: number;
  startDate: string;
}

export interface Creative {
  id: string;
  campaignId: string;
  name: string;
  headline: string;
  format: CreativeFormat;
  swatch: string;
}

export interface DailyInsight {
  date: string;
  campaignId: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  results: number;
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
}
