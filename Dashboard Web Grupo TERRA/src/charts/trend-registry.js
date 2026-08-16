// Registro de graficas de tendencia: cada modulo de seccion (trafico.js, usuarios.js...)
// registra su(s) grafica(s) aqui para que los controles de rango de fecha (compartidos)
// y el toggle de leyenda sepan a que funcion de render llamar.
import { parseReportDateToken, dateISO } from '../core/format.js';
import { state } from '../state.js';
import { fullDateRangeOfDatasets, toggleTrendHidden } from './trend-chart.js';

const trendCharts = {};

export function registerTrendChart(id, type, render) {
  trendCharts[id] = { type, render };
}

export function readTrendRange(id) {
  const fromEl = document.getElementById(id + 'From');
  const toEl = document.getElementById(id + 'To');
  return {
    from: fromEl && fromEl.value ? parseReportDateToken(fromEl.value) : null,
    to: toEl && toEl.value ? parseReportDateToken(toEl.value) : null,
  };
}

export function applyTrendRange(id) {
  const cfg = trendCharts[id];
  if (cfg) cfg.render();
}

export function useFullTrendRange(id) {
  const cfg = trendCharts[id];
  if (!cfg) return;
  const src = state.datasets.filter((d) => d.type === cfg.type);
  const { min, max } = fullDateRangeOfDatasets(src);
  const fromEl = document.getElementById(id + 'From');
  const toEl = document.getElementById(id + 'To');
  if (min && max) {
    fromEl.value = dateISO(min);
    toEl.value = dateISO(max);
  } else {
    fromEl.value = '';
    toEl.value = '';
  }
  cfg.render();
}

// Delegado unico (no listeners por item) para el clic de "mostrar/ocultar serie" en la
// leyenda de las graficas de tendencia. Sustituye el atributo onclick inline del original.
export function initTrendToggleDelegation() {
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.legend-item.trend-toggle');
    if (!item) return;
    const { trendId, trendLabel } = item.dataset;
    if (!trendId || trendLabel == null) return;
    toggleTrendHidden(trendId, trendLabel);
    const cfg = trendCharts[trendId];
    if (cfg) cfg.render();
  });
}
