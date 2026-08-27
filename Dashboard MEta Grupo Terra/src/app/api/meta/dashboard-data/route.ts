import { NextRequest, NextResponse } from "next/server";
import { getAdAccounts, type MetaAdAccount } from "@/lib/meta/graph-client";
import { getLiveAudienceShares, getLiveCreativeData, getLiveDashboardData } from "@/lib/meta/live-data";
import { getActiveAccessTokens } from "@/lib/meta/session";
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

  const activeTokens = await getActiveAccessTokens();
  if (activeTokens.length === 0) {
    return NextResponse.json(emptyResponse());
  }

  // Cada token puede pertenecer a un negocio de Meta distinto (ej. Sistec, Agrota Maquinaria).
  // Se descubren las cuentas de TODOS los tokens y se juntan en una sola lista antes de pedir
  // las métricas, para que un token vencido no tumbe el dashboard completo — solo se reporta
  // su error y se sigue con las cuentas de los demás tokens.
  const accountLookups = await Promise.all(
    activeTokens.map(async (active) => {
      try {
        const accounts = await getAdAccounts(active.token);
        return { token: active.token, accounts, error: null as string | null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo leer las cuentas publicitarias de este token.";
        return { token: active.token, accounts: [] as MetaAdAccount[], error: message };
      }
    })
  );

  const tokenErrors = accountLookups.filter((r) => r.error).map((r) => r.error as string);

  const tokenAccountPairs = accountLookups.flatMap((lookup) =>
    lookup.accounts.map((account) => ({ token: lookup.token, account }))
  );

  if (tokenAccountPairs.length === 0) {
    return NextResponse.json(
      emptyResponse({
        connected: true,
        error:
          tokenErrors.length > 0
            ? tokenErrors.join(" · ")
            : "Los tokens conectados no tienen acceso a ninguna cuenta publicitaria.",
      })
    );
  }

  // Cada cuenta publicitaria conectada se trata como una "marca" propia (1 cuenta = 1 marca),
  // con un color distinto para diferenciarlas en los gráficos comparativos. El índice de color
  // es global a través de todos los tokens/negocios, no se reinicia por token.
  const results = await Promise.all(
    tokenAccountPairs.map(({ token, account }, idx) =>
      fetchAccountData(token, account, CHART_PALETTE[idx % CHART_PALETTE.length], since, until)
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
  const allErrors = [...tokenErrors, ...failed.map((r) => `${r.account.name}: ${r.error}`)];
  if (allErrors.length > 0) {
    body.error = allErrors.join(" · ");
  }

  return NextResponse.json(body);
}
