import { esc, fmt, fmtCompact, fmtDuration, pct, parseNum, hasMetricValue, rateStatus } from '../core/format.js';
import { bestCol } from '../core/csv/synonyms.js';
import { metricTotal } from '../charts/chart-utils.js';
import { kpi } from '../ui/render-helpers.js';
import { state } from '../state.js';
import { GA4_TOTALS_DATASET_NAME } from '../core/model/dataset-names.js';
import { extractDailySeries, renderTrendChart } from '../charts/trend-chart.js';
import { registerTrendChart, readTrendRange } from '../charts/trend-registry.js';

export function summaryInsight(id, { label, value, cls = '', rows = [], cities = [], tipText = '' }) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `kpi summary-insight ${cls}`;
  el.innerHTML = `${
    tipText ? `<span class="kpi-tip tip" data-tip="${esc(tipText)}"><span class="tipi">i</span></span>` : ''
  }<div class="lbl">${esc(label)}</div><div class="val">${esc(value || 'No disponible')}</div><div class="summary-meta">${rows
    .map((r) => `<div class="summary-row"><span>${esc(r.label)}</span><b>${r.html ?? esc(r.value)}</b></div>`)
    .join('')}${
    cities.length
      ? `<div class="city-list">${cities
          .map((c, i) => `<div class="city-chip"><span>${i + 1}. ${esc(c.label)}</span><b>${fmt(c.value)}</b></div>`)
          .join('')}</div>`
      : ''
  }</div>`;
}

export function renderGA4Snapshot() {
  const el = document.getElementById('ga4Snapshot');
  if (!el) return;
  const src = state.datasets.find((d) => d.name === GA4_TOTALS_DATASET_NAME);
  if (!src) {
    el.innerHTML = '<div class="empty">Conecta con Google para ver esta vista (requiere la consulta agregada del periodo, no disponible con CSV manual).</div>';
    return;
  }
  const activeCol = bestCol(src.columns, 'activeUsers');
  const newCol = bestCol(src.columns, 'newUsers');
  const engCol = bestCol(src.columns, 'engagementDuration');
  const evCol = bestCol(src.columns, 'eventCount');
  const row = src.rows[0] || {};
  const active = activeCol && hasMetricValue(row[activeCol]) ? parseNum(row[activeCol]) : null;
  const news = newCol && hasMetricValue(row[newCol]) ? parseNum(row[newCol]) : null;
  const eng = engCol && hasMetricValue(row[engCol]) ? parseNum(row[engCol]) : null;
  const events = evCol && hasMetricValue(row[evCol]) ? parseNum(row[evCol]) : null;
  const avgEng = eng !== null && active ? eng / active : null;
  const items = [
    {
      label: 'Usuarios activos',
      value: active !== null ? fmtCompact(active) : '-',
      tip: active !== null ? `${fmt(active)} usuarios activos exactos en el periodo.` : 'Sin datos disponibles.',
    },
    {
      label: 'Usuarios nuevos',
      value: news !== null ? fmtCompact(news) : '-',
      tip: news !== null ? `${fmt(news)} usuarios nuevos exactos en el periodo.` : 'Sin datos disponibles.',
    },
    {
      label: 'Tiempo de interaccion medio',
      value: avgEng !== null ? fmtDuration(avgEng) : '-',
      tip:
        avgEng !== null
          ? 'Tiempo total de interaccion dividido entre usuarios activos: en promedio, cuanto tiempo paso cada persona realmente interactuando con el sitio (no cuenta el tiempo con la pestana en segundo plano).'
          : 'Requiere Usuarios activos y Tiempo de interaccion total.',
    },
    {
      label: 'Numero de eventos',
      value: events !== null ? fmtCompact(events) : '-',
      tip:
        events !== null
          ? `${fmt(events)} eventos exactos (vistas de pagina, clics, desplazamientos y cualquier otra interaccion registrada) en el periodo.`
          : 'Sin datos disponibles.',
    },
  ];
  el.innerHTML = items
    .map((i) => `<div class="ga4-snapshot-item tip" data-tip="${esc(i.tip)}"><div class="lbl">${esc(i.label)}</div><div class="val">${i.value}</div></div>`)
    .join('');
}

export function renderSummary(m) {
  renderGA4Snapshot();
  document.getElementById('kpis').innerHTML =
    kpi(
      'Usuarios totales',
      fmt(m.totalUsers),
      'Preferencia: adquisicion de usuarios',
      'blue',
      'Cantidad total de personas distintas que visitaron el sitio durante el periodo analizado, sin importar cuantas veces haya vuelto cada una. Al conectar con Google se usa una consulta agregada sin desglose (igual a como GA4 calcula su propio total) para no contar dos veces a quien visito por mas de un canal o mas de un dia; con CSV manual se prioriza el informe de Adquisicion de usuarios para minimizar ese mismo riesgo.'
    ) +
    kpi(
      'Usuarios nuevos',
      fmt(m.newUsers),
      'Primera visita detectada',
      'green',
      'Usuarios que entraron al sitio por primera vez durante el periodo analizado (GA4 no tenia un registro previo de ellos). Esta cifra mide que tan bien estan funcionando tus canales para atraer audiencia que no te conocia: SEO, campanas, redes sociales, etc. Al conectar con Google tambien usa la consulta agregada sin desglose, por la misma razon que Usuarios totales.'
    ) +
    kpi(
      'Usuarios recurrentes',
      fmt(m.returningUsers),
      m.returningEstimated ? 'Estimado: totales - nuevos' : 'Metrica directa de GA4',
      'purple',
      'Usuarios que ya habian visitado el sitio antes de este periodo y regresaron. Indican que tan bien retienes o fidelizas a tu audiencia. GA4 no entrega esta cifra de forma directa por API, asi que el dashboard la estima como Usuarios totales menos Usuarios nuevos; al usar la consulta agregada sin desglose para esos dos valores, la estimacion resultante es mas precisa que si se calculara sobre datos desglosados por canal o por dia.'
    ) +
    kpi(
      'Sesiones',
      fmt(m.sessions),
      'Adquisicion de trafico',
      '',
      'Una sesion es un periodo de actividad continua de una persona en el sitio (equivalente a "una visita"). Un mismo usuario puede generar varias sesiones en dias distintos del periodo, por eso el numero de sesiones suele ser mayor al numero de usuarios.'
    ) +
    kpi(
      'Tasa de rebote',
      m.bounce.value ? pct(m.bounce.value) : '-',
      m.bounce.value ? (m.bounce.derived ? 'Calculada desde interaccion' : 'Metrica directa ponderada') : 'No disponible',
      m.bounce.value ? rateStatus(m.bounce.value) : 'yellow',
      'Porcentaje de sesiones en las que la persona entro al sitio y se fue sin ninguna accion relevante: sin ver otra pagina, sin hacer clic ni permanecer el tiempo minimo esperado. Un valor alto puede indicar que la pagina de entrada no cumplio lo que la persona buscaba. Si el CSV no trae el rebote directo, se calcula como 1 menos la tasa de interaccion que GA4 si reporta.'
    );

  const ch = m.channels[0];
  const dev = m.devices[0];
  const browser = m.browsers[0];
  const country = m.countries[0];
  const region = m.regions[0];
  const citiesTop = m.cities.slice(0, 3);
  const channelTotal = m.channels.reduce((s, x) => s + (x.sessions || x.users), 0);
  const deviceTotal = metricTotal(m.devices);

  summaryInsight('summaryChannel', {
    label: 'Canal principal',
    value: ch?.label || 'No disponible',
    cls: 'blue',
    tipText:
      'Canal de adquisicion con mayor volumen dentro del periodo seleccionado. Resume cual fue la fuente agrupada mas importante para captar trafico o usuarios. El "Rebote" de esta tarjeta es especifico de este canal, no el promedio del sitio completo (esa cifra general esta en la tarjeta "Tasa de rebote" de arriba) - es normal y esperado que un canal puntual difiera del promedio general.',
    rows: ch
      ? [
          { label: 'Volumen', value: `${fmt(ch.sessions || ch.users)} ${ch.sessions ? 'sesiones' : 'usuarios'}` },
          { label: 'Participacion', html: pct(channelTotal ? (ch.sessions || ch.users) / channelTotal : 0) },
          { label: 'Rebote (solo este canal)', html: ch.bounceRate ? pct(ch.bounceRate) : '-' },
        ]
      : [{ label: 'Estado', value: 'Falta informe de canales' }],
  });

  summaryInsight('summaryTech', {
    label: 'Tecnologia dominante',
    value: dev?.label || 'No disponible',
    cls: 'purple',
    tipText:
      'Resumen del entorno tecnologico mas relevante detectado en la audiencia: categoria de dispositivo, sistema operativo, marca o modelo cuando este disponible y navegador principal.',
    rows: [
      { label: 'Participacion dispositivo', html: dev ? pct(deviceTotal ? dev.value / deviceTotal : 0) : '-' },
      { label: 'Sistema operativo', value: m.operatingSystems?.[0]?.label || 'No disponible' },
      { label: 'Marca / modelo', value: m.deviceDetails?.[0]?.label || 'CSV especifico no cargado' },
      { label: 'Navegador principal', value: browser?.label || 'No disponible' },
    ],
  });

  summaryInsight('summaryLocation', {
    label: 'Ubicacion principal',
    value: country?.label || 'Pais no disponible',
    cls: 'green',
    tipText:
      'Ubicacion geografica con mayor peso en la audiencia. Resume el pais dominante y, cuando el CSV correspondiente esta disponible, la provincia/region, la tasa de rebote del pais y las ciudades mas relevantes. GA4 llama "Region" a esta dimension; en Ecuador equivale a la provincia.',
    rows: [
      { label: 'Usuarios del pais', value: country ? fmt(country.users) : '-' },
      { label: 'Provincia principal', value: region?.label || 'CSV de Region no cargado' },
      { label: 'Tasa de rebote del pais', html: country?.bounceRate ? pct(country.bounceRate) : 'No disponible en los datos cargados' },
      { label: 'Ciudades destacadas', value: citiesTop.length ? `${citiesTop.length} disponibles` : 'CSV de Ciudad no cargado' },
    ],
    cities: citiesTop.map((x) => ({ label: x.label, value: x.users })),
  });
}

export function renderTrafficTrend() {
  const src = state.datasets.filter((d) => d.type === 'trafico');
  const { from, to } = readTrendRange('trafficTrend');
  renderTrendChart('trafficTrend', extractDailySeries(src, 'channelSession', 'sessions', { limit: 5, from, to }), { metric: 'sesiones' });
}

registerTrendChart('trafficTrend', 'trafico', renderTrafficTrend);
