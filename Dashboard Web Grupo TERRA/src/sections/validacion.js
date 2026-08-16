import { esc, dateLabel } from '../core/format.js';
import { bestCol, metricKeys, labelKeys } from '../core/csv/synonyms.js';
import { labelType } from '../core/csv/classify.js';
import { state } from '../state.js';

export function renderValidation() {
  const src = state.filteredDatasets.length ? state.filteredDatasets : state.datasets;
  document.getElementById('validation').innerHTML = src.length
    ? src
        .map((d) => {
          const used = [...metricKeys, ...labelKeys].map((k) => [k, bestCol(d.columns, k)]).filter((x) => x[1]);
          return `<details class="validation"><summary>${esc(d.name)} <span class="tag info">${labelType(d.type)}</span> <span class="tag ${d.rows.length ? 'ok' : 'bad'}">${d.rows.length} filas</span> <span class="tag ${d.columns.length > 1 ? 'ok' : 'bad'}">${d.columns.length} columnas</span>${
            d.warnings?.length ? ` <span class="tag bad">${d.warnings.length} alerta(s)</span>` : ''
          }</summary><div class="inside"><p><b>Separador:</b> ${d.delimiter === '\t' ? 'tabulacion' : esc(d.delimiter)}</p><p><b>Encabezado:</b> fila ${d.headerIndex + 1} de ${d.rawRows}</p><p><b>Rango del reporte:</b> ${
            d.reportStart && d.reportEnd ? `${dateLabel(d.reportStart)} a ${dateLabel(d.reportEnd)}` : 'No detectado'
          }</p><p><b>Filtro:</b> ${esc(d.filterStatus || 'sin filtro')} ${
            d.filterRowsBefore != null ? `(${d.filterRowsBefore} -> ${d.filterRowsAfter} filas)` : ''
          }</p><p><b>Fecha por fila:</b> ${esc(d.rowDateCol || 'No detectada')}</p><p><b>Columnas usadas:</b> ${
            used.length ? esc(used.map((x) => `${x[0]}: ${x[1]}`).join(' - ')) : 'No se identificaron columnas clave.'
          }</p><p><b>Columnas:</b> ${esc(d.columns.join(' - '))}</p>${
            d.notices?.length ? `<p><b>Informacion:</b> ${esc(d.notices.join(' | '))}</p>` : ''
          }${d.warnings?.length ? `<p><b>Advertencias reales:</b> ${esc(d.warnings.join(' | '))}</p>` : ''}</div></details>`;
        })
        .join('')
    : '<div class="empty">Sin archivos cargados.</div>';
}
