// Punto de entrada de la aplicacion: conecta estado, eventos del DOM y el pipeline de
// procesamiento (CSV local o datos en vivo de Google) con los modulos de renderizado.
//
// Los botones y selects del index.html ya no usan atributos onclick/onchange inline (a
// diferencia del original): usan atributos data-action leidos por los listeners delegados
// definidos aqui, para que el HTML quede libre de JS inline (requisito para CSP estricta).
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';

import { esc, dateISO, dateLabel, parseReportDateToken } from './core/format.js';
import { parseCSV } from './core/csv/parse.js';
import { classify } from './core/csv/classify.js';
import { readTextFile } from './core/csv/parse.js';
import { buildModel } from './core/model/build-model.js';
import { selectedDateRange } from './core/model/date-filter.js';
import { state } from './state.js';

import { initTooltip } from './ui/tooltip.js';
import { initNav, setActiveNav, scheduleActiveNavSync } from './ui/nav.js';
import { initExportChecks, initCardExportChecks, selectedExportIds, setAllExportSections, toggleAllAccordions, updateExportSelection } from './ui/export-selection.js';
import { setModuleAvailability, restoreAllModules } from './ui/module-availability.js';
import { safe } from './ui/render-helpers.js';
import { renderAllAiInsightBlocks, handleGenerateAiInsight } from './ui/ai-insight.js';

import { renderSummary, renderTrafficTrend } from './sections/resumen.js';
import { renderTraffic, renderSessionsTrend, renderBounceTrend } from './sections/trafico.js';
import { renderUsers, renderUserChannelTrend, renderUserDayHourBalanceChart, renderUserBreakdownTrend } from './sections/usuarios.js';
import { renderAudiences } from './sections/audiencias.js';
import { renderPages } from './sections/paginas.js';
import { renderTechnology } from './sections/tecnologia.js';
import { renderOrganic } from './sections/organico.js';
import { renderDemographics, renderRegionFiltered, renderCityFiltered } from './sections/demografia.js';
import { renderValidation } from './sections/validacion.js';
import { renderFileCards } from './sections/file-cards.js';

import { applyTrendRange, useFullTrendRange, initTrendToggleDelegation } from './charts/trend-registry.js';
import { connectGoogle, disconnectGoogle, googleState } from './integrations/google/oauth.js';
import { fetchAllGA4Datasets } from './integrations/google/ga4.js';
import { fetchGSCDataset } from './integrations/google/search-console.js';
import { exportProcessedHTML } from './export/export-html.js';

function setTop(msg) {
  document.getElementById('topStatus').textContent = msg;
}

function banner(type, msg) {
  const el = document.getElementById('statusBanner');
  el.className = 'statusBanner ' + type;
  el.innerHTML = `<span>${type === 'ok' ? '✅' : type === 'bad' ? '🔴' : '⚠️'}</span><span>${esc(msg)}</span>`;
}

function renderDateStatus(m) {
  const el = document.getElementById('dateFilterStatus');
  const i = m.dateInfo;
  const detected = i.detectedStart ? `${dateLabel(i.detectedStart)} a ${dateLabel(i.detectedEnd)}` : 'No detectado';
  if (!i.active) {
    el.innerHTML = `<b>Rango detectado:</b> ${detected}. Los CSV agregados sin Fecha por fila se procesan completos.`;
    return;
  }
  const { from, to } = selectedDateRange(state.settings);
  const widerThanData = i.detectedStart && ((from && from < i.detectedStart) || (to && to > i.detectedEnd));
  const warn = widerThanData
    ? ` <br><br><b>ADVERTENCIA: el rango solicitado es mas amplio que los datos actualmente cargados.</b> Este filtro solo puede recortar dentro de lo que ya tienes cargado (${detected}); no puede mostrar informacion que nunca se trajo. Si necesitas datos de un periodo distinto, vuelve a dar clic en "Traer datos de Google" (o sube otro CSV) usando ese rango.`
    : '';
  el.innerHTML = `<b>Filtro solicitado:</b> ${state.settings.dateFrom || 'inicio'} a ${state.settings.dateTo || 'fin'}. <b>Rango detectado:</b> ${detected}. Resultado: ${i.exact} archivo(s) filtrados exactamente, ${i.aggregated} conservados como agregados y ${i.excluded} excluidos.${warn}`;
}

// Recalcula el modelo a partir de state.datasets/state.settings y re-renderiza todo.
// Tambien actualiza state.filteredDatasets (el array ya recortado por el filtro de
// fechas), que ademas de alimentar Validacion/Reportes procesados es lo que usa la
// exportacion a HTML para "congelar" el rango de fechas seleccionado (ver export-html.js).
function refreshModel() {
  state.model = buildModel(state.datasets, state.settings);
  state.filteredDatasets = state.model.base;
  renderAll(state.model);
}

function renderAll(m) {
  safe('resumen', () => renderSummary(m));
  safe('trafficTrend', () => renderTrafficTrend());
  safe('trafico', () => renderTraffic(m));
  safe('sessionsTrend', () => renderSessionsTrend());
  safe('bounceTrend', () => renderBounceTrend());
  safe('usuarios', () => renderUsers(m));
  safe('userChannelTrend', () => renderUserChannelTrend());
  safe('userDayHourHeatmap', () => renderUserDayHourBalanceChart());
  safe('userBreakdownTrend', () => renderUserBreakdownTrend());
  safe('audiencias', () => renderAudiences(m));
  safe('paginas', () => renderPages(m));
  safe('tecnologia', () => renderTechnology(m));
  safe('organico', () => renderOrganic(m));
  safe('demografia', () => renderDemographics(m));
  safe('validacion', () => renderValidation());
  renderFileCards();
  renderDateStatus(m);
  setModuleAvailability(m);
  updateExportSelection();
  renderAllAiInsightBlocks();
}

function pickFiles() {
  document.getElementById('csvInput').click();
}

async function readFiles() {
  state.datasets = [];
  for (const file of state.files) {
    const text = await readTextFile(file);
    const parsed = parseCSV(text);
    const type = classify(file.name, parsed.columns);
    if (type === 'otro') {
      parsed.warnings = [
        ...(parsed.warnings || []),
        'No se pudo clasificar este archivo en ningun modulo del dashboard (trafico, usuarios, audiencias, paginas, tecnologia, organico o demografia). No se usara en los calculos. Verifica que sea una exportacion estandar de GA4 o Search Console.',
      ];
    }
    state.datasets.push({ name: file.name, type, ...parsed });
  }
}

function readSettings() {
  state.settings.dateFrom = document.getElementById('dateFrom').value || '';
  state.settings.dateTo = document.getElementById('dateTo').value || '';
  state.settings.dateMode = 'safe';
}

function csvSourceName() {
  const names = state.files.map((f) => f.name.replace(/\.csv$/i, ''));
  if (!names.length) return 'CSV';
  return names.length <= 2 ? names.join('+') : `${names[0]}+${names.length - 1}_mas`;
}

async function processDashboard() {
  if (!state.files.length) return;
  readSettings();
  setTop('Procesando archivos...');
  banner('warn', 'Procesando y validando CSV...');
  try {
    await readFiles();
    state.dataSourceName = csvSourceName();
    refreshModel();
    document.getElementById('exportBtn').disabled = selectedExportIds().length === 0;
    setTop(`${state.datasets.length} reportes procesados - ${state.model.warnings.length} advertencia(s)`);
    banner(
      state.model.warnings.length ? 'warn' : 'ok',
      state.model.warnings.length
        ? `Dashboard procesado con ${state.model.warnings.length} advertencia(s). Revisa Validacion tecnica.`
        : 'Dashboard procesado correctamente.'
    );
  } catch (err) {
    console.error(err);
    setTop('Error de procesamiento');
    banner('bad', 'No fue posible procesar uno o mas archivos. Verifica que sean CSV validos.');
  }
}

function applyDateFilter() {
  if (!state.datasets.length) {
    alert('Primero carga y procesa los CSV.');
    return;
  }
  readSettings();
  refreshModel();
  banner('ok', 'Filtro de fechas aplicado. Revisa si el resultado fue exacto o agregado.');
}

function fillDetectedDateRange() {
  const ranges = state.datasets.filter((d) => d.reportStart && d.reportEnd).map((d) => ({ start: d.reportStart, end: d.reportEnd }));
  if (!ranges.length) {
    alert('No se detecto un rango en los CSV procesados.');
    return;
  }
  let min = ranges[0].start;
  let max = ranges[0].end;
  ranges.forEach((r) => {
    if (r.start < min) min = r.start;
    if (r.end > max) max = r.end;
  });
  document.getElementById('dateFrom').value = dateISO(min);
  document.getElementById('dateTo').value = dateISO(max);
  applyDateFilter();
}

function googleSourceName(propertyId, siteUrl) {
  const propLabel = googleState.ga4Properties.find((p) => p.id === propertyId)?.label || '';
  const accountName = propLabel ? propLabel.split(' - ')[0].trim() : '';
  if (accountName) return accountName;
  const gscName = siteUrl ? siteUrl.replace(/^sc-domain:/i, '').replace(/^https?:\/\//i, '').replace(/\/$/, '') : '';
  return gscName || 'GoogleAnalytics';
}

async function processFromGoogle() {
  const propertyId = document.getElementById('ga4PropertySelect').value;
  const siteUrl = document.getElementById('gscSiteSelect').value;
  if (!propertyId && !siteUrl) {
    alert('Selecciona al menos una propiedad de GA4 o un sitio de Search Console.');
    return;
  }
  state.dataSourceName = googleSourceName(propertyId, siteUrl);
  readSettings();
  const dateFrom =
    state.settings.dateFrom ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    })();
  const dateTo = state.settings.dateTo || new Date().toISOString().slice(0, 10);
  const reportStart = parseReportDateToken(dateFrom);
  const reportEnd = parseReportDateToken(dateTo);
  setTop('Consultando Google Analytics / Search Console...');
  banner('warn', 'Consultando datos en vivo desde Google...');
  try {
    state.datasets = [];
    if (propertyId) {
      const ga4Datasets = await fetchAllGA4Datasets(propertyId, dateFrom, dateTo, reportStart, reportEnd);
      state.datasets.push(...ga4Datasets);
    }
    if (siteUrl) {
      const gscDataset = await fetchGSCDataset(siteUrl, dateFrom, dateTo, reportStart, reportEnd);
      state.datasets.push(gscDataset);
    }
    refreshModel();
    document.getElementById('exportBtn').disabled = selectedExportIds().length === 0;
    setTop(`${state.datasets.length} reportes obtenidos de Google - ${state.model.warnings.length} advertencia(s)`);
    banner(
      state.model.warnings.length ? 'warn' : 'ok',
      state.model.warnings.length
        ? `Datos de Google procesados con ${state.model.warnings.length} advertencia(s). El modulo Audiencias no se completa por esta via.`
        : 'Datos de Google procesados correctamente. El modulo Audiencias no se completa por esta via.'
    );
  } catch (err) {
    console.error(err);
    setTop('Error al consultar Google');
    banner('bad', 'No fue posible obtener los datos de Google: ' + esc(err.message || 'error desconocido'));
  }
}

function resetAll() {
  state.files = [];
  state.datasets = [];
  state.filteredDatasets = [];
  state.model = null;
  state.dataSourceName = '';
  document.getElementById('csvInput').value = '';
  document.getElementById('processBtn').disabled = true;
  document.getElementById('exportBtn').disabled = true;
  setTop('Sin datos cargados');
  banner('warn', 'Sin datos cargados. Selecciona los CSV y presiona Procesar.');
  ['kpis', 'userKpis', 'organicKpis', 'ga4Snapshot'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="empty">Sin datos.</div>';
  });
  [
    'channelDonut', 'channelBars', 'userComposition', 'sourceBars', 'audienceBars', 'audienceDonut',
    'pageBars', 'pageDonut', 'deviceDonut', 'osDonut', 'deviceDetailBars', 'browserBars', 'screenBars',
    'queryBars', 'queryScatter', 'genderDonut', 'regionBars', 'regionDonut', 'countryDonut', 'countryBars',
    'cityBars', 'trafficTrend', 'userChannelTrend', 'userDayHourHeatmap', 'userDayBars', 'userHourBars',
    'sessionsTrend', 'bounceTrend', 'userBreakdownTrend',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="empty">Sin datos.</div>';
  });
  [
    'trafficTrendFrom', 'trafficTrendTo', 'userChannelTrendFrom', 'userChannelTrendTo', 'userDayHourFrom',
    'userDayHourTo', 'sessionsTrendFrom', 'sessionsTrendTo', 'bounceTrendFrom', 'bounceTrendTo',
    'userBreakdownTrendFrom', 'userBreakdownTrendTo',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['regionCountrySelect', 'cityCountrySelect'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Todos los paises</option>';
  });
  const dhn = document.getElementById('userDayHourNote');
  if (dhn) dhn.innerHTML = 'Sin datos.';
  ['channelTable', 'sourceTable', 'audienceTable', 'pageTable', 'queryTable'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<table><tbody><tr><td>Sin datos.</td></tr></tbody></table>';
  });
  ['summaryChannel', 'summaryTech', 'summaryLocation', 'validation', 'fileCards'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="empty">Sin datos.</div>';
  });
  ['userVarianceNote', 'pageDataNote'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = 'Sin datos.';
  });
  updateExportSelection();
  restoreAllModules();
  renderAllAiInsightBlocks();
  setActiveNav('carga');
}

// Registro de acciones para los atributos data-action del HTML (reemplaza los onclick
// inline del archivo original).
const ACTIONS = {
  pickFiles,
  processDashboard,
  exportProcessedHTML: () => exportProcessedHTML(),
  resetAll,
  connectGoogle,
  disconnectGoogle,
  processFromGoogle,
  applyDateFilter,
  fillDetectedDateRange,
  setAllExportSectionsOn: () => setAllExportSections(true),
  setAllExportSectionsOff: () => setAllExportSections(false),
  expandModules: () => toggleAllAccordions(true),
  collapseModules: () => toggleAllAccordions(false),
  applyTrendRange: (el) => applyTrendRange(el.dataset.trendTarget),
  useFullTrendRange: (el) => useFullTrendRange(el.dataset.trendTarget),
  generateAiInsight: (el) => handleGenerateAiInsight(el),
};

function initActionDelegation() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = ACTIONS[el.dataset.action];
    if (action) action(el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = ACTIONS[el.dataset.action];
    if (action) action(el);
  });
}

function initCsvInput() {
  document.getElementById('csvInput').addEventListener('change', (e) => {
    state.files = [...e.target.files].filter((f) => /\.csv$/i.test(f.name));
    state.datasets = [];
    state.filteredDatasets = [];
    state.model = null;
    document.getElementById('processBtn').disabled = !state.files.length;
    document.getElementById('exportBtn').disabled = true;
    setTop(`${state.files.length} CSV seleccionado(s). Presiona Procesar.`);
    const totalBytes = state.files.reduce((s, f) => s + (f.size || 0), 0);
    if (totalBytes > 15 * 1024 * 1024) {
      banner('warn', `Archivos grandes (${(totalBytes / 1024 / 1024).toFixed(1)} MB en total). El procesamiento puede tardar varios segundos y la pestana podria no responder mientras tanto; evita cerrarla.`);
    }
    renderFileCards();
  });
}

function initDemographyFilters() {
  document.getElementById('regionCountrySelect')?.addEventListener('change', renderRegionFiltered);
  document.getElementById('cityCountrySelect')?.addEventListener('change', renderCityFiltered);
}

function init() {
  initTooltip();
  initExportChecks();
  initCardExportChecks();
  initActionDelegation();
  initTrendToggleDelegation();
  initCsvInput();
  initDemographyFilters();
  initNav();
  scheduleActiveNavSync();
  renderAllAiInsightBlocks();
}

document.addEventListener('DOMContentLoaded', init);
