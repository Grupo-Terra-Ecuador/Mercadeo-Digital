// Genera y descarga el informe HTML standalone con los modulos seleccionados.
//
// Diferencia clave con el original: en vez de reconstruir el motor interactivo a partir de
// `fn.toString()` de ~35 funciones vivas (fragil bajo minificacion), este modulo:
//   1. Descarga /export-engine.js, un bundle IIFE ya compilado por Vite a partir de
//      src/export/engine-entry.js (mismo codigo fuente que usa la app en vivo).
//   2. Recolecta el CSS ya compilado (hojas <link rel="stylesheet"> en produccion).
//   3. Clona el DOM de las secciones seleccionadas (igual que el original).
//   4. Embebe los datasets necesarios como JSON (dato, nunca codigo) para que el motor
//      pueda re-renderizar las graficas de tendencia/mapa de calor/filtros de pais.
//
// Requiere el build de produccion (npm run build): en `npm run dev` no existe
// /export-engine.js todavia, asi que se avisa al usuario en vez de fallar en silencio.
import { esc } from '../core/format.js';
import { state, EXPORT_MODULES } from '../state.js';
import { selectedExportIds } from '../ui/export-selection.js';

function sanitizeForFilename(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g'), '')
    .replace(/[^\w.+-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function detectDataSourceLabel() {
  return sanitizeForFilename(state.dataSourceName) || 'SinFuente';
}

// Evita que datos de usuario (por ejemplo, una consulta de Search Console que contenga
// literalmente "</script>") puedan cerrar el <script> e inyectar HTML/JS en el documento
// exportado. Es la mitigacion estandar para embeber JSON dentro de un <script> inline.
function safeJsonForInlineScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} al descargar ${url}`);
  return res.text();
}

async function collectBuiltCss() {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  const linkedCss = await Promise.all(links.map((link) => fetchText(link.href).catch(() => '')));
  const inlineCss = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  return [...linkedCss, inlineCss].join('\n');
}

function cloneSections(ids) {
  return ids
    .map((id) => {
      const el = document.getElementById(id);
      if (!el) return '';
      const clone = el.cloneNode(true);
      clone.querySelectorAll('.module-select,.selectionbar,.exportPanel').forEach((x) => x.remove());
      clone.querySelectorAll('.export-card.export-off').forEach((x) => x.remove());
      clone.querySelectorAll('.card-export-check').forEach((x) => x.remove());
      clone.querySelectorAll('details.accordion').forEach((d) => (d.open = true));
      return clone.outerHTML;
    })
    .join('\n');
}

function buildNavLinks(ids) {
  return ids
    .map((id) => {
      const section = document.getElementById(id);
      const moduleTitle = section?.querySelector('.module-title')?.textContent?.trim();
      const fallback = EXPORT_MODULES.find((m) => m.id === id)?.label || id;
      return `<a href="#${esc(id)}">${esc(moduleTitle || fallback)}</a>`;
    })
    .join('');
}

function buildDocument({ css, engineSrc, sections, navLinks, labels, datasets }) {
  const generatedAt = new Date().toLocaleString('es-EC');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resultado Dashboard Tecnico Grupo TERRA</title>
<style>${css}</style>
</head>
<body class="exported">
<div class="shell">
<header class="top">
  <button id="mobileMenuBtn" class="menu-toggle" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menu de navegacion">&#9776;</button>
  <div class="brand"><div class="logo">&#127807;</div><div><b>Grupo TERRA</b><span>Informe tecnico exportado - V15</span></div></div>
  <div class="topmid"><span class="pill">Informe procesado</span><span class="topstatus">Navega por los modulos incluidos</span></div>
</header>
<aside id="sidebar" class="side" aria-label="Modulos exportados">
  <div class="mobile-side-head">
    <div class="mobile-side-title"><span>&#127807;</span><span>Menu del informe<small>Modulos exportados</small></span></div>
    <button id="mobileMenuClose" class="menu-close" type="button" aria-label="Cerrar menu">&#10005;</button>
  </div>
  <nav class="nav"><div class="navlabel">Modulos exportados</div>${navLinks}</nav>
  <div class="export-nav-note">El menu contiene unicamente los modulos seleccionados al generar este informe.</div>
</aside>
<div id="mobileMenuOverlay" class="mobile-overlay" aria-hidden="true"></div>
<main class="content">
<section class="hero">
  <div class="eyebrow">Resultado procesado - Dashboard Tecnico Web V15</div>
  <h1>Informe de <span>analitica web tecnica</span></h1>
  <p>Generado el ${esc(generatedAt)}. ${esc(labels.join(', '))}.</p>
  <div class="statusBanner ok"><span>OK</span><span>El informe conserva graficas, tablas, escalas, diagnosticos y navegacion entre los modulos seleccionados.</span></div>
  <div class="selectionbar" style="margin-top:14px">
    <button class="btn" type="button" data-action="expandModules">Expandir modulos</button>
    <button class="btn" type="button" data-action="collapseModules">Contraer modulos</button>
  </div>
</section>
${sections}
</main>
</div>
<div id="tooltip" class="floating" role="tooltip" aria-hidden="true"></div>
<script>${engineSrc}</script>
<script>window.TerraExportEngine.init(${safeJsonForInlineScript(datasets)});</script>
</body>
</html>`;
}

function downloadHtml(html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
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

export async function exportProcessedHTML() {
  if (!state.model) {
    alert('Procesa los CSV primero.');
    return;
  }
  const ids = selectedExportIds();
  if (!ids.length) {
    alert('Selecciona al menos un modulo para exportar.');
    return;
  }

  let engineSrc;
  try {
    engineSrc = await fetchText('/export-engine.js');
  } catch (err) {
    console.error(err);
    alert(
      'No se pudo cargar el motor de exportacion (/export-engine.js). Esta funcion requiere el build de produccion: ejecuta "npm run build" y sirve la carpeta dist/ (o "npm run preview") antes de exportar.'
    );
    return;
  }

  const css = await collectBuiltCss();
  const sections = cloneSections(ids);
  const navLinks = buildNavLinks(ids);
  const labels = ids.map((id) => EXPORT_MODULES.find((m) => m.id === id)?.label || id);
  // Se usa state.filteredDatasets (ya recortado por el "Filtro de fechas responsable"),
  // no state.datasets crudo: el HTML exportado debe quedar "congelado" con exactamente el
  // rango de fechas que estaba aplicado al momento de exportar, sin ninguna forma de volver
  // a consultar datos (ni de Google ni de ningun otro origen) despues de la descarga.
  const sourceDatasets = state.filteredDatasets.length ? state.filteredDatasets : state.datasets;
  const datasets = sourceDatasets.filter((d) => d.type === 'trafico' || d.type === 'usuarios' || d.type === 'demografia');

  const html = buildDocument({ css, engineSrc, sections, navLinks, labels, datasets });
  downloadHtml(html);
}
