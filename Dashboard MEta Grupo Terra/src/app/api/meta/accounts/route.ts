import { NextResponse } from "next/server";
import { getAdAccounts } from "@/lib/meta/graph-client";
import { getActiveAccessTokens } from "@/lib/meta/session";

export async function GET() {
  const activeTokens = await getActiveAccessTokens();
  if (activeTokens.length === 0) {
    return NextResponse.json({ connected: false, accounts: [] });
  }

  try {
    const accounts = (await Promise.all(activeTokens.map((active) => getAdAccounts(active.token)))).flat();
    return NextResponse.json({ connected: true, accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron obtener las cuentas publicitarias.";
    return NextResponse.json({ connected: true, accounts: [], error: message });
  }
}
