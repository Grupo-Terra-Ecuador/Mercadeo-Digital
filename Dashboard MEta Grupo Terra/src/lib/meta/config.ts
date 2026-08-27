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

/**
 * Uno o más tokens fijos configurados por variable de entorno — normalmente Tokens de
 * Usuario del Sistema (permanentes), pero también pueden ser tokens de usuario normal de
 * larga duración cuando el negocio de Meta correspondiente no tiene habilitados los
 * usuarios del sistema. `META_SYSTEM_USER_TOKEN` es el primero; para negocios adicionales
 * (que no comparten usuario del sistema) se agregan `META_SYSTEM_USER_TOKEN_2`,
 * `META_SYSTEM_USER_TOKEN_3`, etc. — cada uno puede pertenecer a una cuenta/negocio
 * distinto, el dashboard junta las cuentas publicitarias de todos.
 */
export function getSystemUserTokens(): string[] {
  const tokens: string[] = [];

  const first = process.env.META_SYSTEM_USER_TOKEN?.trim();
  if (first) tokens.push(first);

  for (let i = 2; ; i++) {
    const next = process.env[`META_SYSTEM_USER_TOKEN_${i}`]?.trim();
    if (!next) break;
    tokens.push(next);
  }

  return tokens;
}

/**
 * Lista opcional de IDs de cuenta publicitaria (separados por coma) a mostrar en el
 * dashboard. Un token personal (no de Usuario del Sistema) puede tener acceso a cuentas
 * ajenas a AGROTA de forma incidental (ej. cuentas de otras personas del mismo negocio de
 * Meta) — este filtro las oculta para que el selector de "Cuenta" solo muestre las marcas
 * reales. Si `META_AD_ACCOUNT_ALLOWLIST` no está definida, se muestran todas las cuentas a
 * las que el token tenga acceso (comportamiento por defecto).
 */
export function getAccountAllowlist(): Set<string> | null {
  const raw = process.env.META_AD_ACCOUNT_ALLOWLIST?.trim();
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}
