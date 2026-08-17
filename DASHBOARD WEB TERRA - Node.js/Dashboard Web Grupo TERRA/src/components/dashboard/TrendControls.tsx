"use client";

import { applyTrendRange, resetTrendRangeToFull } from "@/lib/charts/trend-registry";

// Controles de rango de fecha reutilizados por cada grafica de tendencia. Los ids
// (`${id}From` / `${id}To`) y el atributo data-action/data-trend-target se mantienen
// identicos al proyecto original porque el motor de exportacion standalone (ver
// lib/export/engine-entry.ts) vuelve a conectar sus propios listeners sobre esos mismos
// atributos, sin depender de los handlers de React.
export default function TrendControls({ id }: { id: string }) {
  return (
    <div className="trend-controls mb-3 flex flex-wrap items-end gap-2.5">
      <div className="field w-[150px]">
        <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Desde</label>
        <input
          id={`${id}From`}
          type="date"
          data-action="applyTrendRange"
          data-trend-target={id}
          onChange={() => applyTrendRange(id)}
          className="w-full rounded-[10px] border border-border-2 bg-surface-2 px-2.5 py-[9px] text-text outline-none [color-scheme:dark] focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,121,0,.15)]"
        />
      </div>
      <div className="field w-[150px]">
        <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Hasta</label>
        <input
          id={`${id}To`}
          type="date"
          data-action="applyTrendRange"
          data-trend-target={id}
          onChange={() => applyTrendRange(id)}
          className="w-full rounded-[10px] border border-border-2 bg-surface-2 px-2.5 py-[9px] text-text outline-none [color-scheme:dark] focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,121,0,.15)]"
        />
      </div>
      <button
        type="button"
        data-action="resetTrendRangeToFull"
        data-trend-target={id}
        onClick={() => resetTrendRangeToFull(id)}
        className="btn rounded-[10px] border border-border-2 bg-transparent px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-surface-2 hover:text-text"
      >
        Usar rango completo
      </button>
    </div>
  );
}
