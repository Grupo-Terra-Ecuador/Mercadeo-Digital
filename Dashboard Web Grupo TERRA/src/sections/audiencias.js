import { esc, fmt, pct } from '../core/format.js';
import { metricTotal } from '../charts/chart-utils.js';
import { renderBarChart } from '../charts/bar-chart.js';
import { renderDonutChart } from '../charts/donut-chart.js';

export function renderAudiences(m) {
  const data = m.audiences.map((x) => ({ label: x.label, value: x.users }));
  renderBarChart('audienceBars', data, { metric: 'usuarios', limit: 50, empty: 'No se cargo un informe de Audiencias con Nombre de la audiencia.' });
  renderDonutChart('audienceDonut', data, { metric: 'usuarios', maxSegments: 8, centerLabel: 'Audiencias' });

  const total = metricTotal(data);
  const rows = m.audiences
    .slice(0, 100)
    .map(
      (x) =>
        `<tr><td>${esc(x.label)}</td><td class="num">${fmt(x.users)}</td><td class="num">${fmt(x.newUsers)}</td><td class="num">${fmt(x.sessions)}</td><td class="num">${pct(total ? x.users / total : 0)}</td></tr>`
    )
    .join('');
  document.getElementById('audienceTable').innerHTML = rows
    ? `<table><thead><tr><th>Audiencia</th><th class="num">Usuarios</th><th class="num">Nuevos</th><th class="num">Sesiones</th><th class="num">Participacion</th></tr></thead><tbody>${rows}</tbody></table>`
    : '<table><tbody><tr><td>No se detecto Nombre de la audiencia. Exporta el informe de Audiencias con esa dimension.</td></tr></tbody></table>';

  const top = m.audiences[0];
  document.getElementById('audienceNote').innerHTML = top
    ? `<b>Lectura tecnica:</b> la audiencia <b>${esc(top.label)}</b> concentra ${pct(total ? top.users / total : 0)} de los usuarios clasificados por segmento de audiencia.`
    : '<b>Lectura tecnica:</b> carga el informe de Audiencias con Nombre de la audiencia y Total de usuarios.';
}
