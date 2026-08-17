"use client";

import { useRef } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { selectedExportIds } from "@/lib/dashboard/export-selection";
import { exportProcessedHTML } from "@/lib/export/export-html";

export default function TopBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const files = useDashboardStore((s) => s.files);
  const model = useDashboardStore((s) => s.model);
  const processing = useDashboardStore((s) => s.processing);
  const topStatus = useDashboardStore((s) => s.topStatus);
  const pickFiles = useDashboardStore((s) => s.pickFiles);
  const processDashboard = useDashboardStore((s) => s.processDashboard);
  const resetAll = useDashboardStore((s) => s.resetAll);

  const canExport = !!model && selectedExportIds().length > 0;

  return (
    <header className="top sticky top-0 z-50 flex min-h-[58px] border-b border-border bg-surface [grid-column:1/-1] max-[900px]:z-[100] max-[900px]:flex-wrap">
      <button
        id="mobileMenuBtn"
        type="button"
        aria-controls="sidebar"
        aria-expanded="false"
        aria-label="Abrir menu de navegacion"
        className="menu-toggle ml-2.5 hidden h-10 w-10 flex-none place-items-center rounded-[10px] border border-border-2 bg-surface-2 text-xl leading-none text-text transition hover:border-orange hover:bg-orange/10 hover:text-orange-2 max-[900px]:grid"
      >
        ☰
      </button>
      <div className="brand flex min-h-[58px] w-[230px] items-center gap-2.5 border-r border-border px-[18px] max-[900px]:w-auto max-[900px]:min-w-0 max-[900px]:flex-1 max-[900px]:border-r-0 max-[900px]:px-2.5">
        <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-gradient-to-br from-orange to-[#ffd09a]">🌱</div>
        <div>
          <b className="block text-sm max-[900px]:text-[13px]">Grupo TERRA</b>
          <span className="block text-[10px] font-black text-muted-2 max-[900px]:text-[9px]">
            Dashboard Tecnico Web V15 - Datos automatizados GA4 y Search Console
          </span>
        </div>
      </div>
      <div className="topmid flex min-w-0 flex-1 items-center gap-2.5 px-[18px] max-[900px]:hidden">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-orange/35 bg-orange/[.11] px-3 py-[5px] text-[11px] font-extrabold text-orange-2">
          Analitica tecnica
        </span>
        <span id="topStatus" className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-2">
          {topStatus}
        </span>
      </div>
      <div className="topright flex flex-wrap items-center justify-end gap-[7px] py-2 pr-3.5 max-[900px]:w-full max-[900px]:flex-nowrap max-[900px]:justify-start max-[900px]:overflow-x-auto max-[900px]:border-t max-[900px]:border-border max-[900px]:bg-[rgba(17,24,39,.98)] max-[900px]:px-2.5 max-[900px]:py-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn shrink-0 whitespace-nowrap rounded-[10px] border border-border-2 bg-transparent px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-surface-2 hover:text-text"
        >
          Cargar CSV
        </button>
        <span
          className="inline-grid h-3.5 w-3.5 cursor-help place-items-center rounded-full bg-white/10 text-[10px] font-black text-muted-2"
          data-tip="Selecciona uno o varios CSV de GA4 o Search Console. El sistema detecta separador, encabezados desplazados, columnas, periodo del reporte y calidad de lectura automaticamente."
        >
          i
        </span>
        <button
          id="processBtn"
          type="button"
          disabled={!files.length || processing}
          onClick={() => processDashboard()}
          className="btn shrink-0 whitespace-nowrap rounded-[10px] border border-orange bg-orange px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#e86c00] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Procesar
        </button>
        <button
          id="exportBtn"
          type="button"
          disabled={!canExport}
          onClick={() => exportProcessedHTML()}
          className="btn shrink-0 whitespace-nowrap rounded-[10px] border border-border-2 bg-transparent px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-35"
        >
          Exportar HTML
        </button>
        <button
          type="button"
          onClick={() => resetAll()}
          className="btn shrink-0 whitespace-nowrap rounded-[10px] border border-border-2 bg-transparent px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-surface-2 hover:text-text"
        >
          Reiniciar
        </button>
        <input
          ref={inputRef}
          id="csvInput"
          type="file"
          accept=".csv,text/csv"
          multiple
          hidden
          onChange={(e) => {
            const list = e.target.files ? [...e.target.files] : [];
            pickFiles(list);
          }}
        />
      </div>
    </header>
  );
}
