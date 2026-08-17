import { esc, fmt, pct, norm } from "../../core/format";
import { metricTotal } from "../../charts/chart-utils";
import { renderDonutChart } from "../../charts/donut-chart";
import { renderBarChart } from "../../charts/bar-chart";
import { tip } from "../../ui/render-helpers";
import { dashboardStoreApi } from "@/store/dashboard-store";
import { extractDailySeries, renderTrendChart } from "../../charts/trend-chart";
import { registerTrendChart, readTrendRange } from "../../charts/trend-registry";
import { TABLE, TH, TH_NUM, TD, TD_NUM, TR } from "../html-styles";
import type { DashboardModel } from "../../core/types";

export function channelExplanation(label: string): string {
  const n = norm(label);
  if (/organic/.test(n)) return "Trafico procedente de resultados organicos en buscadores.";
  if (/paid|cpc|display/.test(n)) return "Trafico procedente de campanas pagadas.";
  if (/direct/.test(n)) return "Sesiones sin referencia identificable o acceso directo. Un volumen alto puede indicar falta de UTMs.";
  if (/social/.test(n)) return "Trafico procedente de redes sociales, organico o pagado segun la clasificacion.";
  if (/referral/.test(n)) return "Visitas enviadas desde otros sitios web.";
  if (/email/.test(n)) return "Sesiones identificadas desde campanas de correo.";
  if (/unassigned|not set|sin asignar/.test(n)) return "GA4 no pudo clasificar correctamente el canal. Revisar UTMs y etiquetado.";
  return "Grupo de canal detectado por GA4.";
}

export function renderTraffic(m: DashboardModel): void {
  const data = m.channels.map((x) => ({ label: x.label, value: x.sessions || x.users }));
  const metric = m.channels.some((x) => x.sessions) ? "sesiones" : "usuarios";
  renderDonutChart("channelDonut", data, { metric, centerLabel: "Volumen" });
  renderBarChart("channelBars", data, { metric });

  const rows = m.channels
    .map(
      (x) =>
        `<tr class="${TR}"><td class="${TD}">${tip(x.label, channelExplanation(x.label))}</td><td class="${TD_NUM}">${x.sessionsAvailable ? fmt(x.sessions) : "-"}</td><td class="${TD_NUM}">${x.usersAvailable ? fmt(x.users) : "-"}</td><td class="${TD_NUM}">${x.bounceAvailable ? pct(x.bounceRate) : "-"}</td><td class="${TD_NUM}">${pct(metricTotal(data) ? (x.sessions || x.users) / metricTotal(data) : 0)}</td></tr>`
    )
    .join("");
  const channelTableEl = document.getElementById("channelTable");
  if (channelTableEl) {
    channelTableEl.innerHTML = rows
      ? `<table class="${TABLE}"><thead><tr><th class="${TH}">${tip(
          "Canal",
          "Clasificacion automatica de GA4 que agrupa el origen y el medio de cada visita, por ejemplo: busqueda organica, acceso directo, campanas pagadas, redes sociales o referencias desde otros sitios."
        )}</th><th class="${TH_NUM}">${tip(
          "Sesiones",
          "Cantidad de visitas iniciadas desde este canal durante el periodo. Una misma persona puede generar varias sesiones, por lo que esta cifra puede ser mayor que Usuarios."
        )}</th><th class="${TH_NUM}">${tip(
          "Usuarios",
          "Personas distintas asociadas a este canal segun el informe cargado. La suma por canal puede no coincidir exactamente con el total general por deduplicacion y por el alcance de la dimension utilizada."
        )}</th><th class="${TH_NUM}">${tip(
          "Rebote",
          "Porcentaje de sesiones de este canal que no fueron sesiones con interaccion. Se muestra solo cuando el CSV incluye Tasa de rebote o Tasa de interaccion compatible."
        )}</th><th class="${TH_NUM}">${tip(
          "Participacion",
          "Porcentaje directo del volumen clasificado que aporta este canal: valor del canal / total de la tabla x 100. Se priorizan Sesiones y, si no existen, se usan Usuarios. No representa ventas ni conversiones."
        )}</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<table class="${TABLE}"><tbody><tr><td class="${TD}">Sin canales detectados.</td></tr></tbody></table>`;
  }

  const top = m.channels[0];
  const total = metricTotal(data);
  const mixedUnits = m.channels.some((x) => !x.sessions && x.users) && m.channels.some((x) => x.sessions);
  const varianceNote = mixedUnits
    ? 'Este grafico combina dos informes de GA4 (trafico por sesion y adquisicion de usuarios por primer canal) para no dejar canales fuera. Cuando un canal solo aparece en uno de los dos informes, su valor aqui se toma de sesiones si estan disponibles, o de usuarios en caso contrario. Por eso el total de este grafico puede diferir levemente de la cifra "Sesiones" del Resumen tecnico, que se calcula exclusivamente desde el informe de trafico por sesion.'
    : 'Este grafico se basa en el mismo informe de trafico por sesion que la cifra "Sesiones" del Resumen tecnico. Si notas una pequena diferencia entre ambos totales, suele deberse a redondeo o a un canal adicional detectado unicamente en el informe de adquisicion de usuarios.';
  const channelNoteEl = document.getElementById("channelNote");
  if (channelNoteEl) {
    channelNoteEl.innerHTML = top
      ? `<b>Lectura tecnica:</b> ${esc(top.label)} concentra ${pct(total ? (top.sessions || top.users) / total : 0)} del volumen clasificado. Pase el cursor por segmentos y barras para revisar escala, valor y participacion.<br><br><b>Por que puede variar frente al Resumen tecnico?</b> ${varianceNote}`
      : "<b>Lectura tecnica:</b> carga el informe de Adquisicion de trafico con Grupo de canales principal de la sesion y Sesiones.";
  }
}

export function renderSessionsTrend(): void {
  const { datasets } = dashboardStoreApi.getState();
  const src = datasets.filter((d) => d.type === "trafico");
  const { from, to } = readTrendRange("sessionsTrend");
  renderTrendChart("sessionsTrend", extractDailySeries(src, null, "sessions", { from, to, singleLabel: "Sesiones" }), {
    metric: "sesiones",
    showTotal: false,
    empty: "No hay datos diarios de sesiones disponibles todavia. Conecta con Google para verlos.",
  });
}

export function renderBounceTrend(): void {
  const { datasets } = dashboardStoreApi.getState();
  const src = datasets.filter((d) => d.type === "trafico");
  const { from, to } = readTrendRange("bounceTrend");
  renderTrendChart("bounceTrend", extractDailySeries(src, null, "bounceRate", { from, to, singleLabel: "Tasa de rebote" }), {
    metric: "de rebote",
    formatter: pct,
    showTotal: false,
    aggregate: "avg",
    empty: "No hay datos diarios de tasa de rebote disponibles todavia. Conecta con Google para verlos.",
  });
}

registerTrendChart("sessionsTrend", "trafico", renderSessionsTrend);
registerTrendChart("bounceTrend", "trafico", renderBounceTrend);
