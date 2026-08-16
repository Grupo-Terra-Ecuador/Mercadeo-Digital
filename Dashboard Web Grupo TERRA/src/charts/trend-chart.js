// Motor de graficas de tendencia (lineas SVG dibujadas a mano) + extraccion de series
// diarias a partir de los datasets cargados.
//
// Diferencia con el original: el toggle de series en la leyenda ya no usa un atributo
// onclick inline (`onclick="toggleTrendChannel(...)"`), sino atributos data-* leidos por
// un listener delegado (ver charts/trend-registry.js). Esto deja el HTML generado libre
// de JS inline, un prerrequisito para poder aplicar una Content-Security-Policy estricta.
import { esc, fmt, parseNum, hasMetricValue, parseReportDateToken, dateISO, dateLabel } from '../core/format.js';
import { bestCol } from '../core/csv/synonyms.js';
import { findRowDateCol } from '../core/csv/parse.js';
import { cleanRows } from '../core/model/aggregate.js';
import { CHART_COLORS } from './chart-utils.js';

// Mapa id-de-grafica -> Set de etiquetas ocultadas por el usuario (clic en la leyenda).
export const trendHidden = {};

export function isTrendHidden(id, label) {
  return !!trendHidden[id]?.has(label);
}

export function toggleTrendHidden(id, label) {
  const set = trendHidden[id] || (trendHidden[id] = new Set());
  if (set.has(label)) set.delete(label);
  else set.add(label);
}

export function extractDailySeries(datasets, labelKey, metricKey, { limit = 5, from = null, to = null, singleLabel = 'Valor' } = {}) {
  let best = null;
  let bestScore = -1;
  for (const d of datasets) {
    const dateCol = d.rowDateCol || findRowDateCol(d.columns);
    const labelCol = labelKey ? bestCol(d.columns, labelKey) : null;
    const metricCol = bestCol(d.columns, metricKey);
    if (!dateCol || (labelKey && !labelCol) || !metricCol) continue;
    let score = d.rows.length;
    if (!labelKey) {
      const uniqueDates = new Set(cleanRows(d).map((r) => r[dateCol])).size;
      if (uniqueDates && d.rows.length > uniqueDates * 1.2) score -= 1000000;
    }
    if (score > bestScore) {
      bestScore = score;
      best = { d, dateCol, labelCol, metricCol };
    }
  }
  if (!best) return null;
  const { d, dateCol, labelCol, metricCol } = best;
  const byDate = new Map();
  const totalsByLabel = new Map();
  cleanRows(d).forEach((r) => {
    const dt = parseReportDateToken(r[dateCol]);
    if (!dt) return;
    if (from && dt < from) return;
    if (to && dt > to) return;
    const iso = dateISO(dt);
    const label = labelCol ? String(r[labelCol] || '(sin dato)').trim() || '(sin dato)' : singleLabel;
    const val = hasMetricValue(r[metricCol]) ? parseNum(r[metricCol]) : 0;
    if (!byDate.has(iso)) byDate.set(iso, { date: dt, values: {} });
    const entry = byDate.get(iso);
    entry.values[label] = (entry.values[label] || 0) + val;
    totalsByLabel.set(label, (totalsByLabel.get(label) || 0) + val);
  });
  if (!byDate.size) return null;
  const dates = [...byDate.values()].sort((a, b) => a.date - b.date);
  const channels = [...totalsByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map((x) => x[0]);
  return { dates, channels };
}

export function extractMetricSeries(datasets, metricSpecs, { from = null, to = null } = {}) {
  let best = null;
  let bestScore = -1;
  for (const d of datasets) {
    const dateCol = d.rowDateCol || findRowDateCol(d.columns);
    if (!dateCol) continue;
    const cols = metricSpecs.map((spec) => bestCol(d.columns, spec.key));
    if (cols.some((c) => !c)) continue;
    let score = d.rows.length;
    const uniqueDates = new Set(cleanRows(d).map((r) => r[dateCol])).size;
    if (uniqueDates && d.rows.length > uniqueDates * 1.2) score -= 1000000;
    if (score > bestScore) {
      bestScore = score;
      best = { d, dateCol, cols };
    }
  }
  if (!best) return null;
  const { d, dateCol, cols } = best;
  const byDate = new Map();
  cleanRows(d).forEach((r) => {
    const dt = parseReportDateToken(r[dateCol]);
    if (!dt) return;
    if (from && dt < from) return;
    if (to && dt > to) return;
    const iso = dateISO(dt);
    if (!byDate.has(iso)) byDate.set(iso, { date: dt, values: {} });
    const entry = byDate.get(iso);
    metricSpecs.forEach((spec, i) => {
      const val = hasMetricValue(r[cols[i]]) ? parseNum(r[cols[i]]) : 0;
      entry.values[spec.label] = (entry.values[spec.label] || 0) + val;
    });
  });
  if (!byDate.size) return null;
  const dates = [...byDate.values()].sort((a, b) => a.date - b.date);
  return { dates, channels: metricSpecs.map((s) => s.label) };
}

export function extractUserBreakdownSeries(datasets, opts = {}) {
  const base = extractMetricSeries(
    datasets,
    [{ key: 'users', label: 'Usuarios totales' }, { key: 'newUsers', label: 'Usuarios nuevos' }],
    opts
  );
  if (!base) return null;
  base.dates.forEach((d) => {
    const total = d.values['Usuarios totales'] || 0;
    const nuevos = d.values['Usuarios nuevos'] || 0;
    d.values['Usuarios recurrentes'] = Math.max(0, total - nuevos);
  });
  base.channels = ['Usuarios totales', 'Usuarios nuevos', 'Usuarios recurrentes'];
  return base;
}

export function fullDateRangeOfDatasets(datasets) {
  let min = null;
  let max = null;
  datasets.forEach((d) => {
    const dateCol = d.rowDateCol || findRowDateCol(d.columns);
    if (!dateCol) return;
    cleanRows(d).forEach((r) => {
      const dt = parseReportDateToken(r[dateCol]);
      if (!dt) return;
      if (!min || dt < min) min = dt;
      if (!max || dt > max) max = dt;
    });
  });
  return { min, max };
}

export function renderTrendChart(
  id,
  series,
  {
    metric = 'usuarios',
    formatter = fmt,
    showTotal = true,
    aggregate = 'sum',
    empty = 'No hay datos con desglose diario disponibles. Conecta tu cuenta de Google o sube un CSV que incluya la columna Fecha para ver esta grafica.',
  } = {}
) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!series || !series.dates.length) {
    el.innerHTML = `<div class="empty chart-empty">${esc(empty)}</div>`;
    return;
  }
  const hidden = trendHidden[id] || (trendHidden[id] = new Set());
  const { dates, channels } = series;
  const n = dates.length;
  const totals = dates.map((d) => channels.reduce((s, c) => s + (d.values[c] || 0), 0));
  const maxVal = Math.max(...totals, ...dates.flatMap((d) => channels.map((c) => d.values[c] || 0))) || 1;
  const W = 860;
  const H = 280;
  const padL = 46;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i) => (n <= 1 ? padL + innerW / 2 : padL + (innerW * i) / (n - 1));
  const y = (v) => padT + innerH - (v / maxVal) * innerH;
  const pathFor = (vals) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  let lines = '';
  if (showTotal && !hidden.has('Total')) {
    lines += `<path d="${pathFor(totals)}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5,4"/>`;
  }
  channels.forEach((c, ci) => {
    if (hidden.has(c)) return;
    lines += `<path d="${pathFor(dates.map((d) => d.values[c] || 0))}" fill="none" stroke="${CHART_COLORS[ci % CHART_COLORS.length]}" stroke-width="2.25"/>`;
  });

  const gridVals = [0, maxVal / 2, maxVal];
  const grid = gridVals
    .map(
      (v) =>
        `<line x1="${padL}" x2="${W - padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--border)" stroke-width="1"/><text x="${padL - 8}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--muted2)">${esc(formatter(v))}</text>`
    )
    .join('');

  const labelCount = Math.min(6, n);
  const step = Math.max(1, Math.round((n - 1) / (labelCount - 1 || 1)));
  let xlabels = '';
  for (let i = 0; i < n; i += step) {
    xlabels += `<text x="${x(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="var(--muted2)">${esc(dateLabel(dates[i].date).slice(5))}</text>`;
  }
  if ((n - 1) % step !== 0) {
    xlabels += `<text x="${x(n - 1).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="var(--muted2)">${esc(dateLabel(dates[n - 1].date).slice(5))}</text>`;
  }

  const bandW = n > 1 ? innerW / (n - 1) : innerW;
  let hover = '';
  dates.forEach((d, i) => {
    const tipLines = [dateLabel(d.date)];
    if (showTotal && !hidden.has('Total')) tipLines.push(`Total: ${formatter(totals[i])} ${metric}`);
    channels.forEach((c) => {
      if (!hidden.has(c)) tipLines.push(`${c}: ${formatter(d.values[c] || 0)}`);
    });
    hover += `<rect class="trend-hover tip" data-tip="${esc(tipLines.join('\n'))}" x="${(x(i) - bandW / 2).toFixed(1)}" y="${padT}" width="${bandW.toFixed(1)}" height="${innerH}" fill="transparent"/>`;
  });

  const svg = `<svg viewBox="0 0 ${W} ${H}" class="trend-svg" preserveAspectRatio="none">${grid}${lines}${xlabels}${hover}</svg>`;

  const legendItems = (showTotal ? [{ label: 'Total', color: 'var(--muted)' }] : []).concat(
    channels.map((c, ci) => ({ label: c, color: CHART_COLORS[ci % CHART_COLORS.length] }))
  );
  const legend = `<div class="legend" style="max-height:none">${legendItems
    .map((li) => {
      const off = hidden.has(li.label);
      const vals = li.label === 'Total' ? totals : dates.map((d) => d.values[li.label] || 0);
      const total = aggregate === 'avg' ? (vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0) : vals.reduce((s, v) => s + v, 0);
      const totalWord = aggregate === 'avg' ? 'Promedio' : 'Total';
      return `<div class="legend-item trend-toggle${off ? ' legend-off' : ''} tip" data-tip="${esc(li.label)}: ${esc(formatter(total))} ${esc(metric)} (${totalWord.toLowerCase()} del periodo mostrado). Clic para ${off ? 'mostrar' : 'ocultar'} esta serie en la grafica." data-trend-id="${esc(id)}" data-trend-label="${esc(li.label)}"><span class="legend-swatch" style="background:${li.color}"></span><span class="legend-label">${esc(li.label)}</span><span class="legend-value">${esc(formatter(total))}</span></div>`;
    })
    .join('')}</div>`;

  el.innerHTML = `<div class="trend-wrap">${svg}</div>${legend}<div class="scale-note"><span class="tipi">i</span> Clic en cualquier elemento de la leyenda para mostrarlo u ocultarlo en la grafica.</div>`;
}
