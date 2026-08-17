"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderTraffic, renderSessionsTrend, renderBounceTrend } from "@/lib/dashboard/sections/trafico";
import TrendControls from "../dashboard/TrendControls";
import AiInsightBlock from "../dashboard/AiInsightBlock";
import { CHART_CARD, CHART_GRID, CHART_HEAD_TITLE, CHART_HEAD_SUB, EMPTY, TABLEWRAP, DETAIL_ACCORDION, DETAIL_SUMMARY, DETAIL_CHEVRON, DETAIL_BODY, AI_ACCORDION, AI_SUMMARY, AI_CHEVRON, AI_INNER_BODY } from "@/lib/dashboard/html-styles";

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

export default function TraficoSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("trafico", () => renderTraffic(model));
  }, [model]);

  useEffect(() => {
    safe("sessionsTrend", () => renderSessionsTrend());
  }, [model]);

  useEffect(() => {
    safe("bounceTrend", () => renderBounceTrend());
  }, [model]);

  return (
    <>
      <div className={CHART_GRID}>
        <div className={CHART_CARD}>
          <ChartHead title="Participacion por canal" sub="Grafico circular sobre sesiones o usuarios clasificados." tipText="Escala: cada segmento representa su porcentaje del total de sesiones o usuarios clasificados. Pase el cursor por la leyenda para ver valor y participacion." />
          <div id="channelDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Escala comparativa por canal" sub="La barra mas larga representa el canal con mayor volumen." tipText="Escala relativa: 100% de ancho corresponde al mayor valor del grafico. Las demas barras se calculan proporcionalmente. El valor exacto y su participacion aparecen a la derecha." />
          <div id="channelBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
      </div>

      <div className={CHART_CARD + " mt-3"}>
        <ChartHead title="Sesiones a lo largo del tiempo" sub="Volumen de sesiones por dia (rango propio, independiente del resto del dashboard)." tipText="Muestra solo el volumen (Sesiones). Para leer la calidad de esas sesiones, revisa la grafica 'Tasa de rebote a lo largo del tiempo' justo debajo: ambas juntas dan una lectura completa de cantidad y calidad sin duplicar informacion en una misma grafica." />
        <TrendControls id="sessionsTrend" />
        <div id="sessionsTrend">
          <div className={EMPTY}>Sin datos.</div>
        </div>
      </div>

      <div className={CHART_CARD + " mt-3"}>
        <ChartHead title="Tasa de rebote a lo largo del tiempo" sub="Rango propio de esta grafica, independiente del resto del dashboard." tipText="Porcentaje de sesiones sin interaccion real. Una subida sostenida suele indicar un problema de contenido, velocidad o desajuste entre el anuncio/canal y la pagina de destino." />
        <TrendControls id="bounceTrend" />
        <div id="bounceTrend">
          <div className={EMPTY}>Sin datos.</div>
        </div>
      </div>

      <details className={DETAIL_ACCORDION}>
        <summary className={DETAIL_SUMMARY}>
          Detalle tecnico por canal <span className={DETAIL_CHEVRON}>▾</span>
        </summary>
        <div className={DETAIL_BODY}>
          <div id="channelTable" className={TABLEWRAP}>
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
          Lectura tecnica <span className={AI_CHEVRON}>▾</span>
        </summary>
        <div id="channelNote" className={AI_INNER_BODY}>
          Sin datos.
        </div>
      </details>

      <AiInsightBlock moduleId="trafico" />
    </>
  );
}
