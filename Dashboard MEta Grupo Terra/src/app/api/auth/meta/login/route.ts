import { NextRequest, NextResponse } from "next/server";
import { getMetaConfig, isOAuthConfigured } from "@/lib/meta/config";
import { setOauthStateCookie } from "@/lib/meta/session";

const SCOPES = ["ads_read", "business_management"].join(",");

export async function GET(request: NextRequest) {
  if (!isOAuthConfigured()) {
    return NextResponse.redirect(new URL("/conexiones?error=not_configured", request.url));
  }

  const config = getMetaConfig();
  const state = crypto.randomUUID();
  await setOauthStateCookie(state);

  const dialogUrl = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
  dialogUrl.searchParams.set("client_id", config.appId);
  dialogUrl.searchParams.set("redirect_uri", config.redirectUri);
  dialogUrl.searchParams.set("state", state);
  dialogUrl.searchParams.set("scope", SCOPES);
  dialogUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(dialogUrl);
}
