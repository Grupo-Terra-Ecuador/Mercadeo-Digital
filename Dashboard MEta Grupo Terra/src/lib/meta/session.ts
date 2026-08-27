import { cookies } from "next/headers";
import { getSystemUserTokens } from "./config";

const TOKEN_COOKIE = "meta_access_token";
const STATE_COOKIE = "meta_oauth_state";

/**
 * Token guardado en una cookie httpOnly (nunca llega al navegador vía JS).
 * Suficiente para un tablero de un solo usuario corriendo en localhost; si
 * este proyecto pasa a producción multiusuario, esto debe migrar a una
 * sesión cifrada por usuario en vez de una cookie con el token en claro.
 */
export async function setAccessTokenCookie(token: string, maxAgeSeconds: number) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSeconds,
    path: "/",
  });
}

export async function getAccessTokenCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

export async function clearAccessTokenCookie() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export async function setOauthStateCookie(state: string) {
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    path: "/",
  });
}

export async function readAndClearOauthStateCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(STATE_COOKIE)?.value ?? null;
  store.delete(STATE_COOKIE);
  return value;
}

export type TokenSource = "system_user" | "oauth";

export interface ActiveToken {
  token: string;
  source: TokenSource;
}

/**
 * Todos los tokens activos para llamar a la Graph API — normalmente uno por negocio de
 * Meta conectado (META_SYSTEM_USER_TOKEN, META_SYSTEM_USER_TOKEN_2, ...). Si no hay
 * ninguno configurado, cae a la cookie de sesión de "Conectar con Meta" (OAuth).
 */
export async function getActiveAccessTokens(): Promise<ActiveToken[]> {
  const systemTokens = getSystemUserTokens();
  if (systemTokens.length > 0) {
    return systemTokens.map((token) => ({ token, source: "system_user" as const }));
  }

  const cookieToken = await getAccessTokenCookie();
  return cookieToken ? [{ token: cookieToken, source: "oauth" }] : [];
}
