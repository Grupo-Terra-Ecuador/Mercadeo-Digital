"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderUsers, renderUserChannelTrend, renderUserDayHourBalanceChart, renderUserBreakdownTrend } from "@/lib/dashboard/sections/usuarios";
import TrendControls from "../dashboard/TrendControls";
import AiInsightBlock from "../dashboard/AiInsightBlock";
import { CHART_CARD, CHART_GRID, CHART_HEAD_TITLE, CHART_HEAD_SUB, EMPTY, TABLEWRAP, DETAIL_ACCORDION, DETAIL_SUMMARY, DETAIL_CHEVRON, DETAIL_BODY, AI_ACCORDION, AI_SUMMARY, AI_CHEVRON, AI_INNER_BODY, AI_BODY } from "@/lib/dashboard/html-styles";

function ChartHead({ title, sub, tipText }: { title: string; sub: string; tipText: string }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2.5">
      <div>
        <h3 className={CHART_HEAD_TITLE}>{title}</h3>
        <p className={CHART_HEAD_SUB}>{sub}</p>
      </div>
      <span className="inline-grid h-3.5 w-3.5 shrink-0 cursor-help place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2" data-tip={tipText}>
        i
      </span>
    </div>
  );
}

export default function UsuariosSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("usuarios", () => renderUsers(model));
  }, [model]);
  useEffect(() => {
    safe("userChannelTrend", () => renderUserChannelTrend());
  }, [model]);
  useEffect(() => {
    safe("userDayHourHeatmap", () => renderUserDayHourBalanceChart());
  }, [model]);
  useEffect(() => {
    safe("userBreakdownTrend", () => renderUserBreakdownTrend());
  }, [model]);

  return (
    <>
      <div id="userKpis" className="grid grid-cols-4 gap-[11px] max-[1180px]:grid-cols-2 max-[900px]:grid-cols-1">
        <div className={EMPTY}>Sin datos.</div>
      </div>

      <div className={CHART_GRID + " mt-3"}>
        <div className={CHART_CARD}>
          <ChartHead title="Composicion de usuarios" sub="Distribucion entre nuevos y recurrentes." tipText="La composicion compara usuarios nuevos y recurrentes sobre la base total disponible. Los recurrentes pueden calcularse como Total menos Nuevos cuando GA4 no entrega la metrica directamente." />
          <div id="userComposition">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Principales fuentes / medios" sub="Volumen comparado cuando el CSV incluye esta dimension." tipText="La escala compara usuarios; si no existen usuarios por fuente, utiliza sesiones. La tabla conserva las metricas adicionales disponibles." />
          <div id="sourceBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
      </div>

      <div className={CHART_CARD + " mt-3"}>
        <ChartHead title="Usuarios por canal a lo largo del tiempo" sub="Rango propio de esta grafica, independiente del Filtro de fechas responsable." tipText="Requiere desglose diario: disponible automaticamente al conectar Google, o si el CSV cargado incluye la columna Fecha." />
        <TrendControls id="userChannelTrend" />
        <div id="userChannelTrend">
          <div className={EMPTY}>Sin datos.</div>
        </div>
      </div>

      <div className={CHART_CARD + " mt-3"}>
        <ChartHead title="Usuarios: nuevos vs. recurrentes en el tiempo" sub="Rango propio de esta grafica, independiente del resto del dashboard." tipText="Usuarios recurrentes = Usuarios totales - Usuarios nuevos (estimado cuando GA4 no entrega el dato directo)." />
        <TrendControls id="userBreakdownTrend" />
        <div id="userBreakdownTrend">
          <div className={EMPTY}>Sin datos.</div>
        </div>
      </div>

      <div className={CHART_CARD + " mt-3"}>
        <ChartHead title="Balance por horas y dias de mayor trafico" sub="Rango propio de esta tarjeta, independiente de la grafica de arriba y del resto del dashboard." tipText="Requiere desglose por hora: disponible automaticamente al conectar con Google. Cada celda del mapa de calor muestra el detalle exacto al pasar el cursor." />
        <TrendControls id="userDayHour" />
        <div id="userDayHourHeatmap">
          <div className={EMPTY}>Sin datos.</div>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[10px] font-bold text-muted-2">
          <span>Menos trafico</span>
          <span className="h-2 max-w-[220px] flex-1 rounded bg-gradient-to-r from-orange/[0.06] to-orange/[0.94]" />
          <span>Mas trafico</span>
        </div>
        <div className={CHART_GRID + " mt-4"}>
          <div>
            <div className="mb-2.5 text-xs font-black text-text">Por dia de la semana</div>
            <div id="userDayBars">
              <div className={EMPTY}>Sin datos.</div>
            </div>
          </div>
          <div>
            <div className="mb-2.5 text-xs font-black text-text">Por hora del dia</div>
            <div id="userHourBars">
              <div className={EMPTY}>Sin datos.</div>
            </div>
          </div>
        </div>
        <div id="userDayHourNote" className={AI_BODY + " mt-3.5"}>
          Sin datos.
        </div>
      </div>

      <details className={DETAIL_ACCORDION}>
        <summary className={DETAIL_SUMMARY}>
          Fuente / medio de adquisicion <span className={DETAIL_CHEVRON}>▾</span>
        </summary>
        <div className={DETAIL_BODY}>
          <div className="-mt-1 mb-3 text-[11px] text-muted-2">Se prioriza Fuente/medio del primer usuario; como respaldo se usa Fuente/medio de la sesion.</div>
          <div id="sourceTable" className={TABLEWRAP}>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="px-3 py-2.5 text-xs text-muted">Sin datos.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <details className={AI_ACCORDION} open>
        <summary className={AI_SUMMARY}>
          Diagnostico de diferencias entre usuarios <span className={AI_CHEVRON}>▾</span>
        </summary>
        <div id="userVarianceNote" className={AI_INNER_BODY}>
          Sin datos.
        </div>
      </details>

      <AiInsightBlock moduleId="usuarios" />
    </>
  );
}
