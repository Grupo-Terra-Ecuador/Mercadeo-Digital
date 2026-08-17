import { esc, dateLabel } from "../../core/format";
import { labelType } from "../../core/csv/classify";
import { isDateFilterActive } from "../../core/model/date-filter";
import { dashboardStoreApi } from "@/store/dashboard-store";
import type { Dataset } from "../../core/types";
import { TAG, EMPTY } from "../html-styles";

interface PendingFileCard {
  name: string;
  type: "pendiente";
  rows: [];
  columns: [];
  warnings: [];
  notices: [];
}

export function renderFileCards(): void {
  const { filteredDatasets, datasets, files, settings } = dashboardStoreApi.getState();
  const src: (Dataset | PendingFileCard)[] = filteredDatasets.length
    ? filteredDatasets
    : datasets.length
      ? datasets
      : files.map((f) => ({ name: f.name, type: "pendiente" as const, rows: [] as [], columns: [] as [], warnings: [] as [], notices: [] as [] }));
  const el = document.getElementById("fileCards");
  if (!el) return;
  el.innerHTML = src.length
    ? src
        .map((d) => {
          const warningText = (d.warnings || []).join(" | ");
          const noticeText = (d.notices || []).join(" | ");
          const isDataset = "filterRowsAfter" in d;
          const filterClass =
            isDataset && (d as Dataset).filterRowsAfter === 0 && isDateFilterActive(settings)
              ? TAG.bad
              : isDataset && (d as Dataset).filterStatus === "sin filtro"
                ? TAG.info
                : TAG.warn;
          const reportStart = isDataset ? (d as Dataset).reportStart : null;
          const reportEnd = isDataset ? (d as Dataset).reportEnd : null;
          const filterStatus = isDataset ? (d as Dataset).filterStatus : null;
          return `<div class="rounded-xl border border-border bg-white/[0.035] p-[11px]"><strong class="mb-1.5 block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-text" title="${esc(d.name)}">${esc(d.name)}</strong><div class="flex flex-wrap gap-[5px]"><span class="${TAG.info}">${labelType(d.type)}</span><span class="${d.rows?.length ? TAG.ok : TAG.warn}">${d.rows?.length || 0} filas</span><span class="${(d.columns?.length || 0) > 1 ? TAG.ok : TAG.bad}">${d.columns?.length || 0} col.</span>${
            reportStart && reportEnd ? `<span class="${TAG.date}">${dateLabel(reportStart)} -> ${dateLabel(reportEnd)}</span>` : ""
          }${filterStatus ? `<span class="${filterClass}">${esc(filterStatus)}</span>` : ""}${
            noticeText ? `<span class="${TAG.info}" title="${esc(noticeText)}">i reporte agregado</span>` : ""
          }${warningText ? `<span class="${TAG.bad}" title="${esc(warningText)}">${d.warnings.length} alerta(s)</span>` : ""}</div></div>`;
        })
        .join("")
    : `<div class="${EMPTY}">Sin archivos cargados.</div>`;
}
