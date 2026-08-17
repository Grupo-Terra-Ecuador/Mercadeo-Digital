// Grafico de dona via conic-gradient (igual tecnica que el original). Opera sobre un
// contenedor del DOM por id para reutilizarse igual en la app en vivo y en el motor de
// exportacion standalone.
import { esc, fmt, pct } from "../core/format";
import { CHART_COLORS, metricTotal, chartTooltip } from "./chart-utils";
import type { AggregateItem } from "../core/types";

export interface DonutChartOptions {
  metric?: string;
  formatter?: (n: number) => string;
  maxSegments?: number;
  centerLabel?: string;
}

export function buildDonutChartHtml(
  data: AggregateItem[] | null | undefined,
  { metric = "usuarios", formatter = fmt, maxSegments = 8, centerLabel = "Total" }: DonutChartOptions = {}
): string {
  const raw = (data || []).filter((x) => x && Number(x.value) > 0);
  if (!raw.length) {
    return `<div class="grid min-h-[220px] place-items-center rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2">No se encontraron valores medibles.</div>`;
  }
  const total = metricTotal(raw);
  const top = raw.slice(0, maxSegments);
  const rest = raw.slice(maxSegments).reduce((s, x) => s + x.value, 0);
  const parts = rest > 0 ? [...top, { label: "Otros", value: rest }] : top;
  let angle = 0;
  const segments = parts
    .map((x, i) => {
      const start = angle;
      const end = angle + (x.value / total) * 360;
      angle = end;
      return `${CHART_COLORS[i % CHART_COLORS.length]} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    })
    .join(",");
  const legend = parts
    .map(
      (x, i) =>
        `<div class="grid grid-cols-[10px_minmax(0,1fr)_auto] flex-[1_1_235px] min-w-[220px] cursor-help items-center gap-2 rounded-[10px] border border-border-2/55 bg-white/[0.022] px-2.5 py-2" data-tip="${esc(chartTooltip(x.label, x.value, total, metric, formatter))}"><span class="h-[9px] w-[9px] rounded-[3px]" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span><span class="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted" title="${esc(x.label)}">${esc(x.label)}</span><span class="text-right text-[11px] font-extrabold text-text">${formatter(x.value)}<small class="mt-[3px] block text-[9px] font-bold text-muted-2">${pct(x.value / total)}</small></span></div>`
    )
    .join("");
  const restNote = rest > 0 ? `${raw.length - maxSegments} categorias adicionales se agruparon en "Otros".` : "Todas las categorias estan representadas.";
  return `<div class="grid grid-cols-[minmax(170px,220px)_1fr] items-center gap-4 max-[1050px]:grid-cols-1"><div class="grid min-h-[220px] place-items-center max-[1050px]:min-h-[205px]"><div class="relative h-[190px] w-[190px] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)] max-[720px]:h-[165px] max-[720px]:w-[165px]" style="background:conic-gradient(${segments})"><div class="absolute inset-[31px] rounded-full border border-border bg-surface max-[720px]:inset-[28px]"></div><div class="absolute inset-0 z-[2] grid place-content-center pointer-events-none text-center"><b class="text-2xl leading-none text-text">${formatter(total)}</b><span class="mt-1 block text-[10px] uppercase tracking-wide text-muted-2">${esc(centerLabel)}</span></div></div></div><div class="scrollbar-terra flex max-h-[275px] flex-wrap content-start gap-2 overflow-auto pr-0.5">${legend}</div></div><div class="mt-2.5 flex items-center gap-1.5 border-t border-border-2/55 pt-[9px] text-[10px] text-muted-2"><span class="inline-grid h-3.5 w-3.5 place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2">i</span> Cada angulo equivale a su porcentaje del total. ${restNote}</div>`;
}

export function renderDonutChart(id: string, data: AggregateItem[] | null | undefined, opts: DonutChartOptions = {}): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = buildDonutChartHtml(data, opts);
}
