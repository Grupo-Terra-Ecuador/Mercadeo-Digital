// Motor de graficas de tendencia (lineas SVG dibujadas a mano) + extraccion de series
// diarias a partir de los datasets cargados.
//
// El toggle de series en la leyenda usa atributos data-* leidos por un listener delegado
// (ver lib/charts/trend-registry.ts) en vez de handlers inline, para no depender de JS
// inline en el HTML exportado.
import { esc, fmt, parseNum, hasMetricValue, parseReportDateToken, dateISO, dateLabel } from "../core/format";
import { bestCol } from "../core/csv/synonyms";
import { findRowDateCol } from "../core/csv/parse";
import { cleanRows } from "../core/model/aggregate";
import { CHART_COLORS } from "./chart-utils";
import type { Dataset, SynonymKey } from "../core/types";

// Mapa id-de-grafica -> Set de etiquetas ocultadas por el usuario (clic en la leyenda).
export const trendHidden: Record<string, Set<string>> = {};

export function isTrendHidden(id: string, label: string): boolean {
  return !!trendHidden[id]?.has(label);
}

export function toggleTrendHidden(id: string, label: string): void {
  const set = trendHidden[id] || (trendHidden[id] = new Set());
  if (set.has(label)) set.delete(label);
  else set.add(label);
}

export interface DailyPoint {
  date: Date;
  values: Record<string, number>;
}

export interface DailySeries {
  dates: DailyPoint[];
  channels: string[];
}

export function extractDailySeries(
  datasets: Dataset[],
  labelKey: SynonymKey | null,
  metricKey: SynonymKey,
  { limit = 5, from = null, to = null, singleLabel = "Valor" }: { limit?: number; from?: Date | null; to?: Date | null; singleLabel?: string } = {}
): DailySeries | null {
  let best: { d: Dataset; dateCol: string; labelCol: string | null; metricCol: string } | null = null;
  let bestScore = -Infinity;
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
  const byDate = new Map<string, DailyPoint>();
  const totalsByLabel = new Map<string, number>();
  cleanRows(d).forEach((r) => {
    const dt = parseReportDateToken(r[dateCol]);
    if (!dt) return;
    if (from && dt < from) return;
    if (to && dt > to) return;
    const iso = dateISO(dt);
    const label = labelCol ? String(r[labelCol] || "(sin dato)").trim() || "(sin dato)" : singleLabel;
    const val = hasMetricValue(r[metricCol]) ? parseNum(r[metricCol]) : 0;
    if (!byDate.has(iso)) byDate.set(iso, { date: dt, values: {} });
    const entry = byDate.get(iso)!;
    entry.values[label] = (entry.values[label] || 0) + val;
    totalsByLabel.set(label, (totalsByLabel.get(label) || 0) + val);
  });
  if (!byDate.size) return null;
  const dates = [...byDate.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  const channels = [...totalsByLabel.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map((x) => x[0]);
  return { dates, channels };
}

export function extractMetricSeries(
  datasets: Dataset[],
  metricSpecs: { key: SynonymKey; label: string }[],
  { from = null, to = null }: { from?: Date | null; to?: Date | null } = {}
): DailySeries | null {
  let best: { d: Dataset; dateCol: string; cols: (string | null)[] } | null = null;
  let bestScore = -Infinity;
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
  const byDate = new Map<string, DailyPoint>();
  cleanRows(d).forEach((r) => {
    const dt = parseReportDateToken(r[dateCol]);
    if (!dt) return;
    if (from && dt < from) return;
    if (to && dt > to) return;
    const iso = dateISO(dt);
    if (!byDate.has(iso)) byDate.set(iso, { date: dt, values: {} });
    const entry = byDate.get(iso)!;
    metricSpecs.forEach((spec, i) => {
      const col = cols[i];
      const val = col && hasMetricValue(r[col]) ? parseNum(r[col]) : 0;
      entry.values[spec.label] = (entry.values[spec.label] || 0) + val;
    });
  });
  if (!byDate.size) return null;
  const dates = [...byDate.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  return { dates, channels: metricSpecs.map((s) => s.label) };
}

export function extractUserBreakdownSeries(datasets: Dataset[], opts: { from?: Date | null; to?: Date | null } = {}): DailySeries | null {
  const base = extractMetricSeries(
    datasets,
    [
      { key: "users", label: "Usuarios totales" },
      { key: "newUsers", label: "Usuarios nuevos" },
    ],
    opts
  );
  if (!base) return null;
  base.dates.forEach((d) => {
    const total = d.values["Usuarios totales"] || 0;
    const nuevos = d.values["Usuarios nuevos"] || 0;
    d.values["Usuarios recurrentes"] = Math.max(0, total - nuevos);
  });
  base.channels = ["Usuarios totales", "Usuarios nuevos", "Usuarios recurrentes"];
  return base;
}

export function fullDateRangeOfDatasets(datasets: Dataset[]): { min: Date | null; max: Date | null } {
  let min: Date | null = null;
  let max: Date | null = null;
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

export interface TrendChartOptions {
  metric?: string;
  formatter?: (n: number) => string;
  showTotal?: boolean;
  aggregate?: "sum" | "avg";
  empty?: string;
}

export function buildTrendChartHtml(
  id: string,
  series: DailySeries | null,
  {
    metric = "usuarios",
    formatter = fmt,
    showTotal = true,
    aggregate = "sum",
    empty = "No hay datos con desglose diario disponibles. Conecta tu cuenta de Google o sube un CSV que incluya la columna Fecha para ver esta grafica.",
  }: TrendChartOptions = {}
): string {
  if (!series || !series.dates.length) {
    return `<div class="grid min-h-[220px] place-items-center rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2">${esc(empty)}</div>`;
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
  const x = (i: number) => (n <= 1 ? padL + innerW / 2 : padL + (innerW * i) / (n - 1));
  const y = (v: number) => padT + innerH - (v / maxVal) * innerH;
  const pathFor = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  let lines = "";
  if (showTotal && !hidden.has("Total")) {
    lines += `<path d="${pathFor(totals)}" fill="none" stroke="var(--color-muted)" stroke-width="2" stroke-dasharray="5,4"/>`;
  }
  channels.forEach((c, ci) => {
    if (hidden.has(c)) return;
    lines += `<path d="${pathFor(dates.map((d) => d.values[c] || 0))}" fill="none" stroke="${CHART_COLORS[ci % CHART_COLORS.length]}" stroke-width="2.25"/>`;
  });

  const gridVals = [0, maxVal / 2, maxVal];
  const grid = gridVals
    .map(
      (v) =>
        `<line x1="${padL}" x2="${W - padR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--color-border)" stroke-width="1"/><text x="${padL - 8}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--color-muted-2)">${esc(formatter(v))}</text>`
    )
    .join("");

  const labelCount = Math.min(6, n);
  const step = Math.max(1, Math.round((n - 1) / (labelCount - 1 || 1)));
  let xlabels = "";
  for (let i = 0; i < n; i += step) {
    xlabels += `<text x="${x(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="var(--color-muted-2)">${esc(dateLabel(dates[i].date).slice(5))}</text>`;
  }
  if ((n - 1) % step !== 0) {
    xlabels += `<text x="${x(n - 1).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="var(--color-muted-2)">${esc(dateLabel(dates[n - 1].date).slice(5))}</text>`;
  }

  const bandW = n > 1 ? innerW / (n - 1) : innerW;
  let hover = "";
  dates.forEach((d, i) => {
    const tipLines = [dateLabel(d.date)];
    if (showTotal && !hidden.has("Total")) tipLines.push(`Total: ${formatter(totals[i])} ${metric}`);
    channels.forEach((c) => {
      if (!hidden.has(c)) tipLines.push(`${c}: ${formatter(d.values[c] || 0)}`);
    });
    hover += `<rect class="cursor-crosshair hover:fill-white/5" data-tip="${esc(tipLines.join("\n"))}" x="${(x(i) - bandW / 2).toFixed(1)}" y="${padT}" width="${bandW.toFixed(1)}" height="${innerH}" fill="transparent"/>`;
  });

  const svg = `<svg viewBox="0 0 ${W} ${H}" class="block h-[260px] w-full min-w-[520px]" preserveAspectRatio="none">${grid}${lines}${xlabels}${hover}</svg>`;

  const legendItems = (showTotal ? [{ label: "Total", color: "var(--color-muted)" }] : []).concat(
    channels.map((c, ci) => ({ label: c, color: CHART_COLORS[ci % CHART_COLORS.length] }))
  );
  const legend = `<div class="flex flex-wrap gap-2">${legendItems
    .map((li) => {
      const off = hidden.has(li.label);
      const vals = li.label === "Total" ? totals : dates.map((d) => d.values[li.label] || 0);
      const total = aggregate === "avg" ? (vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0) : vals.reduce((s, v) => s + v, 0);
      const totalWord = aggregate === "avg" ? "Promedio" : "Total";
      return `<div class="grid grid-cols-[10px_minmax(0,1fr)_auto] flex-[1_1_235px] min-w-[220px] cursor-pointer items-center gap-2 rounded-[10px] border border-border-2/55 bg-white/[0.022] px-2.5 py-2${off ? " opacity-40" : ""}" data-tip="${esc(li.label)}: ${esc(formatter(total))} ${esc(metric)} (${totalWord.toLowerCase()} del periodo mostrado). Clic para ${off ? "mostrar" : "ocultar"} esta serie en la grafica." data-trend-id="${esc(id)}" data-trend-label="${esc(li.label)}"><span class="h-[9px] w-[9px] rounded-[3px]" style="background:${li.color}"></span><span class="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted${off ? " line-through" : ""}">${esc(li.label)}</span><span class="text-right text-[11px] font-extrabold text-text">${esc(formatter(total))}</span></div>`;
    })
    .join("")}</div>`;

  return `<div class="w-full overflow-x-auto">${svg}</div>${legend}<div class="mt-2.5 flex items-center gap-1.5 border-t border-border-2/55 pt-[9px] text-[10px] text-muted-2"><span class="inline-grid h-3.5 w-3.5 place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2">i</span> Clic en cualquier elemento de la leyenda para mostrarlo u ocultarlo en la grafica.</div>`;
}

export function renderTrendChart(id: string, series: DailySeries | null, opts: TrendChartOptions = {}): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = buildTrendChartHtml(id, series, opts);
}
