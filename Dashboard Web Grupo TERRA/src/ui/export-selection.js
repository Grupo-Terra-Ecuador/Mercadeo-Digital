// Checkboxes "Incluir en HTML" por modulo y por tarjeta/grafica individual, usadas para
// decidir que se incluye en el informe exportado (ver export/export-html.js).
//
// Diferencia con el original: los checkboxes creados dinamicamente ya no usan el atributo
// onclick="event.stopPropagation()" inline; el listener se agrega directamente al crear el
// elemento, evitando JS inline (igual que en charts/trend-chart.js).
import { EXPORT_MODULES } from '../state.js';
import { state } from '../state.js';

export function initCardExportChecks() {
  document.querySelectorAll('.module-body .chart-card, .module-body .card').forEach((card) => {
    if (card.querySelector(':scope > .card-export-check')) return;
    card.classList.add('export-card');
    const bar = document.createElement('label');
    bar.className = 'card-export-check';
    bar.innerHTML = '<input type="checkbox" class="card-export-toggle" checked> Incluir en HTML';
    card.insertBefore(bar, card.firstChild);
    bar.querySelector('input').addEventListener('change', (e) => card.classList.toggle('export-off', !e.target.checked));
  });

  document.querySelectorAll('.module-body .ai-accordion, .module-body .detail-accordion').forEach((acc) => {
    const summary = acc.querySelector(':scope > summary');
    if (!summary || summary.querySelector('.card-export-check')) return;
    acc.classList.add('export-card');
    const bar = document.createElement('label');
    bar.className = 'card-export-check';
    bar.addEventListener('click', (e) => e.stopPropagation());
    bar.innerHTML = '<input type="checkbox" class="card-export-toggle" checked> Incluir en HTML';
    summary.appendChild(bar);
    bar.querySelector('input').addEventListener('change', (e) => {
      e.stopPropagation();
      acc.classList.toggle('export-off', !e.target.checked);
    });
  });
}

export function initExportChecks() {
  EXPORT_MODULES.forEach((mod) => {
    const section = document.getElementById(mod.id);
    const summary = section?.querySelector(':scope > details.accordion > summary');
    if (!summary || summary.querySelector('.module-select')) return;
    const chevron = summary.querySelector('.chevron');
    const actions = document.createElement('span');
    actions.className = 'summary-actions';
    const label = document.createElement('label');
    label.className = 'module-select';
    label.addEventListener('click', (e) => e.stopPropagation());
    label.innerHTML = `<input type="checkbox" class="export-section" value="${mod.id}" ${mod.checked ? 'checked' : ''}> Incluir en HTML`;
    actions.appendChild(label);
    if (chevron) {
      chevron.remove();
      actions.appendChild(chevron);
    }
    summary.appendChild(actions);
  });
  document.querySelectorAll('.export-section').forEach((x) => x.addEventListener('change', updateExportSelection));
  updateExportSelection();
}

export function selectedExportIds() {
  return [...document.querySelectorAll('.export-section:checked:not(:disabled)')].map((x) => x.value);
}

export function setAllExportSections(value) {
  document.querySelectorAll('.export-section:not(:disabled)').forEach((x) => (x.checked = value));
  updateExportSelection();
}

export function toggleAllAccordions(open) {
  document.querySelectorAll('details.accordion').forEach((d) => (d.open = open));
}

export function updateExportSelection() {
  const available = [...document.querySelectorAll('.export-section:not(:disabled)')];
  const n = available.filter((x) => x.checked).length;
  const total = available.length;
  const el = document.getElementById('exportSelectionStatus');
  if (el) {
    el.textContent = state.model
      ? `${n} de ${total} modulos disponibles seleccionados para el informe HTML.`
      : `${n} de ${total} modulos seleccionados para el informe HTML.`;
  }
  const btn = document.getElementById('exportBtn');
  if (btn && state.model) btn.disabled = n === 0;
}
