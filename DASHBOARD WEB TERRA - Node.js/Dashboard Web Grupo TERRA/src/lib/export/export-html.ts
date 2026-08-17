// Genera y descarga el informe HTML standalone con los modulos seleccionados.
//
// Igual que el proyecto original: en vez de reconstruir el motor interactivo a partir de
// `fn.toString()`, este modulo:
//   1. Descarga /export-engine.js, un bundle IIFE compilado aparte con esbuild a partir de
//      src/lib/export/engine-entry.ts (ver scripts/build-export-engine.mjs), mismo codigo
//      fuente que usa la app en vivo.
//   2. Recolecta el CSS ya compilado (hojas <link rel="stylesheet"> y <style> en produccion).
//   3. Clona el DOM de las secciones seleccionadas.
//   4. Embebe los datasets necesarios como JSON (dato, nunca codigo) para que el motor
//      pueda re-renderizar las graficas de tendencia/mapa de calor/filtros de pais.
//
// Requiere el build de produccion (npm run build): en `npm run dev` /export-engine.js
// todavia no existe, asi que se avisa al usuario en vez de fallar en silencio.
import { esc } from "../core/format";
import { dashboardStoreApi } from "@/store/dashboard-store";
import { selectedExportIds } from "../dashboard/export-selection";
import type { Dataset } from "../core/types";

function sanitizeForFilename(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g"), "")
    .replace(/[^\w.+-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function detectDataSourceLabel(): string {
  return sanitizeForFilename(dashboardStoreApi.getState().dataSourceName) || "SinFuente";
}

// Evita que datos de usuario (por ejemplo, una consulta de Search Console que contenga
// literalmente "</script>") puedan cerrar el <script> e inyectar HTML/JS en el documento
// exportado. Es la mitigacion estandar para embeber JSON dentro de un <script> inline.
function safeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} al descargar ${url}`);
  return res.text();
}

async function collectBuiltCss(): Promise<string> {
  const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')];
  const linkedCss = await Promise.all(links.map((link) => fetchText(link.href).catch(() => "")));
  const inlineCss = [...document.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
  return [...linkedCss, inlineCss].join("\n");
}

function cloneSections(ids: string[]): string {
  return ids
    .map((id) => {
      const el = document.getElementById(id);
      if (!el) return "";
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".module-select,.selectionbar,.exportPanel").forEach((x) => x.remove());
      clone.querySelectorAll(".export-card.export-off").forEach((x) => x.remove());
      clone.querySelectorAll(".card-export-check").forEach((x) => x.remove());
      clone.querySelectorAll("details.accordion").forEach((d) => d.setAttribute("open", ""));
      return clone.outerHTML;
    })
    .join("\n");
}

function buildNavLinks(ids: string[]): string {
  const { exportModules } = dashboardStoreApi.getState();
  return ids
    .map((id) => {
      const section = document.getElementById(id);
      const moduleTitle = section?.querySelector(".module-title")?.textContent?.trim();
      const fallback = exportModules.find((m) => m.id === id)?.label || id;
      return `<a href="#${esc(id)}">${esc(moduleTitle || fallback)}</a>`;
    })
    .join("");
}

function buildDocument({
  css,
  engineSrc,
  sections,
  navLinks,
  labels,
  datasets,
}: {
  css: string;
  engineSrc: string;
  sections: string;
  navLinks: string;
  labels: string[];
  datasets: Dataset[];
}): string {
  const generatedAt = new Date().toLocaleString("es-EC");
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resultado Dashboard Tecnico Grupo TERRA</title>
<style>${css}</style>
</head>
<body class="exported bg-bg text-text">
<div class="shell grid grid-cols-[230px_1fr] min-h-screen max-[900px]:block">
<header class="top sticky top-0 z-50 flex min-h-[58px] border-b border-border bg-surface [grid-column:1/-1]">
  <button id="mobileMenuBtn" class="menu-toggle ml-2.5 hidden h-10 w-10 flex-none place-items-center rounded-[10px] border border-border-2 bg-surface-2 text-xl leading-none text-text max-[900px]:grid" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menu de navegacion">&#9776;</button>
  <div class="brand flex min-h-[58px] w-[230px] items-center gap-2.5 border-r border-border px-[18px] max-[900px]:w-auto max-[900px]:flex-1 max-[900px]:border-r-0"><div class="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-gradient-to-br from-orange to-[#ffd09a]">&#127807;</div><div><b class="block text-sm">Grupo TERRA</b><span class="block text-[10px] font-black text-muted-2">Informe tecnico exportado - V15</span></div></div>
  <div class="topmid flex min-w-0 flex-1 items-center gap-2.5 px-[18px] max-[900px]:hidden"><span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-orange/35 bg-orange/[.11] px-3 py-[5px] text-[11px] font-extrabold text-orange-2">Informe procesado</span><span class="text-xs text-muted-2">Navega por los modulos incluidos</span></div>
</header>
<aside id="sidebar" class="side sticky top-[58px] h-[calc(100vh-58px)] overflow-auto border-r border-border bg-surface p-[14px_10px] max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-[120] max-[900px]:h-[100dvh] max-[900px]:w-[min(86vw,320px)] max-[900px]:-translate-x-[105%] max-[900px]:transition-transform" aria-label="Modulos exportados">
  <div class="mobile-side-head sticky top-0 z-[2] -mx-2.5 mb-2.5 hidden min-h-16 items-center justify-between gap-2.5 border-b border-border bg-surface/[.98] px-3.5 max-[900px]:flex"><div class="flex items-center gap-2.5 font-black text-text"><span>&#127807;</span><span>Menu del informe<small class="block text-[9px] font-bold text-muted-2">Modulos exportados</small></span></div><button id="mobileMenuClose" class="grid h-[38px] w-[38px] place-items-center rounded-[10px] border border-border-2 bg-surface-2 text-[19px] text-text" type="button" aria-label="Cerrar menu">&#10005;</button></div>
  <nav class="nav"><div class="px-2.5 pb-1.5 pt-2.5 text-[10px] font-black uppercase tracking-[.09em] text-muted-2">Modulos exportados</div>${navLinks}</nav>
  <div class="mt-3 border-t border-border p-2.5 text-[11px] leading-[1.45] text-muted-2">El menu contiene unicamente los modulos seleccionados al generar este informe.</div>
</aside>
<div id="mobileMenuOverlay" aria-hidden="true" class="fixed inset-0 z-[105] opacity-0 invisible pointer-events-none bg-[rgba(3,7,18,.72)] backdrop-blur-[3px] transition-opacity"></div>
<main class="content px-[26px] py-6 max-[900px]:px-3">
<section class="hero relative overflow-hidden rounded-[22px] border border-border-2 bg-gradient-to-br from-[#13203a] via-[#0f172a] to-[#1a1000] p-7 mb-[18px]">
  <div class="eyebrow relative z-[1] mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/[.11] px-[13px] py-1.5 text-[11px] font-black text-orange-2">Resultado procesado - Dashboard Tecnico Web V15</div>
  <h1 class="relative z-[1] mb-2 text-[30px] leading-[1.12]">Informe de <span class="text-orange">analitica web tecnica</span></h1>
  <p class="relative z-[1] mb-5 max-w-[820px] text-muted">Generado el ${esc(generatedAt)}. ${esc(labels.join(", "))}.</p>
  <div class="relative z-[1] flex items-start gap-2.5 rounded-[13px] border border-green/25 bg-green/10 p-3 text-[13px] font-bold text-green"><span>OK</span><span>El informe conserva graficas, tablas, escalas, diagnosticos y navegacion entre los modulos seleccionados.</span></div>
  <div class="relative z-[1] mt-3.5 flex flex-wrap items-center gap-2"><button class="rounded-[10px] border border-border-2 px-2.5 py-1.5 text-[11px] font-extrabold text-muted" type="button" data-action="expandModules">Expandir modulos</button><button class="rounded-[10px] border border-border-2 px-2.5 py-1.5 text-[11px] font-extrabold text-muted" type="button" data-action="collapseModules">Contraer modulos</button></div>
</section>
${sections}
</main>
</div>
<div id="tooltip" role="tooltip" aria-hidden="true" class="fixed z-[999999] max-w-[min(520px,calc(100vw-28px))] rounded-[13px] border border-border-2 bg-[#1e293b] px-[15px] py-[13px] text-xs font-semibold leading-[1.55] text-[#f8fafc] opacity-0 shadow-terra transition-all [overflow-wrap:anywhere] [white-space:pre-line] translate-y-1.5 pointer-events-none"></div>
<script>${engineSrc}</script>
<script>window.TerraExportEngine.init(${safeJsonForInlineScript(datasets)});</script>
</body>
</html>`;
}

function downloadHtml(html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const sourceLabel = detectDataSourceLabel();
  a.href = URL.createObjectURL(blob);
  a.download = `resultado_datos_tecnicos_Grupo_TERRA_(${sourceLabel})(${stamp}).html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1500);
}

export async function exportProcessedHTML(): Promise<void> {
  const { model, filteredDatasets, datasets } = dashboardStoreApi.getState();
  if (!model) {
    alert("Procesa los CSV primero.");
    return;
  }
  const ids = selectedExportIds();
  if (!ids.length) {
    alert("Selecciona al menos un modulo para exportar.");
    return;
  }

  let engineSrc: string;
  try {
    engineSrc = await fetchText("/export-engine.js");
  } catch (err) {
    console.error(err);
    alert(
      'No se pudo cargar el motor de exportacion (/export-engine.js). Esta funcion requiere el build de produccion: ejecuta "npm run build" y sirve la carpeta out/ (o "npm run start") antes de exportar.'
    );
    return;
  }

  const css = await collectBuiltCss();
  const sections = cloneSections(ids);
  const navLinks = buildNavLinks(ids);
  const { exportModules } = dashboardStoreApi.getState();
  const labels = ids.map((id) => exportModules.find((m) => m.id === id)?.label || id);
  // Se usa filteredDatasets (ya recortado por el "Filtro de fechas responsable"), no
  // datasets crudo: el HTML exportado debe quedar "congelado" con exactamente el rango de
  // fechas que estaba aplicado al momento de exportar, sin ninguna forma de volver a
  // consultar datos (ni de Google ni de ningun otro origen) despues de la descarga.
  const sourceDatasets = filteredDatasets.length ? filteredDatasets : datasets;
  const exportDatasets = sourceDatasets.filter((d) => d.type === "trafico" || d.type === "usuarios" || d.type === "demografia");

  const html = buildDocument({ css, engineSrc, sections, navLinks, labels, datasets: exportDatasets });
  downloadHtml(html);
}
