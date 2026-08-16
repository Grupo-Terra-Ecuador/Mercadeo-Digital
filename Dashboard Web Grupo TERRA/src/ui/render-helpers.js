// Helpers de renderizado usados por (casi) todos los modulos de secciones.
import { esc } from '../core/format.js';

export function kpi(label, val, hint, cls = '', tipText = '') {
  return `<div class="kpi ${cls}">${
    tipText ? `<span class="kpi-tip tip" data-tip="${esc(tipText)}"><span class="tipi">i</span></span>` : ''
  }<div class="lbl">${esc(label)}</div><div class="val">${val}</div><div class="hint">${hint}</div></div>`;
}

export function tip(label, text) {
  return `<span class="tip" data-tip="${esc(text)}">${esc(label)} <span class="tipi">i</span></span>`;
}

// Aisla el renderizado de una seccion en un try/catch: un error en un modulo no debe
// tumbar el resto del dashboard. `id` es el id del contenedor DOM de la seccion.
export function safe(id, fn) {
  try {
    fn();
  } catch (e) {
    console.error('Error en', id, e);
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="safeerr">Este modulo no pudo renderizarse. ${esc(e.message)}</div>`;
  }
}
