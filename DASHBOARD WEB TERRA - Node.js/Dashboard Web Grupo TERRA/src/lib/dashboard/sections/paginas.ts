import { esc, fmt, pct } from "../../core/format";
import { bestCol } from "../../core/csv/synonyms";
import { metricTotal } from "../../charts/chart-utils";
import { renderBarChart } from "../../charts/bar-chart";
import { renderDonutChart } from "../../charts/donut-chart";
import { tip } from "../../ui/render-helpers";
import { TABLE, TH, TH_NUM, TD, TD_NUM, TR, TABLEWRAP_LIMIT10 } from "../html-styles";
import type { DashboardModel } from "../../core/types";

export function renderPages(m: DashboardModel): void {
  const data = m.pageRows.map((x) => ({ label: x.label, value: x.views || x.users }));
  const metric = m.pageRows.some((x) => x.views) ? "vistas" : "usuarios";
  renderBarChart("pageBars", data, { metric, limit: 40 });
  renderDonutChart("pageDonut", data, { metric, maxSegments: 8, centerLabel: "Vistas" });

  const total = metricTotal(data);
  const visibleRows = m.pageRows.slice(0, 100);
  const rows = visibleRows
    .map(
      (x) =>
        `<tr class="${TR}"><td class="${TD}">${esc(x.label)}</td><td class="${TD_NUM}">${x.viewsAvailable ? fmt(x.views) : "-"}</td><td class="${TD_NUM}">${x.usersAvailable ? fmt(x.users) : "-"}</td><td class="${TD_NUM}">${x.bounceAvailable ? pct(x.bounceRate) : "-"}</td><td class="${TD_NUM}">${pct(total ? (x.views || x.users) / total : 0)}</td></tr>`
    )
    .join("");
  const pageTable = document.getElementById("pageTable");
  if (pageTable) {
    pageTable.className = TABLEWRAP_LIMIT10;
    pageTable.innerHTML = rows
      ? `<table class="${TABLE}"><thead><tr><th class="${TH}">${tip(
          "Pagina",
          "Pagina, ruta, pantalla o pagina de destino identificada en el informe cargado. El texto mostrado depende de la dimension que fue exportada desde GA4."
        )}</th><th class="${TH_NUM}">${tip(
          "Vistas",
          "Numero total de veces que la pagina fue vista. Incluye vistas repetidas de una misma persona durante una o varias sesiones."
        )}</th><th class="${TH_NUM}">${tip(
          "Usuarios",
          "Personas distintas que vieron esta pagina. Solo se muestra cuando el CSV contiene una metrica de usuarios compatible con la dimension de pagina."
        )}</th><th class="${TH_NUM}">${tip(
          "Rebote",
          "Porcentaje de sesiones asociadas a esta pagina que no tuvieron interaccion. Solo se muestra si el informe incluye Rebote o Interaccion y una base de sesiones compatible."
        )}</th><th class="${TH_NUM}">${tip(
          "Participacion",
          "Porcentaje directo que aporta la fila al total procesado: Vistas de la pagina / Vistas totales x 100; si no hay Vistas, se usan Usuarios. No representa conversiones ni ventas."
        )}</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<table class="${TABLE}"><tbody><tr><td class="${TD}">Sin paginas detectadas.</td></tr></tbody></table>`;
  }

  const primary = m.primary?.page;
  const hasUsersCol = !!(primary && bestCol(primary.columns, "users"));
  const hasBounceCol = !!(primary && (bestCol(primary.columns, "bounceRate") || bestCol(primary.columns, "engagementRate")));
  const hasSessionsCol = !!(primary && bestCol(primary.columns, "sessions"));
  const missingUsers = visibleRows.filter((x) => !x.usersAvailable).length;
  const missingBounce = visibleRows.filter((x) => !x.bounceAvailable).length;
  const userReason = hasUsersCol
    ? `${missingUsers} de ${visibleRows.length} filas visibles no recibieron un valor de Usuarios en el CSV; los ceros reales si se muestran como 0.`
    : "El informe de paginas seleccionado no incluye una columna de Usuarios compatible, por eso la tabla muestra \"-\" en esa metrica.";
  const bounceReason = hasBounceCol
    ? `${missingBounce} de ${visibleRows.length} filas visibles no recibieron una tasa valida. ${hasSessionsCol ? "El archivo si contiene Sesiones para ponderar el calculo." : "Al no existir Sesiones, algunas tasas no pueden ponderarse de forma confiable."}`
    : "El CSV no incluye Tasa de rebote ni Tasa de interaccion; el dashboard no inventa ese dato y muestra \"-\".";
  const note = document.getElementById("pageDataNote");
  if (note) {
    note.innerHTML = `<b>Diagnostico automatico:</b> ${userReason}<br><br>${bounceReason}<br><br>Esto suele ocurrir cuando GA4 exporta unicamente Vistas, cuando se combina una dimension de pagina con metricas de otro alcance, por incompatibilidad entre dimensiones y metricas, o por limites/umbrales del informe. Para completar ambos campos, exporta un reporte de <b>Paginas y pantallas</b> que incluya Pagina o Ruta, Vistas, Usuarios, Sesiones y Tasa de rebote -o Tasa de interaccion- en el mismo CSV.`;
  }
}
