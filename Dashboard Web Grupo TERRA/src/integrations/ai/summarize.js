// Construye, por modulo, un resumen numerico YA AGREGADO a partir de state.model para
// enviarlo al Worker de IA. Nunca incluye filas crudas de CSV ni informacion personal:
// unicamente las mismas cifras agregadas (top canales, paginas, paises...) que el modulo
// ya muestra en pantalla, recortadas a un puñado de elementos para mantener el payload
// pequeño.

function round(n, decimals = 0) {
  const f = 10 ** decimals;
  return Math.round((Number(n) || 0) * f) / f;
}

function pct(n) {
  return round((Number(n) || 0) * 100, 1);
}

// Solo incluye un campo si su flag `<campo>Available` (cuando existe) confirma que el
// dato realmente vino del CSV, para no enviarle a la IA ceros que en realidad significan
// "no disponible" y que podria interpretar como una cifra real.
function pickRow(row, fields) {
  const out = { label: row.label };
  fields.forEach((f) => {
    const availKey = `${f}Available`;
    const available = availKey in row ? row[availKey] : true;
    if (available && row[f]) {
      out[f] = f === 'bounceRate' || f === 'ctr' ? pct(row[f]) : f === 'position' ? round(row[f], 1) : round(row[f]);
    }
  });
  return out;
}

function topRows(rows, fields, limit) {
  return (rows || []).slice(0, limit).map((r) => pickRow(r, fields));
}

function topValueRows(rows, limit) {
  return (rows || []).slice(0, limit).map((r) => ({ label: r.label, valor: round(r.value) }));
}

export function buildModuleSummary(moduleId, m) {
  if (!m) return null;
  switch (moduleId) {
    case 'resumen':
      return {
        usuariosTotales: round(m.totalUsers),
        usuariosNuevos: round(m.newUsers),
        usuariosRecurrentes: round(m.returningUsers),
        recurrentesEstimado: !!m.returningEstimated,
        sesiones: round(m.sessions),
        tasaRebote: m.bounce?.value ? pct(m.bounce.value) : undefined,
        topCanales: topRows(m.channels, ['sessions', 'users'], 5),
      };
    case 'trafico':
      return {
        sesiones: round(m.sessions),
        tasaRebote: m.bounce?.value ? pct(m.bounce.value) : undefined,
        topCanales: topRows(m.channels, ['sessions', 'users', 'bounceRate'], 8),
      };
    case 'usuarios':
      return {
        usuariosTotales: round(m.totalUsers),
        usuariosNuevos: round(m.newUsers),
        usuariosRecurrentes: round(m.returningUsers),
        recurrentesEstimado: !!m.returningEstimated,
        topFuentes: topRows(m.sources, ['users', 'newUsers', 'returningUsers', 'sessions'], 8),
      };
    case 'audiencias':
      return {
        topAudiencias: topRows(m.audiences, ['users', 'newUsers', 'sessions'], 8),
      };
    case 'paginas':
      return {
        topPaginas: topRows(m.pageRows, ['views', 'users', 'bounceRate'], 10),
      };
    case 'tecnologia':
      return {
        topDispositivos: topValueRows(m.devices, 5),
        topSistemasOperativos: topValueRows(m.operatingSystems, 8),
        topNavegadores: topValueRows(m.browsers, 8),
      };
    case 'organico':
      return {
        clics: round(m.organicClicks),
        impresiones: round(m.organicImpressions),
        ctr: m.organicCtr ? pct(m.organicCtr) : undefined,
        posicionPromedio: m.organicPosition ? round(m.organicPosition, 1) : undefined,
        topConsultas: topRows(m.queries, ['clicks', 'impressions', 'position'], 10),
      };
    case 'demografia':
      return {
        genero: topValueRows(m.genders, 5),
        topPaises: topValueRows(m.countries, 8),
        topProvincias: topValueRows(m.regions, 8),
        topCiudades: topValueRows(m.cities, 8),
      };
    default:
      return null;
  }
}
