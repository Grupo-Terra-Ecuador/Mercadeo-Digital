"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { buildModuleSummary, type AiInsightModuleId } from "@/lib/integrations/ai/summarize";
import { requestModuleInsight } from "@/lib/integrations/ai/client";
import { renderInsightMarkdown } from "@/lib/integrations/ai/render-markdown";
import { AI_ACCORDION, AI_SUMMARY, AI_CHEVRON, AI_INNER_BODY } from "@/lib/dashboard/html-styles";

const MODULE_LABELS: Record<AiInsightModuleId, string> = {
  resumen: "Resumen tecnico",
  trafico: "Adquisicion de trafico por canales",
  usuarios: "Adquisicion de usuarios y fuentes de trafico",
  audiencias: "Audiencias",
  paginas: "Paginas mas visitadas",
  tecnologia: "Tecnologia, dispositivos y navegadores",
  organico: "Consultas de busqueda organica",
  demografia: "Demografia",
};

const STATUS_DOT_CLASS: Record<string, string> = {
  unknown: "bg-muted-2",
  checking: "bg-yellow animate-pulse",
  ready: "bg-green",
  unavailable: "bg-red",
};

const STATUS_TEXT_CLASS: Record<string, string> = {
  unknown: "text-muted",
  checking: "text-yellow",
  ready: "text-green",
  unavailable: "text-red",
};

export default function AiInsightBlock({ moduleId }: { moduleId: AiInsightModuleId }) {
  const model = useDashboardStore((s) => s.model);
  const aiStatus = useDashboardStore((s) => s.aiStatus);
  const checkAiStatus = useDashboardStore((s) => s.checkAiStatus);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Un diagnostico generado con datos anteriores nunca debe quedar mostrado como si
  // aplicara a los datos recien procesados. Se ajusta durante el render (patron oficial de
  // React para "resetear estado cuando cambia una prop/dependencia externa") en vez de un
  // efecto, para no disparar un render en cascada.
  const [lastModel, setLastModel] = useState(model);
  if (model !== lastModel) {
    setLastModel(model);
    setResult(null);
    setError(null);
  }

  const hasData = !!model;

  async function handleGenerate() {
    if (!model) return;
    const summary = buildModuleSummary(moduleId, model);
    if (!summary) {
      setError("No hay suficientes datos en este modulo para generar un diagnostico.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const insight = await requestModuleInsight(MODULE_LABELS[moduleId], summary);
      setResult(insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el diagnostico.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <details id={`aiInsight-${moduleId}`} className={AI_ACCORDION} open>
      <summary className={AI_SUMMARY}>
        Toma de decisiones (IA) <span className={AI_CHEVRON}>▾</span>
      </summary>
      <div className={AI_INNER_BODY}>
        <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={!hasData || loading}
            onClick={handleGenerate}
            className="btn rounded-[10px] border border-orange bg-orange px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#e86c00] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {loading ? "Generando..." : "Generar diagnostico"}
          </button>
          <span className="text-[11px] text-muted">
            Diagnostico generado por IA a partir de los datos agregados de este modulo. Se genera solo al presionar el boton, nunca automaticamente.
          </span>
        </div>
        <div className="mb-2.5 flex flex-wrap items-center gap-2 border-t border-blue/[0.18] pt-2.5">
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_CLASS[aiStatus.state]}`} />
          <span className={`text-[11px] font-bold ${STATUS_TEXT_CLASS[aiStatus.state]}`}>{aiStatus.message}</span>
          <button
            type="button"
            disabled={aiStatus.state === "checking"}
            onClick={() => checkAiStatus()}
            className="rounded-[10px] border border-border-2 px-2.5 py-1 text-[11px] font-extrabold text-muted transition hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-35"
          >
            {aiStatus.state === "checking" ? "Verificando..." : "Verificar conexion"}
          </button>
          <span
            className="inline-grid h-3.5 w-3.5 cursor-help place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2"
            data-tip="Hace una peticion minima real a Claude para confirmar que la API key y el credito/facturacion de Anthropic estan activos. Tiene un costo minimo (no es gratis), por eso es manual. El resultado se comparte entre todos los modulos."
          >
            i
          </span>
        </div>
        {error ? (
          <div className="my-2 rounded-[10px] border-l-4 border-red bg-red/[0.08] px-3 py-2.5 text-xs text-red-200">{error}</div>
        ) : loading ? (
          <div className="text-muted">Generando diagnostico...</div>
        ) : result ? (
          <div dangerouslySetInnerHTML={{ __html: renderInsightMarkdown(result) }} />
        ) : (
          <div>{hasData ? "Aun no generado." : "Procesa los datos primero."}</div>
        )}
      </div>
    </details>
  );
}
