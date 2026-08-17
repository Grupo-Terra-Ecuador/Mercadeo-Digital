// Decide si un modulo (y algunos de sus submodulos) trae datos reales, para no mostrar
// secciones, graficas ni entradas de menu vacias sin sentido. Logica pura derivada del
// modelo: en la version React, la visibilidad de secciones/nav se resuelve de forma
// declarativa a partir de estas funciones (ver components/layout/Sidebar.tsx y
// app/page.tsx), en vez de ocultar/mostrar nodos del DOM ya renderizados.
import type { DashboardModel } from "../core/types";

function positive(v: unknown): boolean {
  return Number(v || 0) > 0;
}

export type ModuleId =
  | "resumen"
  | "trafico"
  | "usuarios"
  | "audiencias"
  | "paginas"
  | "tecnologia"
  | "organico"
  | "demografia"
  | "validacion"
  | "fuentes-dashboard";

export function moduleHasData(id: ModuleId, m: DashboardModel | null): boolean {
  if (!m) return true;
  switch (id) {
    case "resumen":
      return positive(m.totalUsers) || positive(m.newUsers) || positive(m.returningUsers) || positive(m.sessions) || positive(m.bounce?.value);
    case "trafico":
      return Array.isArray(m.channels) && m.channels.some((x) => positive(x.sessions) || positive(x.users));
    case "usuarios":
      return positive(m.totalUsers) || positive(m.newUsers) || positive(m.returningUsers) || (Array.isArray(m.sources) && m.sources.length > 0);
    case "audiencias":
      return Array.isArray(m.audiences) && m.audiences.some((x) => positive(x.users) || positive(x.sessions));
    case "paginas":
      return Array.isArray(m.pageRows) && m.pageRows.some((x) => positive(x.views) || positive(x.users));
    case "tecnologia":
      return [m.devices, m.operatingSystems, m.deviceDetails, m.browsers].some((arr) => Array.isArray(arr) && arr.length > 0);
    case "organico":
      return positive(m.organicClicks) || positive(m.organicImpressions) || (Array.isArray(m.queries) && m.queries.length > 0);
    case "demografia":
      return [m.genders, m.regions, m.countries, m.cities].some((arr) => Array.isArray(arr) && arr.length > 0);
    case "validacion":
    case "fuentes-dashboard":
      return Array.isArray(m.base) && m.base.length > 0;
    default:
      return true;
  }
}

export interface SubmoduleAvailability {
  hasChannels: boolean;
  hasSources: boolean;
  hasUserComposition: boolean;
  hasTech: boolean;
  hasGeo: boolean;
  hasDevices: boolean;
  hasOperatingSystems: boolean;
  hasDeviceDetails: boolean;
  hasBrowsers: boolean;
  hasGenders: boolean;
  hasRegions: boolean;
  hasCountries: boolean;
  hasCities: boolean;
}

export function submoduleAvailability(m: DashboardModel | null): SubmoduleAvailability {
  const arr = (x: unknown): boolean => Array.isArray(x) && x.length > 0;
  return {
    hasChannels: arr(m?.channels),
    hasSources: arr(m?.sources),
    hasUserComposition: Number(m?.newUsers || 0) > 0 || Number(m?.returningUsers || 0) > 0,
    hasTech: [m?.devices, m?.operatingSystems, m?.deviceDetails, m?.browsers].some(arr),
    hasGeo: [m?.genders, m?.regions, m?.countries, m?.cities].some(arr),
    hasDevices: arr(m?.devices),
    hasOperatingSystems: arr(m?.operatingSystems),
    hasDeviceDetails: arr(m?.deviceDetails),
    hasBrowsers: arr(m?.browsers),
    hasGenders: arr(m?.genders),
    hasRegions: arr(m?.regions),
    hasCountries: arr(m?.countries),
    hasCities: arr(m?.cities),
  };
}
