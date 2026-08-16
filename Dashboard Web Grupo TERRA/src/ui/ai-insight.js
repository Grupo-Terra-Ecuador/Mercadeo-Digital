// Bloque "Toma de decisiones (IA)" por modulo: boton bajo demanda (nunca automatico, para
// controlar el costo por llamada) que pide al Worker un diagnostico generado por Claude a
// partir de los datos ya agregados del modulo (ver integrations/ai/summarize.js).
import { esc } from '../core/format.js';
import { state } from '../state.js';
import { buildModuleSummary } from '../integrations/ai/summarize.js';
import { requestModuleInsight } from '../integrations/ai/client.js';

const MODULE_LABELS = {
  resumen: 'Resumen tecnico',
  trafico: 'Adquisicion de trafico por canales',
  usuarios: 'Adquisicion de usuarios y fuentes de trafico',
  audiencias: 'Audiencias',
  paginas: 'Paginas mas visitadas',
  tecnologia: 'Tecnologia, dispositivos y navegadores',
  organico: 'Consultas de busqueda organica',
  demografia: 'Demografia',
};

export const AI_INSIGHT_MODULE_IDS = Object.keys(MODULE_LABELS);

// Se llama en cada renderAll() (y al resetear) para que un diagnostico generado con datos
// anteriores nunca quede mostrado como si aplicara a los datos recien procesados.
export function renderAiInsightBlock(moduleId) {
  const container = document.getElementById(`aiInsight-${moduleId}`);
  if (!container) return;
  const hasData = !!state.model;
  container.innerHTML = `<details class="ai-accordion" open><summary>Toma de decisiones (IA) <span class="chevron-mini">v</span></summary><div class="ai-body">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <button class="btn accent" type="button" data-action="generateAiInsight" data-module-id="${esc(moduleId)}" ${hasData ? '' : 'disabled'}>Generar diagnostico</button>
      <span style="font-size:11px;color:var(--muted)">Diagnostico generado por IA a partir de los datos agregados de este modulo. Se genera solo al presionar el boton, nunca automaticamente.</span>
    </div>
    <div class="ai-insight-result" data-role="ai-insight-result">${hasData ? 'Aun no generado.' : 'Procesa los datos primero.'}</div>
  </div></details>`;
}

export function renderAllAiInsightBlocks() {
  AI_INSIGHT_MODULE_IDS.forEach(renderAiInsightBlock);
}

export async function handleGenerateAiInsight(buttonEl) {
  const moduleId = buttonEl.dataset.moduleId;
  const moduleLabel = MODULE_LABELS[moduleId] || moduleId;
  const resultEl = buttonEl.closest('.ai-body')?.querySelector('[data-role="ai-insight-result"]');
  if (!resultEl) return;

  if (!state.model) {
    resultEl.textContent = 'Procesa los datos primero.';
    return;
  }
  const summary = buildModuleSummary(moduleId, state.model);
  if (!summary) {
    resultEl.textContent = 'No hay suficientes datos en este modulo para generar un diagnostico.';
    return;
  }

  buttonEl.disabled = true;
  resultEl.innerHTML = '<span style="color:var(--muted)">Generando diagnostico...</span>';
  try {
    const insight = await requestModuleInsight(moduleLabel, summary);
    resultEl.innerHTML = renderInsightMarkdown(insight);
  } catch (err) {
    resultEl.innerHTML = `<div class="safeerr">${esc(err.message || 'No se pudo generar el diagnostico.')}</div>`;
  } finally {
    buttonEl.disabled = false;
  }
}

// Conversion minima de Markdown (listas con guiones + negritas) a HTML. El texto de
// entrada siempre pasa primero por esc(): aunque viene de la IA y no de un usuario que
// edite el DOM, se escapa igual antes de interpretar la sintaxis, nunca despues.
function renderInsightMarkdown(text) {
  const escaped = esc(text || '');
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const lines = withBold.split('\n');
  let html = '';
  let inList = false;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${trimmed.replace(/^[-*]\s+/, '')}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (trimmed) html += `<p>${trimmed}</p>`;
    }
  });
  if (inList) html += '</ul>';
  return html || '<p>Sin contenido.</p>';
}
