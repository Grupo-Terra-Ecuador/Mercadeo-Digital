import { NextRequest, NextResponse } from "next/server";
import { getAdAccounts, type MetaAdAccount } from "@/lib/meta/graph-client";
import { getLiveAudienceShares, getLiveCreativeData, getLiveDashboardData } from "@/lib/meta/live-data";
import { getActiveAccessToken } from "@/lib/meta/session";
import { CHART_PALETTE } from "@/lib/chart-colors";
import type { AdAccount, AudienceShare, Brand, Campaign, CreativeDailyInsight, DailyInsight } from "@/lib/types";
import type { Creative } from "@/lib/types";

export interface DashboardDataResponse {
  connected: boolean;
  accounts: AdAccount[];
  brands: Brand[];
  campaigns: Campaign[];
  dailyInsights: DailyInsight[];
  creatives: Creative[];
  creativeDailyInsights: CreativeDailyInsight[];
  audienceShares: AudienceShare[];
  error?: string;
}

function emptyResponse(overrides: Partial<DashboardDataResponse> = {}): DashboardDataResponse {
  return {
    connected: false,
    accounts: [],
    brands: [],
    campaigns: [],
    dailyInsights: [],
    creatives: [],
    creativeDailyInsights: [],
    audienceShares: [],
    ...overrides,
  };
}

interface AccountResult {
  account: MetaAdAccount;
  color: string;
  campaigns: Campaign[];
  dailyInsights: DailyInsight[];
  creatives: Creative[];
  creativeDailyInsights: CreativeDailyInsight[];
  audienceShares: AudienceShare[];
  error: string | null;
}

async function fetchAccountData(
  accessToken: string,
  account: MetaAdAccount,
  color: string,
  since: string,
  until: string
): Promise<AccountResult> {
  try {
    const [{ campaigns, dailyInsights }, { creatives, creativeDailyInsights }, audienceShares] = await Promise.all([
      getLiveDashboardData(accessToken, account.id, since, until),
      getLiveCreativeData(accessToken, account.id, since, until),
      getLiveAudienceShares(accessToken, account.id, since, until),
    ]);
    return { account, color, campaigns, dailyInsights, creatives, creativeDailyInsights, audienceShares, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron leer las métricas de esta cuenta.";
    return {
      account,
      color,
      campaigns: [],
      dailyInsights: [],
      creatives: [],
      creativeDailyInsights: [],
      audienceShares: [],
      error: message,
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  if (!since || !until) {
    return NextResponse.json({ error: "Faltan los parámetros since/until." }, { status: 400 });
  }

  const active = await getActiveAccessToken();
  if (!active) {
    return NextResponse.json(emptyResponse());
  }

  let accounts: MetaAdAccount[];
  try {
    accounts = await getAdAccounts(active.token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo leer tus cuentas publicitarias.";
    return NextResponse.json(emptyResponse({ connected: true, error: message }));
  }

  if (accounts.length === 0) {
    return NextResponse.json(
      emptyResponse({ connected: true, error: "El token conectado no tiene acceso a ninguna cuenta publicitaria." })
    );
  }

  // Cada cuenta publicitaria conectada se trata como una "marca" propia (1 cuenta = 1 marca),
  // con un color distinto para diferenciarlas en los gráficos comparativos.
  const results = await Promise.all(
    accounts.map((account, idx) =>
      fetchAccountData(active.token, account, CHART_PALETTE[idx % CHART_PALETTE.length], since, until)
    )
  );

  const body: DashboardDataResponse = {
    connected: true,
    accounts: results.map((r) => ({ id: r.account.id, name: r.account.name, currency: r.account.currency })),
    brands: results.map((r) => ({ id: r.account.id, name: r.account.name, accountId: r.account.id, color: r.color })),
    campaigns: results.flatMap((r) => r.campaigns),
    dailyInsights: results.flatMap((r) => r.dailyInsights),
    creatives: results.flatMap((r) => r.creatives),
    creativeDailyInsights: results.flatMap((r) => r.creativeDailyInsights),
    audienceShares: results.flatMap((r) => r.audienceShares),
  };

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    body.error = failed.map((r) => `${r.account.name}: ${r.error}`).join(" · ");
  }

  return NextResponse.json(body);
}
