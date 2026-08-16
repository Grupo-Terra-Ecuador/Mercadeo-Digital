// Integracion con la Search Console API (listar sitios verificados y consultar
// searchAnalytics). No toca `state` global.
import { esc } from '../../core/format.js';
import { googleFetch } from './oauth.js';

export async function fetchGSCSites(googleState) {
  const data = await googleFetch('https://www.googleapis.com/webmasters/v3/sites');
  const sites = (data.siteEntry || []).map((s) => s.siteUrl);
  googleState.gscSites = sites;
  const sel = document.getElementById('gscSiteSelect');
  sel.innerHTML = sites.length
    ? sites.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')
    : '<option value="">Sin sitios disponibles</option>';
}

export async function runGSCReport(siteUrl, dateFrom, dateTo) {
  const body = { startDate: dateFrom, endDate: dateTo, dimensions: ['query'], rowLimit: 5000 };
  return googleFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function gscResponseToDataset(apiResponse, reportStart, reportEnd) {
  const columns = ['Consulta', 'Clics', 'Impresiones', 'CTR', 'Posicion media'];
  const rows = (apiResponse.rows || []).map((r) => ({
    Consulta: r.keys?.[0] ?? '',
    Clics: r.clicks ?? 0,
    Impresiones: r.impressions ?? 0,
    CTR: r.ctr ?? 0,
    'Posicion media': r.position ?? 0,
  }));
  return {
    name: 'Search Console - Consultas (API)',
    type: 'organico',
    columns,
    rows,
    delimiter: ',',
    headerIndex: 0,
    rawRows: rows.length + 1,
    warnings: [],
    notices: ['Datos obtenidos automaticamente desde la API de Search Console.'],
    reportStart,
    reportEnd,
    rowDateCol: null,
  };
}

export async function fetchGSCDataset(siteUrl, dateFrom, dateTo, reportStart, reportEnd) {
  const gsc = await runGSCReport(siteUrl, dateFrom, dateTo);
  return gscResponseToDataset(gsc, reportStart, reportEnd);
}
