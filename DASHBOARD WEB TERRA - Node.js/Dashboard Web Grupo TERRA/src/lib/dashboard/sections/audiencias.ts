import { esc, fmt, pct } from "../../core/format";
import { metricTotal } from "../../charts/chart-utils";
import { renderBarChart } from "../../charts/bar-chart";
import { renderDonutChart } from "../../charts/donut-chart";
import { TABLE, TH, TH_NUM, TD, TD_NUM, TR } from "../html-styles";
import type { DashboardModel } from "../../core/types";

export function renderAudiences(m: DashboardModel): void {
  const data = m.audiences.map((x) => ({ label: x.label, value: x.users }));
  renderBarChart("audienceBars", data, { metric: "usuarios", limit: 50, empty: "No se cargo un informe de Audiencias con Nombre de la audiencia." });
  renderDonutChart("audienceDonut", data, { metric: "usuarios", maxSegments: 8, centerLabel: "Audiencias" });

  const total = metricTotal(data);
  const rows = m.audiences
    .slice(0, 100)
    .map(
      (x) =>
        `<tr class="${TR}"><td class="${TD}">${esc(x.label)}</td><td class="${TD_NUM}">${fmt(x.users)}</td><td class="${TD_NUM}">${fmt(x.newUsers)}</td><td class="${TD_NUM}">${fmt(x.sessions)}</td><td class="${TD_NUM}">${pct(total ? x.users / total : 0)}</td></tr>`
    )
    .join("");
  const audienceTableEl = document.getElementById("audienceTable");
  if (audienceTableEl) {
    audienceTableEl.innerHTML = rows
      ? `<table class="${TABLE}"><thead><tr><th class="${TH}">Audiencia</th><th class="${TH_NUM}">Usuarios</th><th class="${TH_NUM}">Nuevos</th><th class="${TH_NUM}">Sesiones</th><th class="${TH_NUM}">Participacion</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<table class="${TABLE}"><tbody><tr><td class="${TD}">No se detecto Nombre de la audiencia. Exporta el informe de Audiencias con esa dimension.</td></tr></tbody></table>`;
  }

  const top = m.audiences[0];
  const audienceNoteEl = document.getElementById("audienceNote");
  if (audienceNoteEl) {
    audienceNoteEl.innerHTML = top
      ? `<b>Lectura tecnica:</b> la audiencia <b>${esc(top.label)}</b> concentra ${pct(total ? top.users / total : 0)} de los usuarios clasificados por segmento de audiencia.`
      : "<b>Lectura tecnica:</b> carga el informe de Audiencias con Nombre de la audiencia y Total de usuarios.";
  }
}
