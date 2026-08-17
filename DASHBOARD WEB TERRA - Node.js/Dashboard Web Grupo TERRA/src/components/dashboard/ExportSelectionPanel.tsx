"use client";

import { useDashboardStore } from "@/store/use-dashboard-store";
import { availableExportModuleCount, toggleAllAccordions } from "@/lib/dashboard/export-selection";

const btnClass = "btn rounded-[10px] border border-border-2 bg-transparent px-2.5 py-1.5 text-[11px] font-extrabold text-muted transition hover:bg-surface-2 hover:text-text";

export default function ExportSelectionPanel() {
  const model = useDashboardStore((s) => s.model);
  const setAllExportModules = useDashboardStore((s) => s.setAllExportModules);
  // Se suscribe a exportModules para re-renderizar el conteo cuando el usuario marca/desmarca.
  useDashboardStore((s) => s.exportModules);
  const { checked, total } = availableExportModuleCount();

  return (
    <div className="card exportPanel rounded-terra border border-border bg-surface p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
      <div className="cardtitle mb-2.5 flex items-center gap-1.5 text-[13px] font-black text-text">Configuracion del informe HTML</div>
      <div className="cardsub -mt-1 mb-3 text-[11px] text-muted-2">
        Marca o desmarca &quot;Incluir en HTML&quot; en el encabezado de cada modulo. Las graficas, tablas y comentarios
        seleccionados se conservaran en el informe.
      </div>
      <div className="selectionbar mt-2.5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setAllExportModules(true)} className={btnClass}>
          Seleccionar todo
        </button>
        <button type="button" onClick={() => setAllExportModules(false)} className={btnClass}>
          Limpiar seleccion
        </button>
        <button type="button" onClick={() => toggleAllAccordions(true)} className={btnClass}>
          Expandir modulos
        </button>
        <button type="button" onClick={() => toggleAllAccordions(false)} className={btnClass}>
          Contraer modulos
        </button>
      </div>
      <div id="exportSelectionStatus" className="export-status mt-2.5 text-xs text-muted">
        {checked} de {total} modulos {model ? "disponibles " : ""}seleccionados para el informe HTML.
      </div>
    </div>
  );
}
