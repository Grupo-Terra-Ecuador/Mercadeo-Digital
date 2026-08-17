import { esc, fmt, parseNum, hasMetricValue, parseReportDateToken } from "../core/format";
import { bestCol } from "../core/csv/synonyms";
import { findRowDateCol } from "../core/csv/parse";
import { cleanRows } from "../core/model/aggregate";
import type { Dataset } from "../core/types";

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
export const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
export const DAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface DayHourBalance {
  grid: number[][];
  dayTotals: number[];
  hourTotals: number[];
}

export function extractDayHourBalance(
  datasets: Dataset[],
  { from = null, to = null }: { from?: Date | null; to?: Date | null } = {}
): DayHourBalance | null {
  let best: { d: Dataset; dateCol: string; dayCol: string; hourCol: string; metricCol: string } | null = null;
  let bestScore = -1;
  for (const d of datasets) {
    const dateCol = d.rowDateCol || findRowDateCol(d.columns);
    const dayCol = bestCol(d.columns, "dayOfWeek");
    const hourCol = bestCol(d.columns, "hour");
    const metricCol = bestCol(d.columns, "users") || bestCol(d.columns, "sessions");
    if (!dateCol || !dayCol || !hourCol || !metricCol) continue;
    const score = d.rows.length;
    if (score > bestScore) {
      bestScore = score;
      best = { d, dateCol, dayCol, hourCol, metricCol };
    }
  }
  if (!best) return null;
  const { d, dateCol, dayCol, hourCol, metricCol } = best;
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
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

export function buildDayHourHeatmapHtml(
  balance: DayHourBalance | null,
  { metric = "usuarios", formatter = fmt }: { metric?: string; formatter?: (n: number) => string } = {}
): string {
  if (!balance) {
    return `<div class="grid min-h-[220px] place-items-center rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2">No hay datos de hora/dia disponibles todavia. Esta vista requiere datos horarios de Google Analytics dentro del rango seleccionado arriba.</div>`;
  }
  const { grid } = balance;
  const max = Math.max(1, ...grid.flat());
  let html =
    '<div class="w-full overflow-x-auto"><div class="grid min-w-[760px] grid-cols-[38px_repeat(24,minmax(20px,1fr))] items-center gap-0.5"><div></div>';
  for (let h = 0; h < 24; h++) html += `<div class="text-center text-[8px] text-muted-2">${h}</div>`;
  DAY_DISPLAY_ORDER.forEach((dIdx) => {
    html += `<div class="pr-1.5 text-right text-[10px] font-extrabold text-muted-2">${DAY_NAMES_SHORT[dIdx]}</div>`;
    for (let h = 0; h < 24; h++) {
      const v = grid[dIdx][h];
      const intensity = max ? v / max : 0;
      html += `<div class="h-4 cursor-help rounded-[3px]" style="background:rgba(255,121,0,${(0.06 + intensity * 0.88).toFixed(2)})" data-tip="${esc(DAY_NAMES[dIdx])}, ${String(h).padStart(2, "0")}:00 h - ${esc(formatter(v))} ${esc(metric)}"></div>`;
    }
  });
  html += "</div></div>";
  return html;
}

export function renderDayHourHeatmap(
  id: string,
  balance: DayHourBalance | null,
  opts: { metric?: string; formatter?: (n: number) => string } = {}
): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = buildDayHourHeatmapHtml(balance, opts);
}
