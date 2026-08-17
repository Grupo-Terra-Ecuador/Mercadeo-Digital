// Seleccion de modulos a incluir en el HTML exportado. A diferencia del proyecto original
// (que leia checkboxes del DOM con querySelectorAll), el estado "incluido" de cada modulo
// vive en el store (dashboardStoreApi.exportModules) y los componentes React lo controlan
// directamente; esta funcion solo cruza esa seleccion con la disponibilidad real de datos.
import { dashboardStoreApi } from "@/store/dashboard-store";
import { moduleHasData, type ModuleId } from "./module-availability";

export function selectedExportIds(): string[] {
  const { exportModules, model } = dashboardStoreApi.getState();
  return exportModules.filter((m) => m.checked && moduleHasData(m.id as ModuleId, model)).map((m) => m.id);
}

export function availableExportModuleCount(): { checked: number; total: number } {
  const { exportModules, model } = dashboardStoreApi.getState();
  const available = exportModules.filter((m) => moduleHasData(m.id as ModuleId, model));
  return { checked: available.filter((m) => m.checked).length, total: available.length };
}

// Los acordeones de modulo son <details> nativos: se controlan imperativamente (igual que
// en el proyecto original) para que "Expandir/Contraer modulos" siga funcionando tal cual
// en el HTML exportado, que no ejecuta React.
export function toggleAllAccordions(open: boolean): void {
  document.querySelectorAll<HTMLDetailsElement>("details.accordion").forEach((d) => (d.open = open));
}
