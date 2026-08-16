// Utilidades compartidas por los distintos tipos de grafico (barras, donut, tendencias).
import { fmt, pct } from '../core/format.js';

export const CHART_COLORS = [
  '#ff7900', '#60a5fa', '#22c55e', '#a78bfa', '#f59e0b', '#ef4444',
  '#14b8a6', '#f472b6', '#84cc16', '#38bdf8', '#fb7185', '#c084fc',
];

export function metricTotal(data) {
  return (data || []).reduce((s, x) => s + Number(x?.value || 0), 0);
}

export function chartTooltip(label, value, total, metric, formatter = fmt) {
  return `${label}: ${formatter(value)} ${metric}. Participacion: ${pct(total ? value / total : 0)}. Escala calculada con un total de ${formatter(total)} ${metric}.`;
}
