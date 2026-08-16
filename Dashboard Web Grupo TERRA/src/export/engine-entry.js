// Entry point del bundle "motor de exportacion": el codigo interactivo minimo que necesita
// el HTML exportado para seguir funcionando fuera de la app (tooltips, navegacion, graficas
// de tendencia con su selector de rango, mapa de calor y filtros de pais en Demografia).
//
// A diferencia del original (que reinyectaba ~35 funciones vivas via `fn.toString()`, algo
// que se rompe si el codigo pasa por un minificador), este archivo se compila con Vite en
// un build separado (ver vite.export-engine.config.js) a un unico archivo IIFE
// autocontenido. El HTML exportado no reconstruye funciones desde texto: simplemente carga
// ese archivo ya compilado. Reutiliza los mismos modulos que usa la app en vivo (ningun
// codigo esta duplicado), asi que un cambio en, por ejemplo, charts/trend-chart.js se
// refleja automaticamente tanto en la app como en los HTML exportados.
import { state } from '../state.js';
import { initTooltip } from '../ui/tooltip.js';
import { initNav } from '../ui/nav.js';
import { toggleAllAccordions } from '../ui/export-selection.js';
import { applyTrendRange, useFullTrendRange, initTrendToggleDelegation } from '../charts/trend-registry.js';
import { renderRegionFiltered, renderCityFiltered } from '../sections/demografia.js';

// Importar estos modulos ejecuta, a nivel de archivo, sus llamadas registerTrendChart(...),
// dejando el registro de graficas de tendencia listo antes de init().
import '../sections/resumen.js';
import '../sections/trafico.js';
import '../sections/usuarios.js';

const TREND_CHART_IDS = ['trafficTrend', 'sessionsTrend', 'bounceTrend', 'userChannelTrend', 'userDayHour', 'userBreakdownTrend'];

function initTrendControls() {
  document.querySelectorAll('[data-action="applyTrendRange"]').forEach((el) => {
    el.addEventListener('change', () => applyTrendRange(el.dataset.trendTarget));
  });
  document.querySelectorAll('[data-action="useFullTrendRange"]').forEach((el) => {
    el.addEventListener('click', () => useFullTrendRange(el.dataset.trendTarget));
  });
}

function initAccordionControls() {
  document.querySelectorAll('[data-action="expandModules"]').forEach((el) => el.addEventListener('click', () => toggleAllAccordions(true)));
  document.querySelectorAll('[data-action="collapseModules"]').forEach((el) => el.addEventListener('click', () => toggleAllAccordions(false)));
}

function initDemographyFilters() {
  document.getElementById('regionCountrySelect')?.addEventListener('change', renderRegionFiltered);
  document.getElementById('cityCountrySelect')?.addEventListener('change', renderCityFiltered);
}

function renderInitialCharts() {
  TREND_CHART_IDS.forEach((id) => {
    if (document.getElementById(id)) applyTrendRange(id);
  });
  if (document.getElementById('regionBars')) renderRegionFiltered();
  if (document.getElementById('cityBars')) renderCityFiltered();
}

// Export ES real (no una asignacion manual a window): Vite en modo IIFE (ver
// vite.export-engine.config.js, build.lib.name='TerraExportEngine') es quien expone esto
// como window.TerraExportEngine = { init }. Asignarlo a mano aqui ademas del mecanismo de
// Vite haria que el `var TerraExportEngine = (funcion IIFE)(...)` que Vite genera
// sobrescribiera la asignacion manual con el objeto de exports (vacio) al terminar de
// ejecutar el modulo.
export function init(datasets) {
  state.datasets = Array.isArray(datasets) ? datasets : [];
  state.filteredDatasets = state.datasets;
  initTooltip();
  initNav();
  initTrendToggleDelegation();
  initTrendControls();
  initAccordionControls();
  initDemographyFilters();
  renderInitialCharts();
}
