// Grafico de barras horizontal (HTML generado a mano con clases de Tailwind), igual que en
// el proyecto original: opera directamente sobre un contenedor del DOM por id, para poder
// reutilizarse sin cambios tanto desde la app en vivo (React) como desde el motor de
// exportacion standalone (ver lib/export/engine-entry.ts).
import { esc, fmt, pct } from "../core/format";
import { metricTotal, chartTooltip } from "./chart-utils";
import type { AggregateItem } from "../core/types";

export interface BarChartOptions {
  metric?: string;
  formatter?: (n: number) => string;
  limit?: number;
  empty?: string;
  valueHTML?: ((x: AggregateItem) => string) | null;
  tooltipBuilder?: ((x: AggregateItem, total: number) => string) | null;
  scrollClass?: string;
  showTotal?: boolean;
}

export function buildBarChartHtml(
  data: AggregateItem[] | null | undefined,
  {
    metric = "usuarios",
    formatter = fmt,
    limit = Infinity,
    empty = "No se encontraron valores medibles.",
    valueHTML = null,
    tooltipBuilder = null,
    scrollClass = "",
    showTotal = true,
  }: BarChartOptions = {}
): string {
  const all = (data || []).filter((x) => x && Number(x.value) > 0);
  const arr = all.slice(0, limit);
  const total = metricTotal(all);
  const max = Math.max(0, ...arr.map((x) => Number(x.value || 0)));
  if (!arr.length) {
    return `<div class="rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2">${esc(empty)}</div>`;
  }
  const rows = arr
    .map((x) => {
      const tooltip = tooltipBuilder ? tooltipBuilder(x, total) : chartTooltip(x.label, x.value, total, metric, formatter);
      const value = valueHTML
        ? valueHTML(x)
        : `${formatter(x.value)}<small class="mt-[3px] block text-[10px] font-bold text-muted-2">${pct(total ? x.value / total : 0)}</small>`;
      const width = max ? Math.max(1.5, (x.value / max) * 100) : 0;
      return `<div class="grid cursor-help grid-cols-[minmax(125px,210px)_1fr_minmax(92px,120px)] items-center gap-2.5" data-tip="${esc(tooltip)}"><div class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted" title="${esc(x.label)}">${esc(x.label)}</div><div class="h-2 overflow-hidden rounded-full bg-border-2"><div class="h-full min-w-[2px] rounded-full bg-gradient-to-r from-orange to-orange-2" style="width:${width}%"></div></div><div class="text-right text-xs font-extrabold leading-[1.15] text-muted">${value}</div></div>`;
    })
    .join("");
  const note = showTotal
    ? `<div class="mt-2.5 flex items-center gap-1.5 border-t border-border-2/55 pt-[9px] text-[10px] text-muted-2"><span class="inline-grid h-3.5 w-3.5 place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2">i</span> Escala relativa: barra maxima = ${formatter(max)} ${esc(metric)} - Total representado = ${formatter(total)}.</div>`
    : `<div class="mt-2.5 flex items-center gap-1.5 border-t border-border-2/55 pt-[9px] text-[10px] text-muted-2"><span class="inline-grid h-3.5 w-3.5 place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2">i</span> Escala relativa al valor mas alto de ${esc(metric)} en el conjunto visible.</div>`;
  return `<div class="scrollbar-terra${scrollClass ? " " + scrollClass : ""} overflow-auto pr-[5px]"><div class="grid gap-2.5">${rows}</div></div>${note}`;
}

export function renderBarChart(id: string, data: AggregateItem[] | null | undefined, opts: BarChartOptions = {}): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = buildBarChartHtml(data, opts);
}
