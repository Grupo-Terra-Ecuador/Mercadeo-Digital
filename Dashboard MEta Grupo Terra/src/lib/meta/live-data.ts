import type {
  AudienceDimension,
  AudienceShare,
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
import {
  getAdCreatives,
  getAdInsights,
  getBreakdownInsights,
  getCampaignDetails,
  getCampaignInsights,
  type MetaAction,
  type RawAdCreative,
  type RawBreakdownRow,
  type RawCampaignInsightRow,
} from "./graph-client";

/**
 * Meta tiene objetivos "modernos" (OUTCOME_*) y objetivos antiguos que siguen
 * apareciendo en campañas creadas antes de ~2022. Los normalizamos a las 5
 * categorías que ya usa el resto del dashboard para no duplicar UI/labels.
 */
function normalizeObjective(raw: string | undefined): Objective {
  switch (raw) {
    case "OUTCOME_AWARENESS":
      return "OUTCOME_AWARENESS";
    case "OUTCOME_TRAFFIC":
    case "LINK_CLICKS":
      return "OUTCOME_TRAFFIC";
    case "OUTCOME_ENGAGEMENT":
    case "MESSAGES":
    case "POST_ENGAGEMENT":
      return "OUTCOME_ENGAGEMENT";
    case "OUTCOME_LEADS":
    case "LEAD_GENERATION":
      return "OUTCOME_LEADS";
    case "OUTCOME_SALES":
    case "CONVERSIONS":
    case "PRODUCT_CATALOG_SALES":
      return "OUTCOME_SALES";
    default:
      return "OUTCOME_TRAFFIC";
  }
}

function normalizeStatus(raw: string | undefined): CampaignStatus {
  if (raw === "ACTIVE" || raw === "PAUSED") return raw;
  return "ARCHIVED";
}

/**
 * A qué action_type de Meta corresponde "Resultados" según el objetivo. Es una
 * heurística razonable, no la métrica de optimización exacta de cada campaña
 * (para eso haría falta otra llamada a nivel de anuncio) — se toma el primer
 * action_type de la lista que aparezca en la fila. Ajustar aquí si al revisar
 * los números reales no calzan con lo que muestra Meta Ads Manager.
 */
const RESULT_ACTION_PRIORITY: Record<Objective, string[]> = {
  OUTCOME_AWARENESS: ["video_view", "post_engagement"],
  OUTCOME_TRAFFIC: ["link_click"],
  OUTCOME_ENGAGEMENT: ["post_engagement", "page_engagement", "onsite_conversion.total_messaging_connection"],
  OUTCOME_LEADS: [
    "lead",
    "onsite_conversion.lead_grouped",
    "onsite_conversion.total_messaging_connection",
    "onsite_conversion.messaging_conversation_started_7d",
  ],
  OUTCOME_SALES: ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase", "onsite_conversion.purchase"],
};

function extractResults(actions: MetaAction[] | undefined, objective: Objective): number {
  if (!actions?.length) return 0;
  for (const type of RESULT_ACTION_PRIORITY[objective]) {
    const match = actions.find((a) => a.action_type === type);
    if (match) return Number(match.value) || 0;
  }
  return 0;
}

function extractLandingPageViews(actions: MetaAction[] | undefined): number {
  const match = actions?.find((a) => a.action_type === "landing_page_view");
  return match ? Number(match.value) || 0 : 0;
}

function normalizeQualityRanking(raw: string | undefined): QualityRanking {
  switch (raw?.toUpperCase()) {
    case "ABOVE_AVERAGE":
      return "above_average";
    case "AVERAGE":
      return "average";
    case "BELOW_AVERAGE_35":
    case "BELOW_AVERAGE_20":
    case "BELOW_AVERAGE_10":
    case "BELOW_AVERAGE":
      return "below_average";
    default:
      return "unknown";
  }
}

/** Meta guarda daily_budget/lifetime_budget/budget_remaining en centavos de la moneda de la cuenta. */
function centsToAmount(raw: string | undefined): number {
  return raw ? Number(raw) / 100 : 0;
}

export interface LiveDashboardData {
  campaigns: Campaign[];
  dailyInsights: DailyInsight[];
}

export async function getLiveDashboardData(
  accessToken: string,
  accountId: string,
  since: string,
  until: string
): Promise<LiveDashboardData> {
  const rows: RawCampaignInsightRow[] = await getCampaignInsights(accessToken, accountId, since, until);

  const campaignMeta = new Map<string, { name: string; objective: Objective }>();
  const dailyInsights: DailyInsight[] = [];

  for (const row of rows) {
    const objective = normalizeObjective(row.objective);
    if (!campaignMeta.has(row.campaign_id)) {
      campaignMeta.set(row.campaign_id, { name: row.campaign_name, objective });
    }
    dailyInsights.push({
      date: row.date_start,
      campaignId: row.campaign_id,
      spend: Number(row.spend ?? 0),
      reach: Number(row.reach ?? 0),
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      results: extractResults(row.actions, objective),
      landingPageViews: extractLandingPageViews(row.actions),
    });
  }

  const campaignIds = [...campaignMeta.keys()];
  const details = campaignIds.length ? await getCampaignDetails(accessToken, campaignIds) : new Map();

  const campaigns: Campaign[] = campaignIds.map((id) => {
    const meta = campaignMeta.get(id)!;
    const detail = details.get(id);
    const budgetType: BudgetType = detail?.daily_budget ? "daily" : detail?.lifetime_budget ? "lifetime" : "none";
    return {
      id,
      accountId,
      brandId: accountId, // sin concepto de "marca" en Meta: 1 cuenta conectada = 1 marca por ahora
      name: meta.name,
      status: normalizeStatus(detail?.status),
      objective: meta.objective,
      budgetType,
      budgetAmount: budgetType === "daily" ? centsToAmount(detail?.daily_budget) : centsToAmount(detail?.lifetime_budget),
      budgetRemaining: budgetType === "lifetime" ? centsToAmount(detail?.budget_remaining) : undefined,
      startDate: since,
    };
  });

  return { campaigns, dailyInsights };
}

function mapCreativeFormat(objectType: string | undefined): CreativeFormat {
  const t = (objectType ?? "").toUpperCase();
  if (t.includes("VIDEO")) return "video";
  if (t.includes("CAROUSEL")) return "carousel";
  if (t.includes("COLLECTION")) return "collection";
  return "image"; // STATUS, SHARE, PHOTO, LINK, etc.
}

function extractHeadline(creative: RawAdCreative | null | undefined, fallbackName: string): string {
  const title = creative?.title?.trim();
  if (title) return title;
  const body = creative?.body?.trim();
  if (body) return body.length > 90 ? `${body.slice(0, 87)}...` : body;
  return fallbackName;
}

const SWATCH_PALETTE = ["#4c8cff", "#a78bfa", "#22c55e", "#f5b849", "#f0475b", "#7db0ff"];

function swatchForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return SWATCH_PALETTE[Math.abs(hash) % SWATCH_PALETTE.length];
}

export interface LiveCreativeData {
  creatives: Creative[];
  creativeDailyInsights: CreativeDailyInsight[];
}

/**
 * Insights por anuncio (agregados en todo el rango, no por día) + detalle del
 * creativo de cada uno. `date` en cada fila se fija en `until` únicamente para
 * que pase el mismo filtro de fechas que ya usan las páginas — no representa
 * un desglose diario real.
 */
export async function getLiveCreativeData(
  accessToken: string,
  accountId: string,
  since: string,
  until: string
): Promise<LiveCreativeData> {
  const rows = await getAdInsights(accessToken, accountId, since, until);
  if (rows.length === 0) return { creatives: [], creativeDailyInsights: [] };

  const adMeta = new Map<
    string,
    { name: string; campaignId: string; objective: Objective; quality: QualityRanking; engagement: QualityRanking; conversion: QualityRanking }
  >();
  const creativeDailyInsights: CreativeDailyInsight[] = [];

  for (const row of rows) {
    const objective = normalizeObjective(row.objective);
    adMeta.set(row.ad_id, {
      name: row.ad_name,
      campaignId: row.campaign_id,
      objective,
      quality: normalizeQualityRanking(row.quality_ranking),
      engagement: normalizeQualityRanking(row.engagement_rate_ranking),
      conversion: normalizeQualityRanking(row.conversion_rate_ranking),
    });
    creativeDailyInsights.push({
      date: until,
      creativeId: row.ad_id,
      campaignId: row.campaign_id,
      spend: Number(row.spend ?? 0),
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      results: extractResults(row.actions, objective),
    });
  }

  const adIds = [...adMeta.keys()];
  const creativeDetails = await getAdCreatives(accessToken, adIds);

  const creatives: Creative[] = adIds.map((id) => {
    const meta = adMeta.get(id)!;
    const raw = creativeDetails.get(id);
    return {
      id,
      campaignId: meta.campaignId,
      name: raw?.name ?? meta.name,
      headline: extractHeadline(raw, meta.name),
      format: mapCreativeFormat(raw?.object_type),
      swatch: swatchForId(id),
      thumbnailUrl: raw?.thumbnail_url,
      qualityRanking: meta.quality,
      engagementRanking: meta.engagement,
      conversionRanking: meta.conversion,
    };
  });

  return { creatives, creativeDailyInsights };
}

function aggregateSharesByCampaign(
  rows: RawBreakdownRow[],
  breakdownField: string,
  dimension: AudienceDimension,
  labelFor?: (raw: string) => string
): AudienceShare[] {
  const byCampaign = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const raw = row[breakdownField];
    if (!raw) continue;
    const segment = labelFor ? labelFor(raw) : raw;
    const spend = Number(row.spend ?? 0);
    let segMap = byCampaign.get(row.campaign_id);
    if (!segMap) {
      segMap = new Map();
      byCampaign.set(row.campaign_id, segMap);
    }
    segMap.set(segment, (segMap.get(segment) ?? 0) + spend);
  }

  const shares: AudienceShare[] = [];
  for (const [campaignId, segMap] of byCampaign) {
    const total = [...segMap.values()].reduce((sum, v) => sum + v, 0);
    for (const [segment, spend] of segMap) {
      shares.push({ campaignId, dimension, segment, share: total > 0 ? spend / total : 0 });
    }
  }
  return shares;
}

const GENDER_LABELS: Record<string, string> = { female: "Mujeres", male: "Hombres", unknown: "Desconocido" };
const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  messenger: "Messenger",
  audience_network: "Audience Network",
};

function deviceLabel(raw: string): string {
  if (raw.includes("tablet") || raw === "ipad") return "Tablet";
  if (raw === "desktop") return "Computadora";
  return "Móvil";
}

/**
 * Meta exige pedir age+gender juntos en un solo breakdown; se separan acá en
 * las 2 dimensiones que usa la UI. Placement usa publisher_platform (Facebook
 * / Instagram / Messenger / Audience Network) en vez del desglose más fino de
 * "posición" — más legible para un tablero de marketing.
 */
export async function getLiveAudienceShares(
  accessToken: string,
  accountId: string,
  since: string,
  until: string
): Promise<AudienceShare[]> {
  const [ageGenderRows, placementRows, deviceRows] = await Promise.all([
    getBreakdownInsights(accessToken, accountId, since, until, ["age", "gender"]),
    getBreakdownInsights(accessToken, accountId, since, until, ["publisher_platform"]),
    getBreakdownInsights(accessToken, accountId, since, until, ["impression_device"]),
  ]);

  return [
    ...aggregateSharesByCampaign(ageGenderRows, "age", "age"),
    ...aggregateSharesByCampaign(ageGenderRows, "gender", "gender", (g) => GENDER_LABELS[g] ?? g),
    ...aggregateSharesByCampaign(placementRows, "publisher_platform", "placement", (p) => PLATFORM_LABELS[p] ?? p),
    ...aggregateSharesByCampaign(deviceRows, "impression_device", "device", deviceLabel),
  ];
}
