import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForShortLivedToken, exchangeForLongLivedToken } from "@/lib/meta/graph-client";
import { readAndClearOauthStateCookie, setAccessTokenCookie } from "@/lib/meta/session";

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 60; // ~60 días, duración típica del token de larga duración

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL(`/conexiones?error=${encodeURIComponent(oauthError)}`, request.url));
  }

  const expectedState = await readAndClearOauthStateCookie();
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/conexiones?error=invalid_state", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/conexiones?error=missing_code", request.url));
  }

  try {
    const shortLived = await exchangeCodeForShortLivedToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
    await setAccessTokenCookie(longLived.accessToken, longLived.expiresInSeconds ?? DEFAULT_TOKEN_TTL_SECONDS);
    return NextResponse.redirect(new URL("/conexiones?connected=1", request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al conectar con Meta.";
    return NextResponse.redirect(new URL(`/conexiones?error=${encodeURIComponent(message)}`, request.url));
  }
}
