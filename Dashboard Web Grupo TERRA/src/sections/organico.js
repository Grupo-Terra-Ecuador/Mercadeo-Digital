import { esc, fmt, pct } from '../core/format.js';
import { renderBarChart } from '../charts/bar-chart.js';
import { kpi, tip } from '../ui/render-helpers.js';

export function renderCtrPositionBars(id, queries) {
  const el = document.getElementById(id);
  if (!el) return;
  const data = (queries || [])
    .filter((x) => x.impressions > 0 && x.position > 0)
    .sort((a, b) => b.ctr - a.ctr || b.impressions - a.impressions)
    .slice(0, 20);
  if (!data.length) {
    el.innerHTML = '<div class="empty chart-empty">No hay consultas con impresiones y posicion suficientes.</div>';
    return;
  }
  renderBarChart(id, data.map((q) => ({ label: q.label, value: q.ctr, position: q.position, impressions: q.impressions, clicks: q.clicks })), {
    metric: 'CTR',
    formatter: pct,
    limit: 20,
    scrollClass: 'limit-10',
    showTotal: false,
    valueHTML: (x) => `${pct(x.value)}<small>Pos. ${fmt(x.position)} - Imp. ${fmt(x.impressions)}</small>`,
    tooltipBuilder: (x) =>
      `${x.label} - CTR: ${pct(x.value)} - Posicion media: ${fmt(x.position)} - Impresiones: ${fmt(x.impressions)} - Clics: ${fmt(x.clicks)}. Escala relativa al CTR mas alto del conjunto visible.`,
  });
}

export function renderOrganic(m) {
  document.getElementById('organicKpis').innerHTML =
    kpi(
      'Clics organicos',
      fmt(m.organicClicks),
      'Search Console',
      'blue',
      'Cantidad de veces que alguien busco algo en Google, vio tu pagina entre los resultados y le dio clic para entrar al sitio - sin que hayas pagado por ese anuncio o posicion. "Organico" significa que llego de forma natural por el buscador, no por publicidad.'
    ) +
    kpi(
      'Impresiones',
      fmt(m.organicImpressions),
      'Apariciones en Google',
      '',
      'Cantidad de veces que alguna pagina de tu sitio aparecio en los resultados de Google para una busqueda, la haya visto la persona o no y le haya dado clic o no. Por ejemplo, si tu pagina aparece en el puesto 8 de una busqueda y el usuario no baja hasta ahi, igual cuenta como una impresion.'
    ) +
    kpi(
      'CTR',
      pct(m.organicCtr),
      'Clics / impresiones',
      m.organicCtr < 0.02 ? 'yellow' : 'green',
      'CTR significa "tasa de clics" (Click-Through Rate). Es el porcentaje de veces que, habiendo aparecido tu pagina en Google, la persona realmente le dio clic: Clics / Impresiones x 100. Por ejemplo, si tu pagina aparecio 1.000 veces y recibio 20 clics, el CTR es 2%. Un CTR bajo puede indicar que el titulo o la descripcion que Google muestra no esta resultando atractivo, aunque la pagina si aparezca.'
    ) +
    kpi(
      'Posicion media',
      m.organicPosition ? fmt(m.organicPosition) : '-',
      'Promedio ponderado por impresiones',
      'purple',
      'El lugar promedio que ocupo tu pagina en los resultados de Google para las busquedas donde aparecio. Un valor de 1 significa que en promedio apareciste de primero; un valor de 11 significa que en promedio apareciste en la segunda pagina de resultados de Google (que normalmente empieza en la posicion 11), donde muy pocas personas llegan a mirar.'
    );

  const useClicks = m.queries.some((x) => x.clicks > 0);
  const barData = m.queries.slice(0, 40).map((x) => ({ label: x.label, value: useClicks ? x.clicks : x.impressions }));
  renderBarChart('queryBars', barData, { metric: useClicks ? 'clics' : 'impresiones', limit: 40 });
  renderCtrPositionBars('queryScatter', m.queries);

  const rows = m.queries
    .slice(0, 100)
    .map(
      (x) =>
        `<tr><td>${esc(x.label)}</td><td class="num">${fmt(x.clicks)}</td><td class="num">${fmt(x.impressions)}</td><td class="num">${pct(x.ctr)}</td><td class="num">${x.position ? fmt(x.position) : '-'}</td></tr>`
    )
    .join('');
  const queryTable = document.getElementById('queryTable');
  if (queryTable) queryTable.className = 'tablewrap limit-10';
  document.getElementById('queryTable').innerHTML = rows
    ? `<table><thead><tr><th>${tip('Consulta', 'Palabra o frase exacta que una persona escribio en Google y para la cual aparecio alguna pagina del sitio.')}</th><th class="num">${tip('Clics', 'Cantidad de veces que las personas hicieron clic en un resultado organico del sitio despues de realizar esta consulta.')}</th><th class="num">${tip('Impresiones', 'Cantidad de veces que el sitio aparecio en los resultados de Google para esta consulta, con o sin clic.')}</th><th class="num">${tip('CTR', 'Porcentaje de impresiones que terminaron en clic: Clics / Impresiones x 100. Un CTR mas alto produce una barra mas llena en el grafico superior.')}</th><th class="num">${tip('Posicion', 'Puesto promedio del resultado del sitio para la consulta. Cuanto menor sea el numero, mejor fue la posicion media en Google.')}</th></tr></thead><tbody>${rows}</tbody></table>`
    : '<table><tbody><tr><td>Sin consultas organicas detectadas.</td></tr></tbody></table>';
}
