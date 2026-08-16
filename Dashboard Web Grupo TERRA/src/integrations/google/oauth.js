// Autenticacion con Google Identity Services (OAuth 2.0, flujo de token para SPA) y el
// helper googleFetch() que el resto de integraciones (ga4.js, search-console.js) usan
// para llamar a las APIs de Google con el access token ya obtenido.
//
// El Client ID ya NO esta hardcodeado (a diferencia del archivo original): viene de
// src/config.js, que a su vez lo lee de la variable de entorno VITE_GOOGLE_CLIENT_ID en
// tiempo de build. Cada entorno (dev/staging/prod) puede tener su propio Client ID con
// sus propios "Authorized JavaScript origins" en Google Cloud Console.
import { esc } from '../../core/format.js';
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '../../config.js';
import { fetchGA4Properties } from './ga4.js';
import { fetchGSCSites } from './search-console.js';

export const googleState = {
  tokenClient: null,
  accessToken: null,
  ga4Properties: [],
  gscSites: [],
};

export function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () =>
      reject(new Error('No se pudo cargar el script de autenticacion de Google (revisa tu conexion o bloqueadores de script).'));
    document.head.appendChild(s);
  });
}

export async function googleFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + googleState.accessToken, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function connectGoogle() {
  const statusEl = document.getElementById('googleStatus');
  if (!GOOGLE_CLIENT_ID) {
    statusEl.textContent =
      'Falta configurar VITE_GOOGLE_CLIENT_ID (ver .env.example) antes de poder conectar con Google.';
    return;
  }
  try {
    statusEl.textContent = 'Cargando autenticacion de Google...';
    await loadGis();
    await new Promise((resolve, reject) => {
      googleState.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(resp.error));
            return;
          }
          googleState.accessToken = resp.access_token;
          resolve();
        },
      });
      googleState.tokenClient.requestAccessToken({ prompt: '' });
    });
    statusEl.textContent = 'Conectado. Cargando propiedades disponibles...';
    await Promise.all([fetchGA4Properties(googleState), fetchGSCSites(googleState)]);
    document.getElementById('googleConnectBtn').hidden = true;
    document.getElementById('googleDisconnectBtn').hidden = false;
    document.getElementById('googlePickers').hidden = false;
    statusEl.textContent = `Conectado. ${googleState.ga4Properties.length} propiedad(es) de GA4 y ${googleState.gscSites.length} sitio(s) de Search Console detectados.`;
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      'No fue posible conectar con Google: ' +
      esc(err.message || 'error desconocido') +
      '. Verifica el Client ID, el origen autorizado y que tu cuenta este agregada como usuario de prueba en Google Cloud Console.';
  }
}

export function disconnectGoogle() {
  if (googleState.accessToken && window.google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(googleState.accessToken, () => {});
  }
  googleState.accessToken = null;
  googleState.ga4Properties = [];
  googleState.gscSites = [];
  document.getElementById('googleConnectBtn').hidden = false;
  document.getElementById('googleDisconnectBtn').hidden = true;
  document.getElementById('googlePickers').hidden = true;
  document.getElementById('googleStatus').textContent =
    'Desconectado. Los datos seguiran viniendo de los CSV mientras no conectes una cuenta.';
}
