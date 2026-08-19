import { NextResponse } from "next/server";
import { getAdAccounts } from "@/lib/meta/graph-client";
import { getActiveAccessToken } from "@/lib/meta/session";

export async function GET() {
  const active = await getActiveAccessToken();
  if (!active) {
    return NextResponse.json({ connected: false, accounts: [] });
  }

  try {
    const accounts = await getAdAccounts(active.token);
    return NextResponse.json({ connected: true, accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron obtener las cuentas publicitarias.";
    return NextResponse.json({ connected: true, accounts: [], error: message });
  }
}
