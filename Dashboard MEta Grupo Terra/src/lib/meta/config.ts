export interface MetaConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphVersion: string;
}

export function getGraphVersion(): string {
  return process.env.META_GRAPH_API_VERSION ?? "v26.0";
}

/** URL builder that only needs the API version — usable with a system-user token, no app secret required. */
export function graphUrl(path: string): string {
  return `https://graph.facebook.com/${getGraphVersion()}${path}`;
}

/** True if the interactive "Login with Facebook" OAuth flow can run (needs app id + secret). */
export function isOAuthConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function getMetaConfig(): MetaConfig {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI ?? "http://localhost:4200/api/auth/meta/callback";

  if (!appId || !appSecret) {
    throw new Error(
      "Faltan META_APP_ID / META_APP_SECRET. Complétalos en .env.local (ver .env.example) y reinicia el servidor."
    );
  }

  return { appId, appSecret, redirectUri, graphVersion: getGraphVersion() };
}

/** Token de Usuario del Sistema generado desde el Administrador Comercial — no expira y no requiere OAuth. */
export function getSystemUserToken(): string | null {
  const token = process.env.META_SYSTEM_USER_TOKEN?.trim();
  return token ? token : null;
}
