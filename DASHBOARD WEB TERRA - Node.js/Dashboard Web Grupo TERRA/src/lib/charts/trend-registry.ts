// Registro de graficas de tendencia: cada seccion (trafico.tsx, usuarios.tsx...) registra
// su(s) grafica(s) aqui para que los controles de rango de fecha (compartidos) y el toggle
// de leyenda sepan a que funcion de render llamar.
import { parseReportDateToken, dateISO } from "../core/format";
import { dashboardStoreApi } from "@/store/dashboard-store";
import { fullDateRangeOfDatasets, toggleTrendHidden } from "./trend-chart";
import type { DatasetType } from "../core/types";

interface TrendChartConfig {
  type: DatasetType;
  render: () => void;
}

const trendCharts: Record<string, TrendChartConfig> = {};

export function registerTrendChart(id: string, type: DatasetType, render: () => void): void {
  trendCharts[id] = { type, render };
}

export function readTrendRange(id: string): { from: Date | null; to: Date | null } {
  const fromEl = document.getElementById(id + "From") as HTMLInputElement | null;
  const toEl = document.getElementById(id + "To") as HTMLInputElement | null;
  return {
    from: fromEl && fromEl.value ? parseReportDateToken(fromEl.value) : null,
    to: toEl && toEl.value ? parseReportDateToken(toEl.value) : null,
  };
}

export function applyTrendRange(id: string): void {
  const cfg = trendCharts[id];
  if (cfg) cfg.render();
}

export function resetTrendRangeToFull(id: string): void {
  const cfg = trendCharts[id];
  if (!cfg) return;
  const src = dashboardStoreApi.getState().datasets.filter((d) => d.type === cfg.type);
  const { min, max } = fullDateRangeOfDatasets(src);
  const fromEl = document.getElementById(id + "From") as HTMLInputElement | null;
  const toEl = document.getElementById(id + "To") as HTMLInputElement | null;
  if (!fromEl || !toEl) return;
  if (min && max) {
    fromEl.value = dateISO(min);
    toEl.value = dateISO(max);
  } else {
    fromEl.value = "";
    toEl.value = "";
  }
  cfg.render();
}

// Delegado unico (no listeners por item) para el clic de "mostrar/ocultar serie" en la
// leyenda de las graficas de tendencia.
export function initTrendToggleDelegation(): void {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLElement>("[data-trend-id][data-trend-label]");
    if (!item) return;
    const { trendId, trendLabel } = item.dataset;
    if (!trendId || trendLabel == null) return;
    toggleTrendHidden(trendId, trendLabel);
    const cfg = trendCharts[trendId];
    if (cfg) cfg.render();
  });
}
