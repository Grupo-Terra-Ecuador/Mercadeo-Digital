"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderDemographics, renderRegionFiltered, renderCityFiltered } from "@/lib/dashboard/sections/demografia";
import AiInsightBlock from "../dashboard/AiInsightBlock";
import { CHART_CARD, CHART_GRID, CHART_HEAD_TITLE, CHART_HEAD_SUB, EMPTY, AI_ACCORDION, AI_SUMMARY, AI_CHEVRON, AI_INNER_BODY } from "@/lib/dashboard/html-styles";

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

const selectClass =
  "w-full rounded-[10px] border border-border-2 bg-surface-2 px-2.5 py-[9px] text-text outline-none [color-scheme:dark] focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,121,0,.15)]";

export default function DemografiaSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("demografia", () => renderDemographics(model));
  }, [model]);

  return (
    <>
      <div className={CHART_GRID}>
        <div className={CHART_CARD}>
          <ChartHead title="Sexo" sub="Participacion de los segmentos disponibles en GA4." tipText="Porcentaje calculado sobre los usuarios que GA4 permite mostrar." />
          <div id="genderDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Provincia / Region" sub="Escala completa de provincias o regiones disponibles." tipText="La barra mayor equivale a la provincia o region con mas usuarios." />
          <div className="trend-controls mb-2.5 flex flex-wrap items-end gap-2.5">
            <div className="field">
              <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Pais</label>
              <select id="regionCountrySelect" onChange={() => renderRegionFiltered()} className={selectClass}>
                <option value="">Todos los paises</option>
              </select>
            </div>
          </div>
          <div id="regionBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Participacion de provincias principales" sub='Las provincias restantes se agrupan como "Otros".' tipText="El grafico circular muestra las provincias principales." />
          <div id="regionDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Pais" sub="Pastel de paises principales y escala completa en barras." tipText="El pastel resume los paises principales y agrupa el resto como Otros." />
          <div id="countryDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
          <div id="countryBars" className="mt-3">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Ciudad" sub="Ciudades ordenadas por usuarios; se muestran todos los registros disponibles." tipText="Escala relativa a la ciudad de mayor volumen." />
          <div className="trend-controls mb-2.5 flex flex-wrap items-end gap-2.5">
            <div className="field">
              <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Pais</label>
              <select id="cityCountrySelect" onChange={() => renderCityFiltered()} className={selectClass}>
                <option value="">Todos los paises</option>
              </select>
            </div>
          </div>
          <div id="cityBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
      </div>

      <details className={AI_ACCORDION} open>
        <summary className={AI_SUMMARY}>
          Lectura descriptiva <span className={AI_CHEVRON}>▾</span>
        </summary>
        <div id="demoNote" className={AI_INNER_BODY}>
          Sin datos.
        </div>
      </details>

      <AiInsightBlock moduleId="demografia" />
    </>
  );
}
