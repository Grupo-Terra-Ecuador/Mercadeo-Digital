import { esc, fmt, parseNum, hasMetricValue, parseReportDateToken } from '../core/format.js';
import { bestCol } from '../core/csv/synonyms.js';
import { findRowDateCol } from '../core/csv/parse.js';
import { cleanRows } from '../core/model/aggregate.js';

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
export const DAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function extractDayHourBalance(datasets, { from = null, to = null } = {}) {
  let best = null;
  let bestScore = -1;
  for (const d of datasets) {
    const dateCol = d.rowDateCol || findRowDateCol(d.columns);
    const dayCol = bestCol(d.columns, 'dayOfWeek');
    const hourCol = bestCol(d.columns, 'hour');
    const metricCol = bestCol(d.columns, 'users') || bestCol(d.columns, 'sessions');
    if (!dateCol || !dayCol || !hourCol || !metricCol) continue;
    const score = d.rows.length;
    if (score > bestScore) {
      bestScore = score;
      best = { d, dateCol, dayCol, hourCol, metricCol };
    }
  }
  if (!best) return null;
  const { d, dateCol, dayCol, hourCol, metricCol } = best;
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  const dayTotals = Array(7).fill(0);
  const hourTotals = Array(24).fill(0);
  let any = false;
  cleanRows(d).forEach((r) => {
    const dt = parseReportDateToken(r[dateCol]);
    if (!dt) return;
    if (from && dt < from) return;
    if (to && dt > to) return;
    const dayRaw = parseInt(r[dayCol], 10);
    const hourRaw = parseInt(r[hourCol], 10);
    if (isNaN(dayRaw) || isNaN(hourRaw) || dayRaw < 0 || dayRaw > 6 || hourRaw < 0 || hourRaw > 23) return;
    const val = hasMetricValue(r[metricCol]) ? parseNum(r[metricCol]) : 0;
    grid[dayRaw][hourRaw] += val;
    dayTotals[dayRaw] += val;
    hourTotals[hourRaw] += val;
    any = true;
  });
  return any ? { grid, dayTotals, hourTotals } : null;
}

export function renderDayHourHeatmap(id, balance, { metric = 'usuarios', formatter = fmt } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!balance) {
    el.innerHTML =
      '<div class="empty chart-empty">No hay datos de hora/dia disponibles todavia. Esta vista requiere datos horarios de Google Analytics dentro del rango seleccionado arriba.</div>';
    return;
  }
  const { grid } = balance;
  const max = Math.max(1, ...grid.flat());
  let html = '<div class="heatmap-wrap"><div class="heatmap-grid"><div></div>';
  for (let h = 0; h < 24; h++) html += `<div class="heatmap-hour-label">${h}</div>`;
  DAY_DISPLAY_ORDER.forEach((dIdx) => {
    html += `<div class="heatmap-day-label">${DAY_NAMES_SHORT[dIdx]}</div>`;
    for (let h = 0; h < 24; h++) {
      const v = grid[dIdx][h];
      const intensity = max ? v / max : 0;
      html += `<div class="heatmap-cell tip" style="background:rgba(255,121,0,${(0.06 + intensity * 0.88).toFixed(2)})" data-tip="${esc(DAY_NAMES[dIdx])}, ${String(h).padStart(2, '0')}:00 h - ${esc(formatter(v))} ${esc(metric)}"></div>`;
    }
  });
  html += '</div></div>';
  el.innerHTML = html;
}
