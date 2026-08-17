"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderOrganic } from "@/lib/dashboard/sections/organico";
import AiInsightBlock from "../dashboard/AiInsightBlock";
import { CHART_CARD, CHART_GRID, CHART_HEAD_TITLE, CHART_HEAD_SUB, EMPTY, TABLEWRAP, DETAIL_ACCORDION, DETAIL_SUMMARY, DETAIL_CHEVRON, DETAIL_BODY } from "@/lib/dashboard/html-styles";

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

export default function OrganicoSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("organico", () => renderOrganic(model));
  }, [model]);

  return (
    <>
      <div id="organicKpis" className="grid grid-cols-4 gap-[11px] max-[1180px]:grid-cols-2 max-[900px]:grid-cols-1">
        <div className={EMPTY}>Sin datos.</div>
      </div>

      <div className={CHART_GRID + " mt-3"}>
        <div className={CHART_CARD}>
          <ChartHead title="Consultas con mayor volumen" sub="Palabras o frases que la gente escribio en Google y que mas veces trajeron visitas al sitio." tipText="Cada barra es una consulta de busqueda real." />
          <div id="queryBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="CTR por consulta y posicion media" sub="Ordenadas de mayor a menor CTR." tipText="Las consultas se ordenan de mayor a menor CTR." />
          <div id="queryScatter">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
      </div>

      <details className={DETAIL_ACCORDION}>
        <summary className={DETAIL_SUMMARY}>
          Consultas organicas <span className={DETAIL_CHEVRON}>▾</span>
        </summary>
        <div className={DETAIL_BODY}>
          <div className="-mt-1 mb-3 text-[11px] text-muted-2">Se muestran hasta 100 consultas en la tabla para conservar legibilidad; las metricas generales se calculan con todo el informe.</div>
          <div id="queryTable" className={TABLEWRAP}>
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

      <AiInsightBlock moduleId="organico" />
    </>
  );
}
