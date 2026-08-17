// Entry point del bundle "motor de exportacion": el codigo interactivo minimo que necesita
// el HTML exportado para seguir funcionando fuera de la app (tooltips, navegacion, graficas
// de tendencia con su selector de rango, mapa de calor y filtros de pais en Demografia).
//
// Se compila con esbuild en un build separado (ver scripts/build-export-engine.mjs) a un
// unico archivo IIFE autocontenido (public/export-engine.js). El HTML exportado no
// reconstruye funciones desde texto: simplemente carga ese archivo ya compilado. Reutiliza
// los mismos modulos que usa la app en vivo (ningun codigo esta duplicado), asi que un
// cambio en, por ejemplo, lib/charts/trend-chart.ts se refleja automaticamente tanto en la
// app como en los HTML exportados.
import { dashboardStoreApi } from "@/store/dashboard-store";
import { initTooltip } from "../ui/tooltip";
import { initNav } from "../ui/nav";
import { toggleAllAccordions } from "../dashboard/export-selection";
import { applyTrendRange, resetTrendRangeToFull, initTrendToggleDelegation } from "../charts/trend-registry";
import { renderRegionFiltered, renderCityFiltered } from "../dashboard/sections/demografia";
import type { Dataset } from "../core/types";

// Importar estos modulos ejecuta, a nivel de archivo, sus llamadas registerTrendChart(...),
// dejando el registro de graficas de tendencia listo antes de init().
import "../dashboard/sections/resumen";
import "../dashboard/sections/trafico";
import "../dashboard/sections/usuarios";

const TREND_CHART_IDS = ["trafficTrend", "sessionsTrend", "bounceTrend", "userChannelTrend", "userDayHour", "userBreakdownTrend"];

function initTrendControls() {
  document.querySelectorAll<HTMLElement>('[data-action="applyTrendRange"]').forEach((el) => {
    el.addEventListener("change", () => applyTrendRange(el.dataset.trendTarget!));
  });
  document.querySelectorAll<HTMLElement>('[data-action="resetTrendRangeToFull"]').forEach((el) => {
    el.addEventListener("click", () => resetTrendRangeToFull(el.dataset.trendTarget!));
  });
}

function initAccordionControls() {
  document.querySelectorAll('[data-action="expandModules"]').forEach((el) => el.addEventListener("click", () => toggleAllAccordions(true)));
  document.querySelectorAll('[data-action="collapseModules"]').forEach((el) => el.addEventListener("click", () => toggleAllAccordions(false)));
}

function initDemographyFilters() {
  document.getElementById("regionCountrySelect")?.addEventListener("change", renderRegionFiltered);
  document.getElementById("cityCountrySelect")?.addEventListener("change", renderCityFiltered);
}

function renderInitialCharts() {
  TREND_CHART_IDS.forEach((id) => {
    if (document.getElementById(id)) applyTrendRange(id);
  });
  if (document.getElementById("regionBars")) renderRegionFiltered();
  if (document.getElementById("cityBars")) renderCityFiltered();
}

// Export ES real: esbuild en modo IIFE con globalName "TerraExportEngine" (ver
// scripts/build-export-engine.mjs) es quien expone esto como window.TerraExportEngine = { init }.
export function init(datasets: unknown): void {
  const list = Array.isArray(datasets) ? (datasets as Dataset[]) : [];
  dashboardStoreApi.setState({ datasets: list, filteredDatasets: list });
  initTooltip();
  initNav();
  initTrendToggleDelegation();
  initTrendControls();
  initAccordionControls();
  initDemographyFilters();
  renderInitialCharts();
}
