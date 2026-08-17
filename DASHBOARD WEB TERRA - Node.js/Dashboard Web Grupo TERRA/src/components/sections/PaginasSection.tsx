"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderPages } from "@/lib/dashboard/sections/paginas";
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

export default function PaginasSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("paginas", () => renderPages(model));
  }, [model]);

  return (
    <>
      <div className={CHART_GRID}>
        <div className={CHART_CARD}>
          <ChartHead title="Top de paginas por vistas" sub="Comparacion proporcional del volumen de cada URL." tipText="Escala relativa: la pagina con mas vistas ocupa el 100% del ancho." />
          <div id="pageBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Participacion de paginas principales" sub='Las paginas restantes se agrupan como "Otros".' tipText="El grafico circular muestra las paginas principales." />
          <div id="pageDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
      </div>

      <details className={DETAIL_ACCORDION}>
        <summary className={DETAIL_SUMMARY}>
          Detalle de paginas <span className={DETAIL_CHEVRON}>▾</span>
        </summary>
        <div className={DETAIL_BODY}>
          <div id="pageTable" className={TABLEWRAP}>
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
          Diagnostico de campos sin informacion <span className={AI_CHEVRON}>▾</span>
        </summary>
        <div id="pageDataNote" className={AI_INNER_BODY}>
          Sin datos.
        </div>
      </details>

      <AiInsightBlock moduleId="paginas" />
    </>
  );
}
