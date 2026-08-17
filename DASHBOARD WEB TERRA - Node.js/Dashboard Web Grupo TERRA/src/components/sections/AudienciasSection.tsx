"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderAudiences } from "@/lib/dashboard/sections/audiencias";
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

export default function AudienciasSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("audiencias", () => renderAudiences(model));
  }, [model]);

  return (
    <>
      <div className={CHART_GRID}>
        <div className={CHART_CARD}>
          <ChartHead title="Usuarios por audiencia" sub="Comparacion proporcional del volumen de cada audiencia o segmento." tipText="Escala relativa: la audiencia con mas usuarios ocupa el 100% del ancho." />
          <div id="audienceBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Participacion por audiencia" sub='Las audiencias con menor volumen se agrupan como "Otros".' tipText="El grafico circular muestra las audiencias principales." />
          <div id="audienceDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
      </div>

      <details className={DETAIL_ACCORDION}>
        <summary className={DETAIL_SUMMARY}>
          Detalle por audiencia <span className={DETAIL_CHEVRON}>▾</span>
        </summary>
        <div className={DETAIL_BODY}>
          <div className="-mt-1 mb-3 text-[11px] text-muted-2">Se prioriza el informe de Audiencias con Nombre de la audiencia, Total de usuarios, Usuarios nuevos y Sesiones.</div>
          <div id="audienceTable" className={TABLEWRAP}>
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
        <div id="audienceNote" className={AI_INNER_BODY}>
          Sin datos.
        </div>
      </details>

      <AiInsightBlock moduleId="audiencias" />
    </>
  );
}
