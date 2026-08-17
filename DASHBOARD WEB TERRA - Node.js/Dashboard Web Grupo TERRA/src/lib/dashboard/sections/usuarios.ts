import { esc, fmt, pct } from "../../core/format";
import { metricTotal, CHART_COLORS } from "../../charts/chart-utils";
import { renderBarChart } from "../../charts/bar-chart";
import { kpi } from "../../ui/render-helpers";
import { dashboardStoreApi } from "@/store/dashboard-store";
import { extractDailySeries, extractUserBreakdownSeries, renderTrendChart } from "../../charts/trend-chart";
import { extractDayHourBalance, renderDayHourHeatmap, DAY_NAMES, DAY_DISPLAY_ORDER, type DayHourBalance } from "../../charts/heatmap";
import { registerTrendChart, readTrendRange } from "../../charts/trend-registry";
import { TABLE, TH, TH_NUM, TD, TD_NUM, TR, EMPTY } from "../html-styles";
import type { DashboardModel } from "../../core/types";

export function renderUserComposition(m: DashboardModel): void {
  const el = document.getElementById("userComposition");
  if (!el) return;
  const data = [
    { label: "Usuarios nuevos", value: m.newUsers },
    { label: "Usuarios recurrentes", value: m.returningUsers },
  ].filter((x) => x.value > 0);
  const total = metricTotal(data);
  if (!data.length) {
    el.innerHTML = `<div class="${EMPTY}">Sin usuarios nuevos o recurrentes.</div>`;
    return;
  }
  const newPct = total ? m.newUsers / total : 0;
  const retPct = total ? m.returningUsers / total : 0;
  el.innerHTML = `<div class="flex h-11 overflow-hidden rounded-xl border border-border-2 bg-border-2"><div class="flex h-full min-w-[2px] cursor-help items-center justify-center overflow-hidden whitespace-nowrap text-[10px] font-black text-white" data-tip="Usuarios nuevos: ${fmt(m.newUsers)} - ${pct(newPct)}" style="width:${newPct * 100}%;background:${CHART_COLORS[1]}">${newPct > 0.16 ? pct(newPct) : ""}</div><div class="flex h-full min-w-[2px] cursor-help items-center justify-center overflow-hidden whitespace-nowrap text-[10px] font-black text-white" data-tip="Usuarios recurrentes: ${fmt(m.returningUsers)} - ${pct(retPct)}" style="width:${retPct * 100}%;background:${CHART_COLORS[3]}">${retPct > 0.16 ? pct(retPct) : ""}</div></div><div class="mt-2.5 grid grid-cols-2 gap-2"><div class="rounded-[10px] border border-border bg-white/[0.025] px-2.5 py-2.5"><b class="block text-[15px] text-text">${fmt(m.newUsers)}</b><span class="text-[10px] text-muted-2">Nuevos - ${pct(newPct)}</span></div><div class="rounded-[10px] border border-border bg-white/[0.025] px-2.5 py-2.5"><b class="block text-[15px] text-text">${fmt(m.returningUsers)}</b><span class="text-[10px] text-muted-2">Recurrentes - ${pct(retPct)}${m.returningEstimated ? " - estimado" : ""}</span></div></div><div class="mt-2.5 flex items-center gap-1.5 border-t border-border-2/55 pt-[9px] text-[10px] text-muted-2"><span class="inline-grid h-3.5 w-3.5 place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2">i</span> El ancho total representa ${fmt(total)} usuarios clasificados.</div>`;
}

export function renderUsers(m: DashboardModel): void {
  const userKpisEl = document.getElementById("userKpis");
  if (userKpisEl) {
    userKpisEl.innerHTML =
      kpi(
        "Usuarios totales",
        fmt(m.totalUsers),
        "Alcance total",
        "blue",
        "Cantidad de personas distintas que tuvieron actividad en el sitio durante el periodo. Es una metrica deduplicada: una persona se cuenta una sola vez aunque visite varias veces o llegue por diferentes fuentes."
      ) +
      kpi(
        "Nuevos",
        fmt(m.newUsers),
        m.totalUsers ? pct(m.newUsers / m.totalUsers) + " del total" : "Sin base",
        "green",
        "Usuarios cuya primera visita registrada por GA4 ocurrio dentro del periodo analizado. Mide la capacidad del sitio y sus canales para atraer audiencia por primera vez."
      ) +
      kpi(
        "Recurrentes",
        fmt(m.returningUsers),
        m.totalUsers ? pct(m.returningUsers / m.totalUsers) + " del total" : "Sin base",
        "purple",
        m.returningEstimated
          ? "Usuarios que regresaron al sitio. En este procesamiento la cifra fue estimada como Usuarios totales menos Usuarios nuevos porque el CSV no incluyo la metrica directa."
          : "Usuarios que ya habian visitado el sitio y volvieron a tener actividad. Un mismo usuario puede figurar como nuevo y recurrente dentro del mismo periodo si entro por primera vez y luego regreso."
      ) +
      kpi(
        "Relacion nuevos/recurrentes",
        m.returningUsers ? fmt(m.newUsers / m.returningUsers) : "-",
        "Valores mayores a 1 indican predominio de nuevos",
        "",
        "Compara cuantos usuarios nuevos llegaron por cada usuario recurrente en el periodo. Se calcula como Usuarios nuevos / Usuarios recurrentes. Por ejemplo, un valor de 5 significa que por cada usuario que regreso hubo 5 usuarios que visitaron el sitio por primera vez. Valores altos reflejan una audiencia dominada por visitantes nuevos (buena captacion, oportunidad de fidelizar); valores cercanos a 1 reflejan equilibrio; valores menores a 1 indican predominio de usuarios que ya conocian el sitio."
      );
  }

  renderUserComposition(m);

  const sourceData = m.sources.map((x) => ({ label: x.label, value: x.users || x.sessions }));
  renderBarChart("sourceBars", sourceData, {
    metric: m.sources.some((x) => x.users) ? "usuarios" : "sesiones",
    limit: 30,
    empty: "El CSV cargado no contiene Fuente / medio.",
  });

  const total = metricTotal(sourceData);
  const rows = m.sources
    .slice(0, 100)
    .map(
      (x) =>
        `<tr class="${TR}"><td class="${TD}">${esc(x.label)}</td><td class="${TD_NUM}">${x.usersAvailable ? fmt(x.users) : "-"}</td><td class="${TD_NUM}">${x.newUsersAvailable ? fmt(x.newUsers) : "-"}</td><td class="${TD_NUM}">${x.returningUsersAvailable ? fmt(x.returningUsers) : "-"}</td><td class="${TD_NUM}">${x.sessionsAvailable ? fmt(x.sessions) : "-"}</td><td class="${TD_NUM}">${pct(total ? (x.users || x.sessions) / total : 0)}</td></tr>`
    )
    .join("");
  const sourceTableEl = document.getElementById("sourceTable");
  if (sourceTableEl) {
    sourceTableEl.innerHTML = rows
      ? `<table class="${TABLE}"><thead><tr><th class="${TH}">Fuente / medio</th><th class="${TH_NUM}">Usuarios</th><th class="${TH_NUM}">Nuevos</th><th class="${TH_NUM}">Recurrentes</th><th class="${TH_NUM}">Sesiones</th><th class="${TH_NUM}">Participacion</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<table class="${TABLE}"><tbody><tr><td class="${TD}">No se detecto Fuente / medio. Exporta Adquisicion de usuarios o Adquisicion de trafico incluyendo esa dimension.</td></tr></tbody></table>`;
  }

  const classified = m.newUsers + m.returningUsers;
  const diff = classified - m.totalUsers;
  const absDiff = Math.abs(diff);
  const direction = diff > 0 ? "supera" : "queda por debajo de";
  const compositionBase = classified;
  const variance = document.getElementById("userVarianceNote");
  if (variance) {
    const comparison =
      m.totalUsers && compositionBase
        ? diff === 0
          ? `En este procesamiento, Nuevos + Recurrentes suman <b>${fmt(compositionBase)}</b> y coinciden con Usuarios totales.`
          : `En este procesamiento, Nuevos + Recurrentes suman <b>${fmt(compositionBase)}</b>, mientras Usuarios totales registra <b>${fmt(m.totalUsers)}</b>: la suma ${direction} al total en <b>${fmt(absDiff)}</b>.`
        : "No existe una base suficiente para comparar las tres metricas.";
    const reason = m.returningEstimated
      ? "La cifra de recurrentes fue estimada como Total menos Nuevos; por ello la coincidencia, cuando existe, es producto de esa formula y no de una metrica recurrente independiente."
      : 'En GA4, "Nuevos" y "Recurrentes" no son grupos necesariamente excluyentes: una persona puede visitar por primera vez y regresar dentro del mismo rango, apareciendo en ambas categorias. Ademas, los informes pueden usar alcances distintos -primer usuario, sesion o usuario activo-, aplicar deduplicacion, identidad, umbrales de privacidad y redondeos diferentes.';
    variance.innerHTML = `<b>Diagnostico automatico:</b> ${comparison}<br><br>${reason}<br><br>La barra de composicion usa como base los usuarios clasificados en Nuevos y Recurrentes (<b>${fmt(compositionBase)}</b>), no obliga esa suma a coincidir con Usuarios totales. Esta diferencia no implica por si sola un error del dashboard.`;
  }
}

export function renderUserChannelTrend(): void {
  const { datasets } = dashboardStoreApi.getState();
  const src = datasets.filter((d) => d.type === "usuarios");
  const { from, to } = readTrendRange("userChannelTrend");
  renderTrendChart("userChannelTrend", extractDailySeries(src, "channelFirst", "users", { limit: 5, from, to }), { metric: "usuarios" });
}

export function renderUserDayHourBalance(from: Date | null, to: Date | null): void {
  const { datasets } = dashboardStoreApi.getState();
  const src = datasets.filter((d) => d.type === "usuarios");
  const balance: DayHourBalance | null = extractDayHourBalance(src, { from, to });
  renderDayHourHeatmap("userDayHourHeatmap", balance, { metric: "usuarios" });
  const dayData = balance ? DAY_DISPLAY_ORDER.map((i) => ({ label: DAY_NAMES[i], value: balance.dayTotals[i] })) : [];
  const hourData = balance ? Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2, "0") + ":00", value: balance.hourTotals[h] })) : [];
  renderBarChart("userDayBars", dayData, { metric: "usuarios", limit: 7, empty: "Sin datos de dia/hora disponibles." });
  renderBarChart("userHourBars", hourData, { metric: "usuarios", limit: 24, empty: "Sin datos de dia/hora disponibles." });
  const noteEl = document.getElementById("userDayHourNote");
  if (!noteEl) return;
  if (!balance) {
    noteEl.innerHTML = "Sin datos de hora/dia disponibles todavia.";
    return;
  }
  let peakD = 0;
  let peakH = 0;
  let peakV = -1;
  balance.grid.forEach((row, d) =>
    row.forEach((v, h) => {
      if (v > peakV) {
        peakV = v;
        peakD = d;
        peakH = h;
      }
    })
  );
  const topDay = DAY_DISPLAY_ORDER.reduce((best, i) => (balance.dayTotals[i] > balance.dayTotals[best] ? i : best), DAY_DISPLAY_ORDER[0]);
  const topHour = Array.from({ length: 24 }, (_, h) => h).reduce((best, h) => (balance.hourTotals[h] > balance.hourTotals[best] ? h : best), 0);
  noteEl.innerHTML = `<b>Momento de mayor impacto:</b> ${esc(DAY_NAMES[peakD])} a las ${String(peakH).padStart(2, "0")}:00, con ${fmt(peakV)} usuarios en esa combinacion exacta. <b>Dia con mas trafico en total:</b> ${esc(DAY_NAMES[topDay])}. <b>Hora con mas trafico en total:</b> ${String(topHour).padStart(2, "0")}:00.`;
}

export function renderUserDayHourBalanceChart(): void {
  const { from, to } = readTrendRange("userDayHour");
  renderUserDayHourBalance(from, to);
}

export function renderUserBreakdownTrend(): void {
  const { datasets } = dashboardStoreApi.getState();
  const src = datasets.filter((d) => d.type === "usuarios");
  const { from, to } = readTrendRange("userBreakdownTrend");
  renderTrendChart("userBreakdownTrend", extractUserBreakdownSeries(src, { from, to }), {
    metric: "usuarios",
    showTotal: false,
    empty: "No hay datos diarios de usuarios disponibles todavia. Conecta con Google para verlos.",
  });
}

registerTrendChart("userChannelTrend", "usuarios", renderUserChannelTrend);
registerTrendChart("userDayHour", "usuarios", renderUserDayHourBalanceChart);
registerTrendChart("userBreakdownTrend", "usuarios", renderUserBreakdownTrend);
