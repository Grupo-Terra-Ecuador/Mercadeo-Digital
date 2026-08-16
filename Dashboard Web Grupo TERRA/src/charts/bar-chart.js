import { esc, fmt, pct } from '../core/format.js';
import { metricTotal, chartTooltip } from './chart-utils.js';

export function renderBarChart(
  id,
  data,
  {
    metric = 'usuarios',
    formatter = fmt,
    limit = Infinity,
    empty = 'No se encontraron valores medibles.',
    valueHTML = null,
    tooltipBuilder = null,
    scrollClass = '',
    showTotal = true,
  } = {}
) {
  const all = (data || []).filter((x) => x && Number(x.value) > 0);
  const arr = all.slice(0, limit);
  const total = metricTotal(all);
  const max = Math.max(0, ...arr.map((x) => Number(x.value || 0)));
  const el = document.getElementById(id);
  if (!el) return;
  if (!arr.length) {
    el.innerHTML = `<div class="empty">${esc(empty)}</div>`;
    return;
  }
  const rows = arr
    .map((x) => {
      const tooltip = tooltipBuilder ? tooltipBuilder(x, total) : chartTooltip(x.label, x.value, total, metric, formatter);
      const value = valueHTML ? valueHTML(x) : `${formatter(x.value)}<small>${pct(total ? x.value / total : 0)}</small>`;
      const width = max ? Math.max(1.5, (x.value / max) * 100) : 0;
      return `<div class="barrow tip" data-tip="${esc(tooltip)}"><div class="barlabel" title="${esc(x.label)}">${esc(x.label)}</div><div class="bartrack"><div class="barfill" style="width:${width}%"></div></div><div class="barval">${value}</div></div>`;
    })
    .join('');
  const note = showTotal
    ? `<div class="scale-note"><span class="tipi">i</span> Escala relativa: barra maxima = ${formatter(max)} ${esc(metric)} - Total representado = ${formatter(total)}.</div>`
    : `<div class="scale-note"><span class="tipi">i</span> Escala relativa al valor mas alto de ${esc(metric)} en el conjunto visible.</div>`;
  el.innerHTML = `<div class="chart-scroll${scrollClass ? ' ' + scrollClass : ''}"><div class="barlist rich">${rows}</div></div>${note}`;
}
