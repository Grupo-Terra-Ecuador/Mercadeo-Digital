import { esc, fmt, pct } from '../core/format.js';
import { CHART_COLORS, metricTotal, chartTooltip } from './chart-utils.js';

export function renderDonutChart(id, data, { metric = 'usuarios', formatter = fmt, maxSegments = 8, centerLabel = 'Total' } = {}) {
  const raw = (data || []).filter((x) => x && Number(x.value) > 0);
  const el = document.getElementById(id);
  if (!el) return;
  if (!raw.length) {
    el.innerHTML = '<div class="empty chart-empty">No se encontraron valores medibles.</div>';
    return;
  }
  const total = metricTotal(raw);
  const top = raw.slice(0, maxSegments);
  const rest = raw.slice(maxSegments).reduce((s, x) => s + x.value, 0);
  const parts = rest > 0 ? [...top, { label: 'Otros', value: rest }] : top;
  let angle = 0;
  const segments = parts
    .map((x, i) => {
      const start = angle;
      const end = angle + (x.value / total) * 360;
      angle = end;
      return `${CHART_COLORS[i % CHART_COLORS.length]} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    })
    .join(',');
  const legend = parts
    .map(
      (x, i) =>
        `<div class="legend-item tip" data-tip="${esc(chartTooltip(x.label, x.value, total, metric, formatter))}"><span class="legend-swatch" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span><span class="legend-label" title="${esc(x.label)}">${esc(x.label)}</span><span class="legend-value">${formatter(x.value)}<small>${pct(x.value / total)}</small></span></div>`
    )
    .join('');
  const restNote = rest > 0
    ? `${raw.length - maxSegments} categorias adicionales se agruparon en "Otros".`
    : 'Todas las categorias estan representadas.';
  el.innerHTML = `<div class="donut-layout"><div class="donut-wrap"><div class="donut" style="--segments:${segments}"><div class="donut-center"><b>${formatter(total)}</b><span>${esc(centerLabel)}</span></div></div></div><div class="legend">${legend}</div></div><div class="scale-note"><span class="tipi">i</span> Cada angulo equivale a su porcentaje del total. ${restNote}</div>`;
}
