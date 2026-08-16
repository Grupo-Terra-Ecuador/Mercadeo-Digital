import { esc, dateLabel } from '../core/format.js';
import { labelType } from '../core/csv/classify.js';
import { isDateFilterActive } from '../core/model/date-filter.js';
import { state } from '../state.js';

export function renderFileCards() {
  const src = state.filteredDatasets.length
    ? state.filteredDatasets
    : state.datasets.length
      ? state.datasets
      : state.files.map((f) => ({ name: f.name, type: 'pendiente', rows: [], columns: [], warnings: [], notices: [] }));
  document.getElementById('fileCards').innerHTML = src.length
    ? src
        .map((d) => {
          const warningText = (d.warnings || []).join(' | ');
          const noticeText = (d.notices || []).join(' | ');
          const filterClass = d.filterRowsAfter === 0 && isDateFilterActive(state.settings) ? 'bad' : d.filterStatus === 'sin filtro' ? 'info' : 'warn';
          return `<div class="filecard"><strong title="${esc(d.name)}">${esc(d.name)}</strong><div class="status"><span class="tag info">${labelType(d.type)}</span><span class="tag ${
            d.rows?.length ? 'ok' : 'warn'
          }">${d.rows?.length || 0} filas</span><span class="tag ${(d.columns?.length || 0) > 1 ? 'ok' : 'bad'}">${d.columns?.length || 0} col.</span>${
            d.reportStart && d.reportEnd ? `<span class="tag date">${dateLabel(d.reportStart)} -> ${dateLabel(d.reportEnd)}</span>` : ''
          }${d.filterStatus ? `<span class="tag ${filterClass}">${esc(d.filterStatus)}</span>` : ''}${
            noticeText ? `<span class="tag info" title="${esc(noticeText)}">i reporte agregado</span>` : ''
          }${warningText ? `<span class="tag bad" title="${esc(warningText)}">${d.warnings.length} alerta(s)</span>` : ''}</div></div>`;
        })
        .join('')
    : '<div class="empty">Sin archivos cargados.</div>';
}
