import { NextRequest, NextResponse } from "next/server";
import { clearAccessTokenCookie } from "@/lib/meta/session";

export async function POST(request: NextRequest) {
  await clearAccessTokenCookie();
  return NextResponse.redirect(new URL("/conexiones?disconnected=1", request.url));
}
