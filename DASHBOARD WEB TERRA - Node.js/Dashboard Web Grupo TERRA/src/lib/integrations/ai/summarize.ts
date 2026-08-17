// Construye, por modulo, un resumen numerico YA AGREGADO a partir del modelo del dashboard
// para enviarlo al Worker de IA. Nunca incluye filas crudas de CSV ni informacion personal:
// unicamente las mismas cifras agregadas (top canales, paginas, paises...) que el modulo
// ya muestra en pantalla, recortadas a un puñado de elementos para mantener el payload
// pequeño.
import type { AggregateItem, DashboardModel, GroupedRow } from "../../core/types";

export type AiInsightModuleId = "resumen" | "trafico" | "usuarios" | "audiencias" | "paginas" | "tecnologia" | "organico" | "demografia";

function round(n: unknown, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round((Number(n) || 0) * f) / f;
}

function pct(n: unknown): number {
  return round((Number(n) || 0) * 100, 1);
}

// Solo incluye un campo si su flag `<campo>Available` (cuando existe) confirma que el
// dato realmente vino del CSV, para no enviarle a la IA ceros que en realidad significan
// "no disponible" y que podria interpretar como una cifra real.
function pickRow(row: GroupedRow, fields: (keyof GroupedRow)[]): Record<string, unknown> {
  const out: Record<string, unknown> = { label: row.label };
  fields.forEach((f) => {
    const availKey = `${String(f)}Available` as keyof GroupedRow;
    const available = availKey in row ? row[availKey] : true;
    const value = row[f];
    if (available && value) {
      out[f as string] = f === "bounceRate" || f === "ctr" ? pct(value) : f === "position" ? round(value, 1) : round(value);
    }
  });
  return out;
}

function topRows(rows: GroupedRow[] | undefined, fields: (keyof GroupedRow)[], limit: number): Record<string, unknown>[] {
  return (rows || []).slice(0, limit).map((r) => pickRow(r, fields));
}

function topValueRows(rows: AggregateItem[] | undefined, limit: number): { label: string; valor: number }[] {
  return (rows || []).slice(0, limit).map((r) => ({ label: r.label, valor: round(r.value) }));
}

// Variante para columnas geograficas (paises/regiones/ciudades), que llegan como
// GroupedRow (campo `users`, no `value`) en vez de AggregateItem.
function topGeoRows(rows: GroupedRow[] | undefined, limit: number): { label: string; valor: number }[] {
  return (rows || []).slice(0, limit).map((r) => ({ label: r.label, valor: round(r.users) }));
}

export function buildModuleSummary(moduleId: AiInsightModuleId, m: DashboardModel | null): Record<string, unknown> | null {
  if (!m) return null;
  switch (moduleId) {
    case "resumen":
      return {
        usuariosTotales: round(m.totalUsers),
        usuariosNuevos: round(m.newUsers),
        usuariosRecurrentes: round(m.returningUsers),
        recurrentesEstimado: !!m.returningEstimated,
        sesiones: round(m.sessions),
        tasaRebote: m.bounce?.value ? pct(m.bounce.value) : undefined,
        topCanales: topRows(m.channels, ["sessions", "users"], 5),
      };
    case "trafico":
      return {
        sesiones: round(m.sessions),
        tasaRebote: m.bounce?.value ? pct(m.bounce.value) : undefined,
        topCanales: topRows(m.channels, ["sessions", "users", "bounceRate"], 8),
      };
    case "usuarios":
      return {
        usuariosTotales: round(m.totalUsers),
        usuariosNuevos: round(m.newUsers),
        usuariosRecurrentes: round(m.returningUsers),
        recurrentesEstimado: !!m.returningEstimated,
        topFuentes: topRows(m.sources, ["users", "newUsers", "returningUsers", "sessions"], 8),
      };
    case "audiencias":
      return { topAudiencias: topRows(m.audiences, ["users", "newUsers", "sessions"], 8) };
    case "paginas":
      return { topPaginas: topRows(m.pageRows, ["views", "users", "bounceRate"], 10) };
    case "tecnologia":
      return {
        topDispositivos: topValueRows(m.devices, 5),
        topSistemasOperativos: topValueRows(m.operatingSystems, 8),
        topNavegadores: topValueRows(m.browsers, 8),
      };
    case "organico":
      return {
        clics: round(m.organicClicks),
        impresiones: round(m.organicImpressions),
        ctr: m.organicCtr ? pct(m.organicCtr) : undefined,
        posicionPromedio: m.organicPosition ? round(m.organicPosition, 1) : undefined,
        topConsultas: topRows(m.queries, ["clicks", "impressions", "position"], 10),
      };
    case "demografia":
      return {
        genero: topValueRows(m.genders, 5),
        topPaises: topGeoRows(m.countries, 8),
        topProvincias: topGeoRows(m.regions, 8),
        topCiudades: topGeoRows(m.cities, 8),
      };
    default:
      return null;
  }
}
