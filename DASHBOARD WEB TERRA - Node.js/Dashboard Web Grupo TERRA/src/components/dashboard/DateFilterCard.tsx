"use client";

import type { ReactNode } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { dateLabel } from "@/lib/core/format";
import { selectedDateRange } from "@/lib/core/model/date-filter";

const fieldClass = "w-full rounded-[10px] border border-border-2 bg-surface-2 px-2.5 py-[9px] text-text outline-none [color-scheme:dark] focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,121,0,.15)]";
const btnClass = "btn w-full rounded-[10px] border border-orange bg-orange px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#e86c00]";
const btnGhostClass = "btn w-full rounded-[10px] border border-border-2 bg-transparent px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-surface-2 hover:text-text";

export default function DateFilterCard() {
  const settings = useDashboardStore((s) => s.settings);
  const setSettings = useDashboardStore((s) => s.setSettings);
  const applyDateFilter = useDashboardStore((s) => s.applyDateFilter);
  const fillDetectedDateRange = useDashboardStore((s) => s.fillDetectedDateRange);
  const model = useDashboardStore((s) => s.model);

  const i = model?.dateInfo;
  const detected = i?.detectedStart ? `${dateLabel(i.detectedStart)} a ${dateLabel(i.detectedEnd)}` : "No detectado";
  let statusContent: ReactNode;
  if (!i || !i.active) {
    statusContent = (
      <>
        <b>Rango detectado:</b> {detected}. Los CSV agregados sin Fecha por fila se procesan completos.
      </>
    );
  } else {
    const { from, to } = selectedDateRange(settings);
    const widerThanData = i.detectedStart && ((from && from < i.detectedStart) || (to && i.detectedEnd && to > i.detectedEnd));
    statusContent = (
      <>
        <b>Filtro solicitado:</b> {settings.dateFrom || "inicio"} a {settings.dateTo || "fin"}. <b>Rango detectado:</b> {detected}.
        Resultado: {i.exact} archivo(s) filtrados exactamente, {i.aggregated} conservados como agregados y {i.excluded} excluidos.
        {widerThanData && (
          <>
            <br />
            <br />
            <b>ADVERTENCIA: el rango solicitado es mas amplio que los datos actualmente cargados.</b> Este filtro solo puede
            recortar dentro de lo que ya tienes cargado ({detected}); no puede mostrar informacion que nunca se trajo. Si
            necesitas datos de un periodo distinto, vuelve a dar clic en &quot;Traer datos de Google&quot; (o sube otro CSV)
            usando ese rango.
          </>
        )}
      </>
    );
  }

  return (
    <div className="card rounded-terra border border-border bg-surface p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
      <div className="cardtitle mb-2.5 flex items-center gap-1.5 text-[13px] font-black text-text">Filtro de fechas responsable</div>
      <div className="settings grid grid-cols-5 gap-2.5 max-[1180px]:grid-cols-2 max-[900px]:grid-cols-1">
        <div className="field">
          <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Desde</label>
          <input id="dateFrom" type="date" value={settings.dateFrom} onChange={(e) => setSettings({ dateFrom: e.target.value })} className={fieldClass} />
        </div>
        <div className="field">
          <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Hasta</label>
          <input id="dateTo" type="date" value={settings.dateTo} onChange={(e) => setSettings({ dateTo: e.target.value })} className={fieldClass} />
        </div>
        <div className="field">
          <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Aplicar</label>
          <button type="button" onClick={() => applyDateFilter()} className={btnClass}>
            Aplicar filtro
          </button>
        </div>
        <div className="field">
          <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Rango CSV</label>
          <button type="button" onClick={() => fillDetectedDateRange()} className={btnGhostClass}>
            Usar rango detectado
          </button>
        </div>
      </div>
      <div id="dateFilterStatus" className="ai mt-3 rounded-[13px] border border-blue/28 bg-blue/[0.08] px-3.5 py-3 text-xs leading-[1.55] text-[#a9d0ff]">
        {statusContent}
      </div>
    </div>
  );
}
