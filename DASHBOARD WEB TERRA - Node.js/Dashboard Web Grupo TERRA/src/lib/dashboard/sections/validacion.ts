import { esc, dateLabel } from "../../core/format";
import { bestCol, metricKeys, labelKeys } from "../../core/csv/synonyms";
import { labelType } from "../../core/csv/classify";
import { dashboardStoreApi } from "@/store/dashboard-store";
import { TAG, EMPTY } from "../html-styles";

export function renderValidation(): void {
  const { filteredDatasets, datasets } = dashboardStoreApi.getState();
  const src = filteredDatasets.length ? filteredDatasets : datasets;
  const el = document.getElementById("validation");
  if (!el) return;
  el.innerHTML = src.length
    ? src
        .map((d) => {
          const used = [...metricKeys, ...labelKeys].map((k) => [k, bestCol(d.columns, k)] as const).filter((x) => x[1]);
          return `<details class="my-2 overflow-hidden rounded-xl border border-border bg-white/[0.02]"><summary class="cursor-pointer px-3.5 py-3 font-extrabold text-muted">${esc(d.name)} <span class="${TAG.info}">${labelType(d.type)}</span> <span class="${d.rows.length ? TAG.ok : TAG.bad}">${d.rows.length} filas</span> <span class="${d.columns.length > 1 ? TAG.ok : TAG.bad}">${d.columns.length} columnas</span>${
            d.warnings?.length ? ` <span class="${TAG.bad}">${d.warnings.length} alerta(s)</span>` : ""
          }</summary><div class="px-3.5 pb-3.5 text-xs leading-[1.6] text-muted-2 [overflow-wrap:anywhere]"><p><b class="text-muted">Separador:</b> ${d.delimiter === "\t" ? "tabulacion" : esc(d.delimiter)}</p><p><b class="text-muted">Encabezado:</b> fila ${d.headerIndex + 1} de ${d.rawRows}</p><p><b class="text-muted">Rango del reporte:</b> ${
            d.reportStart && d.reportEnd ? `${dateLabel(d.reportStart)} a ${dateLabel(d.reportEnd)}` : "No detectado"
          }</p><p><b class="text-muted">Filtro:</b> ${esc(d.filterStatus || "sin filtro")} ${
            d.filterRowsBefore != null ? `(${d.filterRowsBefore} -> ${d.filterRowsAfter} filas)` : ""
          }</p><p><b class="text-muted">Fecha por fila:</b> ${esc(d.rowDateCol || "No detectada")}</p><p><b class="text-muted">Columnas usadas:</b> ${
            used.length ? esc(used.map((x) => `${x[0]}: ${x[1]}`).join(" - ")) : "No se identificaron columnas clave."
          }</p><p><b class="text-muted">Columnas:</b> ${esc(d.columns.join(" - "))}</p>${
            d.notices?.length ? `<p><b class="text-muted">Informacion:</b> ${esc(d.notices.join(" | "))}</p>` : ""
          }${d.warnings?.length ? `<p><b class="text-muted">Advertencias reales:</b> ${esc(d.warnings.join(" | "))}</p>` : ""}</div></details>`;
        })
        .join("")
    : `<div class="${EMPTY}">Sin archivos cargados.</div>`;
}
