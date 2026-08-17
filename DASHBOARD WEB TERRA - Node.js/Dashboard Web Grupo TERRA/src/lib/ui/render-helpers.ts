// Helpers de renderizado usados por (casi) todos los modulos de secciones.
import { esc } from "../core/format";

const KPI_BAR_COLOR: Record<string, string> = {
  "": "bg-orange",
  green: "bg-green",
  blue: "bg-blue",
  red: "bg-red",
  yellow: "bg-yellow",
  purple: "bg-purple",
};

export function kpi(label: string, val: string, hint: string, cls = "", tipText = ""): string {
  const bar = KPI_BAR_COLOR[cls] || KPI_BAR_COLOR[""];
  return `<div class="relative overflow-hidden rounded-terra border border-border bg-surface px-[18px] py-4"><span class="absolute inset-x-0 top-0 h-[3px] ${bar}"></span>${
    tipText
      ? `<span class="absolute right-2.5 top-2.5 z-[2] inline-grid h-[18px] w-[18px] cursor-help place-items-center rounded-full bg-white/[0.08] text-[11px] text-muted-2" data-tip="${esc(tipText)}">i</span>`
      : ""
  }<div class="mb-2 text-[10px] font-black uppercase tracking-wide text-muted-2">${esc(label)}</div><div class="text-[28px] font-black leading-none text-text">${val}</div><div class="mt-1.5 text-[11px] text-muted-2">${hint}</div></div>`;
}

export function tip(label: string, text: string): string {
  return `<span class="cursor-help border-b border-dotted border-muted-2" data-tip="${esc(text)}">${esc(label)} <span class="inline-grid h-3.5 w-3.5 place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2">i</span></span>`;
}

// Aisla el renderizado de una seccion en un try/catch: un error en un modulo no debe
// tumbar el resto del dashboard. `id` es el id del contenedor DOM de la seccion.
export function safe(id: string, fn: () => void): void {
  try {
    fn();
  } catch (e) {
    console.error("Error en", id, e);
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="my-2 rounded-[10px] border-l-4 border-red bg-red/[0.08] px-3 py-2.5 text-xs text-red-200">Este modulo no pudo renderizarse. ${esc((e as Error).message)}</div>`;
  }
}
