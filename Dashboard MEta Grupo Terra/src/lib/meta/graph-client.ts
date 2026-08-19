import { getMetaConfig, graphUrl } from "./config";

interface GraphErrorBody {
  error?: { message: string; type?: string; code?: number };
}

async function graphFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json()) as T & GraphErrorBody;
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Meta respondió con un error (HTTP ${res.status}).`);
  }
  return body;
}

interface PagedResponse<T> {
  data: T[];
  paging?: { next?: string };
}

/** Sigue paging.next hasta agotar resultados o llegar a maxPages (evita bucles infinitos por límites de la API). */
async function graphFetchAllPages<T>(initialUrl: string, maxPages = 20): Promise<T[]> {
  const rows: T[] = [];
  let url: string | undefined = initialUrl;
  let pages = 0;
  while (url && pages < maxPages) {
    const page: PagedResponse<T> = await graphFetch<PagedResponse<T>>(url);
    rows.push(...page.data);
    url = page.paging?.next;
    pages++;
  }
  return rows;
}

export interface TokenResult {
  accessToken: string;
  expiresInSeconds: number | null;
}

export async function exchangeCodeForShortLivedToken(code: string): Promise<TokenResult> {
  const config = getMetaConfig();
  const url = new URL(graphUrl("/oauth/access_token"));
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("code", code);

  const data = await graphFetch<{ access_token: string; expires_in?: number }>(url.toString());
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in ?? null };
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenResult> {
  const config = getMetaConfig();
  const url = new URL(graphUrl("/oauth/access_token"));
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const data = await graphFetch<{ access_token: string; expires_in?: number }>(url.toString());
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in ?? null };
}

export interface MetaAdAccount {
  id: string;
  name: string;
  accountStatus: number;
  currency: string;
  businessName: string | null;
}

export async function getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const url = new URL(graphUrl("/me/adaccounts"));
  url.searchParams.set("fields", "id,name,account_status,currency,business_name");
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);

  const data = await graphFetch<{
    data: Array<{ id: string; name: string; account_status: number; currency: string; business_name?: string }>;
  }>(url.toString());

  return data.data.map((a) => ({
    id: a.id,
    name: a.name,
    accountStatus: a.account_status,
    currency: a.currency,
    businessName: a.business_name ?? null,
  }));
}

export interface MetaTokenDebugInfo {
  isValid: boolean;
  expiresAt: number | null;
  scopes: string[];
}

export async function debugToken(accessToken: string): Promise<MetaTokenDebugInfo> {
  const config = getMetaConfig();
  const appToken = `${config.appId}|${config.appSecret}`;
  const url = new URL(graphUrl("/debug_token"));
  url.searchParams.set("input_token", accessToken);
  url.searchParams.set("access_token", appToken);

  const data = await graphFetch<{
    data: { is_valid: boolean; expires_at: number; scopes: string[] };
  }>(url.toString());

  return {
    isValid: data.data.is_valid,
    expiresAt: data.data.expires_at || null,
    scopes: data.data.scopes ?? [],
  };
}

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface RawCampaignInsightRow {
  campaign_id: string;
  campaign_name: string;
  objective?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  actions?: MetaAction[];
  date_start: string;
}

/**
 * Insights de campaña con desglose diario (time_increment=1). Cada fila ya trae
 * campaign_id/campaign_name/objective, así que no hace falta pedir la lista de
 * campañas por separado — solo se piden campañas que tuvieron actividad real en
 * el rango de fechas dado.
 */
export async function getCampaignInsights(
  accessToken: string,
  accountId: string,
  since: string,
  until: string
): Promise<RawCampaignInsightRow[]> {
  const url = new URL(graphUrl(`/${accountId}/insights`));
  url.searchParams.set("level", "campaign");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  url.searchParams.set("fields", "campaign_id,campaign_name,objective,spend,impressions,clicks,reach,actions");
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);

  return graphFetchAllPages<RawCampaignInsightRow>(url.toString());
}

export interface RawCampaignDetail {
  id: string;
  status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
}

/**
 * Estado y presupuesto de cada campaña. Se pide una por una porque Meta
 * deprecó el parámetro "ids" en lote a partir de v26.0 — el volumen de
 * campañas con actividad real en un rango de fechas suele ser pequeño.
 */
export async function getCampaignDetails(accessToken: string, campaignIds: string[]): Promise<Map<string, RawCampaignDetail>> {
  const details = new Map<string, RawCampaignDetail>();

  const results = await Promise.all(
    campaignIds.map(async (id) => {
      const url = new URL(graphUrl(`/${id}`));
      url.searchParams.set("fields", "status,daily_budget,lifetime_budget,budget_remaining");
      url.searchParams.set("access_token", accessToken);
      try {
        return await graphFetch<RawCampaignDetail>(url.toString());
      } catch {
        return { id, status: "ACTIVE" } satisfies RawCampaignDetail;
      }
    })
  );

  for (const r of results) details.set(r.id, r);
  return details;
}

export interface RawAdInsightRow {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  objective?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAction[];
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  conversion_rate_ranking?: string;
}

/** Insights por anuncio (no por día: una fila agregada por anuncio en todo el rango). */
export async function getAdInsights(
  accessToken: string,
  accountId: string,
  since: string,
  until: string
): Promise<RawAdInsightRow[]> {
  const url = new URL(graphUrl(`/${accountId}/insights`));
  url.searchParams.set("level", "ad");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  url.searchParams.set(
    "fields",
    "ad_id,ad_name,campaign_id,objective,spend,impressions,clicks,actions,quality_ranking,engagement_rate_ranking,conversion_rate_ranking"
  );
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", accessToken);

  return graphFetchAllPages<RawAdInsightRow>(url.toString());
}

export interface RawAdCreative {
  id: string;
  name?: string;
  object_type?: string;
  thumbnail_url?: string;
  title?: string;
  body?: string;
}

/** Detalle del creativo (formato, miniatura, texto) de cada anuncio, uno por uno — mismo motivo que getCampaignStatuses. */
export async function getAdCreatives(
  accessToken: string,
  adIds: string[]
): Promise<Map<string, RawAdCreative | null>> {
  const result = new Map<string, RawAdCreative | null>();

  const rows = await Promise.all(
    adIds.map(async (id) => {
      const url = new URL(graphUrl(`/${id}`));
      url.searchParams.set("fields", "creative{id,name,object_type,thumbnail_url,title,body}");
      url.searchParams.set("access_token", accessToken);
      try {
        const data = await graphFetch<{ creative?: RawAdCreative }>(url.toString());
        return { id, creative: data.creative ?? null };
      } catch {
        return { id, creative: null };
      }
    })
  );

  for (const r of rows) result.set(r.id, r.creative);
  return result;
}

export interface RawBreakdownRow {
  campaign_id: string;
  spend?: string;
  impressions?: string;
  [breakdownField: string]: string | undefined;
}

/** Insights de campaña con uno o más "breakdowns" de Meta (age, gender, publisher_platform, impression_device...). */
export async function getBreakdownInsights(
  accessToken: string,
  accountId: string,
  since: string,
  until: string,
  breakdowns: string[]
): Promise<RawBreakdownRow[]> {
  const url = new URL(graphUrl(`/${accountId}/insights`));
  url.searchParams.set("level", "campaign");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  url.searchParams.set("breakdowns", breakdowns.join(","));
  url.searchParams.set("fields", `campaign_id,spend,impressions`);
  url.searchParams.set("limit", "300");
  url.searchParams.set("access_token", accessToken);

  return graphFetchAllPages<RawBreakdownRow>(url.toString());
}
