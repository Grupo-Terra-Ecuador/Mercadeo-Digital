export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const GOOGLE_SCOPES =
  'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly';

// URL del Cloudflare Worker que actua como proxy hacia la API de Claude (ver worker/).
// Sin barra final para poder concatenar rutas de forma predecible (`${AI_WORKER_URL}/api/...`).
export const AI_WORKER_URL = (import.meta.env.VITE_AI_WORKER_URL || '').replace(/\/$/, '');
