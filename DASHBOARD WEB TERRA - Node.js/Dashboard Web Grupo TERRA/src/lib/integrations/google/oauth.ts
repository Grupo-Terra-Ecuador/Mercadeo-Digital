// Autenticacion con Google Identity Services (OAuth 2.0, flujo de token para SPA) y el
// helper googleFetch() que el resto de integraciones (ga4.ts, search-console.ts) usan para
// llamar a las APIs de Google con el access token ya obtenido.
//
// El Client ID viene de src/lib/config.ts, que a su vez lo lee de la variable de entorno
// NEXT_PUBLIC_GOOGLE_CLIENT_ID en tiempo de build. Cada entorno (dev/staging/prod) puede
// tener su propio Client ID con sus propios "Authorized JavaScript origins" en Google Cloud
// Console.
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from "../../config";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { error?: string; access_token?: string }) => void;
          }) => { requestAccessToken: (opts: { prompt: string }) => void };
          revoke: (token: string, cb: () => void) => void;
        };
      };
    };
  }
}

// Token de acceso y cliente de OAuth: no necesitan ser reactivos (ningun componente los lee
// directamente, solo se usan para firmar llamadas a las APIs de Google), asi que viven en
// una referencia de modulo en vez del store de Zustand.
const authRef: { accessToken: string | null } = { accessToken: null };

export function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar el script de autenticacion de Google (revisa tu conexion o bloqueadores de script)."));
    document.head.appendChild(s);
  });
}

export async function googleFetch<T = unknown>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: "Bearer " + authRef.accessToken, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function requestGoogleAccessToken(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID (ver .env.example) antes de poder conectar con Google.");
  }
  await loadGis();
  await new Promise<void>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        authRef.accessToken = resp.access_token || null;
        resolve();
      },
    });
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

export function revokeGoogleAccessToken(): void {
  if (authRef.accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(authRef.accessToken, () => {});
  }
  authRef.accessToken = null;
}

export function hasGoogleAccessToken(): boolean {
  return !!authRef.accessToken;
}
