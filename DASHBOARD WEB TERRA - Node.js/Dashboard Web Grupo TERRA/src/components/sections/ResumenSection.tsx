"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderSummary, renderTrafficTrend } from "@/lib/dashboard/sections/resumen";
import TrendControls from "../dashboard/TrendControls";
import AiInsightBlock from "../dashboard/AiInsightBlock";
import { CHART_CARD, CHART_HEAD_TITLE, CHART_HEAD_SUB } from "@/lib/dashboard/html-styles";

export default function ResumenSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("resumen", () => renderSummary(model));
  }, [model]);

  useEffect(() => {
    safe("trafficTrend", () => renderTrafficTrend());
  }, [model]);

  return (
    <>
      <div className="card mb-3 rounded-terra border border-border bg-surface p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
        <div className="cardtitle mb-2.5 flex items-center gap-2 text-[13px] font-black text-text">
          Vista rapida GA4
          <span
            className="ml-2 inline-grid h-3.5 w-3.5 cursor-help place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2"
            data-tip="Los mismos 4 indicadores que ves en la pantalla de inicio de tu cuenta de Google Analytics, para el mismo periodo que tengas seleccionado aqui. 'Usuarios activos' no es lo mismo que 'Usuarios totales' de la tarjeta de abajo: activos son quienes tuvieron una sesion con interaccion real o al menos un evento; totales incluye tambien a quienes entraron y no interactuaron. Disponible solo al conectar con Google."
          >
            i
          </span>
        </div>
        <div id="ga4Snapshot" className="flex flex-wrap overflow-hidden rounded-terra border border-border">
          <div className="rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2">
            Conecta con Google para ver esta vista.
          </div>
        </div>
      </div>

      <div id="kpis" className="grid grid-cols-5 gap-[11px] max-[1180px]:grid-cols-3 max-[900px]:grid-cols-1">
        <div className="rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2">Sin datos.</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
        <div id="summaryChannel" className="kpi summary-insight blue min-h-[160px] rounded-terra border border-border bg-surface" />
        <div id="summaryTech" className="kpi summary-insight purple min-h-[160px] rounded-terra border border-border bg-surface" />
        <div id="summaryLocation" className="kpi summary-insight green min-h-[160px] rounded-terra border border-border bg-surface" />
      </div>

      <div className={CHART_CARD + " mt-3"}>
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div>
            <h3 className={CHART_HEAD_TITLE}>Trafico adquirido a lo largo del tiempo</h3>
            <p className={CHART_HEAD_SUB}>Rango propio de esta grafica, independiente del Filtro de fechas responsable.</p>
          </div>
          <span
            className="inline-grid h-3.5 w-3.5 shrink-0 cursor-help place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2"
            data-tip="Requiere desglose diario: disponible automaticamente al conectar Google, o si el CSV cargado incluye la columna Fecha. Define aqui el rango que quieres ver; no afecta al resto del dashboard. Pase el cursor sobre la grafica para ver el detalle de cada dia."
          >
            i
          </span>
        </div>
        <TrendControls id="trafficTrend" />
        <div id="trafficTrend">
          <div className="grid min-h-[220px] place-items-center rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2">
            Sin datos.
          </div>
        </div>
      </div>

      <AiInsightBlock moduleId="resumen" />
    </>
  );
}
