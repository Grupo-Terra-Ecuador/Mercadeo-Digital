import { NextRequest, NextResponse } from "next/server";
import { getAdAccounts } from "@/lib/meta/graph-client";
import { getLiveAudienceShares, getLiveCreativeData, getLiveDashboardData } from "@/lib/meta/live-data";
import { getActiveAccessToken } from "@/lib/meta/session";
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

  let accounts;
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

  // Fase actual: se usa la primera cuenta publicitaria disponible como "marca" única.
  const primary = accounts[0];
  const account: AdAccount = { id: primary.id, name: primary.name, currency: primary.currency };
  const brand: Brand = { id: primary.id, name: primary.name, accountId: primary.id, color: "#4c8cff" };

  try {
    const [{ campaigns, dailyInsights }, { creatives, creativeDailyInsights }, audienceShares] = await Promise.all([
      getLiveDashboardData(active.token, primary.id, since, until),
      getLiveCreativeData(active.token, primary.id, since, until),
      getLiveAudienceShares(active.token, primary.id, since, until),
    ]);

    const body: DashboardDataResponse = {
      connected: true,
      accounts: [account],
      brands: [brand],
      campaigns,
      dailyInsights,
      creatives,
      creativeDailyInsights,
      audienceShares,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron leer las métricas de campañas.";
    return NextResponse.json(emptyResponse({ connected: true, accounts: [account], brands: [brand], error: message }));
  }
}
