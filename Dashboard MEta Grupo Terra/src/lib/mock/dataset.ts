import type {
  AdAccount,
  AudienceDimension,
  AudienceShare,
  Brand,
  BudgetType,
  Campaign,
  CampaignStatus,
  Creative,
  CreativeDailyInsight,
  CreativeFormat,
  DailyInsight,
  Objective,
  QualityRanking,
} from "@/lib/types";
import { createRng, pick, rangeFloat, rangeInt, shuffle } from "./random";

/**
 * Fecha de referencia del set de datos simulado (los últimos 30 días se
 * calculan a partir de aquí). Al conectar la API real de Meta, este módulo
 * completo se reemplaza por llamadas a lib/meta/api-provider.
 */
export const ANCHOR_DATE = "2026-08-18";
export const WINDOW_DAYS = 30;

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  OUTCOME_AWARENESS: "Reconocimiento de marca",
  OUTCOME_TRAFFIC: "Tráfico",
  OUTCOME_ENGAGEMENT: "Interacción",
  OUTCOME_LEADS: "Clientes potenciales",
  OUTCOME_SALES: "Ventas",
};

export const RESULT_LABELS: Record<Objective, string> = {
  OUTCOME_AWARENESS: "Reproducciones de video",
  OUTCOME_TRAFFIC: "Clics en el enlace",
  OUTCOME_ENGAGEMENT: "Interacciones",
  OUTCOME_LEADS: "Clientes potenciales",
  OUTCOME_SALES: "Compras",
};

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  ARCHIVED: "Archivada",
};

export const AGE_SEGMENTS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export const GENDER_SEGMENTS = ["Mujeres", "Hombres", "Desconocido"] as const;
export const DEVICE_SEGMENTS = ["Móvil", "Computadora", "Tablet"] as const;
export const PLACEMENT_SEGMENTS = ["Feed", "Reels", "Historias", "Marketplace", "Audience Network"] as const;

const ACCOUNTS: AdAccount[] = [
  { id: "act_10234501", name: "AGROTA Ecuador", currency: "USD" },
  { id: "act_20345612", name: "AGROTA Colombia", currency: "USD" },
  { id: "act_30456723", name: "AGROTA Perú", currency: "USD" },
];

const BRAND_SEED: Array<{ id: string; name: string; accountId: string; color: string }> = [
  { id: "brand_agrosemillas", name: "AgroSemillas Premium", accountId: "act_10234501", color: "#4c8cff" },
  { id: "brand_nutricampo", name: "NutriCampo Fertilizantes", accountId: "act_10234501", color: "#22c55e" },
  { id: "brand_fertimax", name: "FertiMax Foliar", accountId: "act_20345612", color: "#f5b849" },
  { id: "brand_agrotech", name: "AgroTech Riego", accountId: "act_20345612", color: "#a78bfa" },
  { id: "brand_bioprotect", name: "BioProtect Agro", accountId: "act_30456723", color: "#f0475b" },
];

const BRANDS: Brand[] = BRAND_SEED;

const CAMPAIGN_LINES = [
  "Lanzamiento de temporada",
  "Retargeting distribuidores",
  "Prospección fría",
  "Catálogo dinámico",
  "Awareness regional",
  "Promoción de cierre de mes",
];

const OBJECTIVE_POOL: Objective[] = [
  "OUTCOME_AWARENESS",
  "OUTCOME_TRAFFIC",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_LEADS",
  "OUTCOME_SALES",
];

const STATUS_POOL: CampaignStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "PAUSED", "PAUSED", "ARCHIVED"];

interface ObjectiveProfile {
  ctrRange: [number, number];
  cpmRange: [number, number];
  frequencyRange: [number, number];
  resultBasis: "clicks" | "impressions";
  resultRateRange: [number, number];
}

const OBJECTIVE_PROFILES: Record<Objective, ObjectiveProfile> = {
  OUTCOME_AWARENESS: {
    ctrRange: [0.004, 0.009],
    cpmRange: [3.5, 6.5],
    frequencyRange: [1.6, 2.6],
    resultBasis: "impressions",
    resultRateRange: [0.12, 0.22],
  },
  OUTCOME_TRAFFIC: {
    ctrRange: [0.014, 0.026],
    cpmRange: [5, 9],
    frequencyRange: [1.3, 2.0],
    resultBasis: "clicks",
    resultRateRange: [0.78, 0.94],
  },
  OUTCOME_ENGAGEMENT: {
    ctrRange: [0.02, 0.035],
    cpmRange: [4, 7],
    frequencyRange: [1.4, 2.2],
    resultBasis: "clicks",
    resultRateRange: [1.1, 1.6],
  },
  OUTCOME_LEADS: {
    ctrRange: [0.011, 0.019],
    cpmRange: [7, 13],
    frequencyRange: [1.5, 2.3],
    resultBasis: "clicks",
    resultRateRange: [0.08, 0.16],
  },
  OUTCOME_SALES: {
    ctrRange: [0.009, 0.016],
    cpmRange: [8, 15],
    frequencyRange: [1.5, 2.4],
    resultBasis: "clicks",
    resultRateRange: [0.04, 0.09],
  },
};

const CREATIVE_FORMAT_POOL: CreativeFormat[] = [
  "image",
  "image",
  "image",
  "video",
  "video",
  "carousel",
  "collection",
];

const CREATIVE_SWATCHES = ["#4c8cff", "#a78bfa", "#22c55e", "#f5b849", "#f0475b", "#7db0ff"];

const RANKING_POOL: QualityRanking[] = [
  "average",
  "average",
  "average",
  "above_average",
  "above_average",
  "below_average",
  "unknown",
];

export function isoDateOffset(anchorIso: string, offsetDays: number): string {
  const d = new Date(`${anchorIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function normalizeShares(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  return values.map((v) => v / total);
}

const BUDGET_TYPE_POOL: BudgetType[] = ["daily", "daily", "daily", "lifetime", "lifetime"];

function buildCampaigns(rng: () => number): Campaign[] {
  const campaigns: Campaign[] = [];
  let counter = 1;
  for (const brand of BRANDS) {
    const campaignCount = rangeInt(rng, 4, 5);
    const linesShuffled = shuffle(rng, CAMPAIGN_LINES);
    for (let i = 0; i < campaignCount; i++) {
      const objective = pick(rng, OBJECTIVE_POOL);
      const status = pick(rng, STATUS_POOL);
      const startOffset = -rangeInt(rng, 18, 75);
      const budgetType = pick(rng, BUDGET_TYPE_POOL);
      const budgetAmount = budgetType === "daily" ? rangeInt(rng, 15, 150) : rangeInt(rng, 300, 4000);
      const budgetRemaining = budgetType === "lifetime" ? Math.round(budgetAmount * rangeFloat(rng, 0.1, 0.85)) : undefined;
      campaigns.push({
        id: `cmp_${String(counter).padStart(3, "0")}`,
        accountId: brand.accountId,
        brandId: brand.id,
        name: `${brand.name} | ${linesShuffled[i % linesShuffled.length]}`,
        status,
        objective,
        budgetType,
        budgetAmount,
        budgetRemaining,
        startDate: isoDateOffset(ANCHOR_DATE, startOffset),
      });
      counter++;
    }
  }
  return campaigns;
}

interface CampaignParams {
  baseCpm: number;
  baseCtr: number;
  frequency: number;
  resultRate: number;
  trendSlope: number;
  weekendFactor: number;
  /** Referencia interna para simular el gasto diario — independiente del budgetType/budgetAmount que se muestra en la UI. */
  baseDailySpend: number;
  landingPageViewRate: number;
}

function buildCampaignParams(rng: () => number, campaigns: Campaign[]): Map<string, CampaignParams> {
  const map = new Map<string, CampaignParams>();
  for (const campaign of campaigns) {
    const profile = OBJECTIVE_PROFILES[campaign.objective];
    map.set(campaign.id, {
      baseCpm: rangeFloat(rng, profile.cpmRange[0], profile.cpmRange[1]),
      baseCtr: rangeFloat(rng, profile.ctrRange[0], profile.ctrRange[1]),
      frequency: rangeFloat(rng, profile.frequencyRange[0], profile.frequencyRange[1]),
      resultRate: rangeFloat(rng, profile.resultRateRange[0], profile.resultRateRange[1]),
      trendSlope: rangeFloat(rng, -0.015, 0.02),
      weekendFactor: rangeFloat(rng, 0.55, 0.85),
      baseDailySpend: rangeInt(rng, 25, 220),
      landingPageViewRate: rangeFloat(rng, 0.55, 0.9),
    });
  }
  return map;
}

function buildDailyInsights(
  rng: () => number,
  campaigns: Campaign[],
  params: Map<string, CampaignParams>
): DailyInsight[] {
  const rows: DailyInsight[] = [];
  for (const campaign of campaigns) {
    const p = params.get(campaign.id)!;
    const profile = OBJECTIVE_PROFILES[campaign.objective];
    for (let dayIndex = 0; dayIndex < WINDOW_DAYS; dayIndex++) {
      const date = isoDateOffset(ANCHOR_DATE, dayIndex - (WINDOW_DAYS - 1));
      if (date < campaign.startDate) continue;

      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const weekdayFactor = isWeekend ? p.weekendFactor : 1;
      const trendFactor = 1 + (p.trendSlope * dayIndex) / (WINDOW_DAYS - 1);
      const noise = rangeFloat(rng, 0.85, 1.15);
      const pausedFactor = campaign.status === "ACTIVE" ? 1 : campaign.status === "PAUSED" ? 0.12 : 0;

      const spend = Math.max(0, p.baseDailySpend * weekdayFactor * trendFactor * noise * pausedFactor);
      const cpm = p.baseCpm * rangeFloat(rng, 0.92, 1.08);
      const impressions = spend > 0 ? (spend / cpm) * 1000 : 0;
      const ctr = p.baseCtr * rangeFloat(rng, 0.85, 1.15);
      const clicks = impressions * ctr;
      const reach = impressions / p.frequency;
      const resultRate = p.resultRate * rangeFloat(rng, 0.88, 1.12);
      const results = profile.resultBasis === "impressions" ? impressions * resultRate : clicks * resultRate;
      const landingPageViews = clicks * p.landingPageViewRate * rangeFloat(rng, 0.9, 1.1);

      rows.push({
        date,
        campaignId: campaign.id,
        spend: Math.round(spend * 100) / 100,
        reach: Math.round(reach),
        impressions: Math.round(impressions),
        clicks: Math.round(clicks),
        results: Math.round(results),
        landingPageViews: Math.round(Math.min(landingPageViews, clicks)),
      });
    }
  }
  return rows;
}

function buildCreatives(rng: () => number, campaigns: Campaign[]): Creative[] {
  const creatives: Creative[] = [];
  let counter = 1;
  for (const campaign of campaigns) {
    const count = rangeInt(rng, 2, 3);
    for (let i = 0; i < count; i++) {
      creatives.push({
        id: `cre_${String(counter).padStart(3, "0")}`,
        campaignId: campaign.id,
        name: `Creativo ${String.fromCharCode(65 + i)}`,
        headline: pick(rng, [
          "Rinde más por hectárea",
          "Resultados desde la primera aplicación",
          "Tecnología que cuida tu cultivo",
          "Distribuidores autorizados en tu zona",
          "Pide tu asesoría técnica gratis",
          "Cosecha con respaldo garantizado",
        ]),
        format: pick(rng, CREATIVE_FORMAT_POOL),
        swatch: pick(rng, CREATIVE_SWATCHES),
        qualityRanking: pick(rng, RANKING_POOL),
        engagementRanking: pick(rng, RANKING_POOL),
        conversionRanking: pick(rng, RANKING_POOL),
      });
      counter++;
    }
  }
  return creatives;
}

interface CreativeWeight {
  spendShare: number;
  ctrIndex: number;
}

function buildCreativeDaily(
  rng: () => number,
  campaigns: Campaign[],
  creatives: Creative[],
  dailyInsights: DailyInsight[]
): CreativeDailyInsight[] {
  const creativesByCampaign = new Map<string, Creative[]>();
  for (const creative of creatives) {
    const list = creativesByCampaign.get(creative.campaignId) ?? [];
    list.push(creative);
    creativesByCampaign.set(creative.campaignId, list);
  }

  const weightsByCreative = new Map<string, CreativeWeight>();
  for (const [, list] of creativesByCampaign) {
    const rawSpend = list.map(() => rangeFloat(rng, 0.4, 1));
    const spendShares = normalizeShares(rawSpend);
    list.forEach((creative, idx) => {
      weightsByCreative.set(creative.id, {
        spendShare: spendShares[idx],
        ctrIndex: rangeFloat(rng, 0.75, 1.35),
      });
    });
  }

  const insightsByCampaign = new Map<string, DailyInsight[]>();
  for (const insight of dailyInsights) {
    const list = insightsByCampaign.get(insight.campaignId) ?? [];
    list.push(insight);
    insightsByCampaign.set(insight.campaignId, list);
  }

  const rows: CreativeDailyInsight[] = [];
  for (const campaign of campaigns) {
    const list = creativesByCampaign.get(campaign.id) ?? [];
    if (!list.length) continue;
    const weights = list.map((c) => weightsByCreative.get(c.id)!);
    const spendShares = weights.map((w) => w.spendShare);
    const engagementRaw = weights.map((w) => w.spendShare * w.ctrIndex);
    const engagementShares = normalizeShares(engagementRaw);

    for (const insight of insightsByCampaign.get(campaign.id) ?? []) {
      list.forEach((creative, idx) => {
        rows.push({
          date: insight.date,
          creativeId: creative.id,
          campaignId: campaign.id,
          spend: Math.round(insight.spend * spendShares[idx] * 100) / 100,
          impressions: Math.round(insight.impressions * spendShares[idx]),
          clicks: Math.round(insight.clicks * engagementShares[idx]),
          results: Math.round(insight.results * engagementShares[idx]),
        });
      });
    }
  }
  return rows;
}

function buildAudienceShares(rng: () => number, campaigns: Campaign[]): AudienceShare[] {
  const dimensions: Array<{ dimension: AudienceDimension; segments: readonly string[] }> = [
    { dimension: "age", segments: AGE_SEGMENTS },
    { dimension: "gender", segments: GENDER_SEGMENTS },
    { dimension: "device", segments: DEVICE_SEGMENTS },
    { dimension: "placement", segments: PLACEMENT_SEGMENTS },
  ];

  const rows: AudienceShare[] = [];
  for (const campaign of campaigns) {
    for (const { dimension, segments } of dimensions) {
      const raw = segments.map(() => rangeFloat(rng, 0.3, 1));
      const shares = normalizeShares(raw);
      segments.forEach((segment, idx) => {
        rows.push({ campaignId: campaign.id, dimension, segment, share: shares[idx] });
      });
    }
  }
  return rows;
}

const rng = createRng(20260818);
const campaigns = buildCampaigns(rng);
const campaignParams = buildCampaignParams(rng, campaigns);
const dailyInsights = buildDailyInsights(rng, campaigns, campaignParams);
const creatives = buildCreatives(rng, campaigns);
const creativeDailyInsights = buildCreativeDaily(rng, campaigns, creatives, dailyInsights);
const audienceShares = buildAudienceShares(rng, campaigns);

export const DATASET = {
  accounts: ACCOUNTS,
  brands: BRANDS,
  campaigns,
  dailyInsights,
  creatives,
  creativeDailyInsights,
  audienceShares,
};
