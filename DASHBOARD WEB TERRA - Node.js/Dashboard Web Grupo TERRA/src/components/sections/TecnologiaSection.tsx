"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { safe } from "@/lib/ui/render-helpers";
import { renderTechnology } from "@/lib/dashboard/sections/tecnologia";
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

export default function TecnologiaSection() {
  const model = useDashboardStore((s) => s.model);

  useEffect(() => {
    if (!model) return;
    safe("tecnologia", () => renderTechnology(model));
  }, [model]);

  return (
    <>
      <div className={CHART_GRID}>
        <div className={CHART_CARD}>
          <ChartHead title="Distribucion por dispositivo" sub="Movil, escritorio, tablet y categorias detectadas." tipText="Cada segmento representa el porcentaje de usuarios o sesiones por categoria de dispositivo." />
          <div id="deviceDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Sistema operativo" sub="Android, iOS, Windows, Macintosh, Linux y sistemas detectados." tipText="Cada segmento representa usuarios o sesiones por sistema operativo." />
          <div id="osDonut">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Marca o modelo del dispositivo" sub="iPhone, Samsung, Redmi y otros equipos cuando el CSV incluye esa dimension." tipText="El dashboard prioriza Modelo del dispositivo movil y, como respaldo, Marca del dispositivo movil." />
          <div id="deviceDetailBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Navegadores" sub="Participacion y volumen de todos los navegadores disponibles." tipText="Escala relativa al navegador de mayor volumen." />
          <div id="browserBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
        <div className={CHART_CARD}>
          <ChartHead title="Formato de pantalla" sub="Resoluciones de pantalla mas usadas por tus visitantes." tipText="GA4 llama a esto 'Resolucion de pantalla' (ej. 1920x1080, 390x844)." />
          <div id="screenBars">
            <div className={EMPTY}>Sin datos.</div>
          </div>
        </div>
      </div>

      <details className={AI_ACCORDION} open>
        <summary className={AI_SUMMARY}>
          Lectura tecnica <span className={AI_CHEVRON}>▾</span>
        </summary>
        <div id="techNote" className={AI_INNER_BODY}>
          Sin datos.
        </div>
      </details>

      <AiInsightBlock moduleId="tecnologia" />
    </>
  );
}
