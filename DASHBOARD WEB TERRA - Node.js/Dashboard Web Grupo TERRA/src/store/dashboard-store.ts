// Estado global del dashboard (equivalente a src/state.js + la orquestacion de main.js del
// proyecto original), ahora como store "vanilla" de Zustand (sin dependencia de React).
// Se mantiene el mismo shape (files, datasets, filteredDatasets, model, settings,
// dataSourceName) mas los modulos exportables y el estado de la barra superior, para que
// el resto del codigo (charts, secciones, exportacion) siga leyendo/escribiendo un unico
// lugar via `dashboardStoreApi.getState()` (igual que el objeto `state` mutable original).
//
// Este archivo NO debe importar nada de "zustand/react" ni de React: lo importan tanto
// lib/* (charts, secciones, exportacion) como el motor de exportacion standalone (ver
// lib/export/engine-entry.ts, compilado aparte con esbuild), y cualquier referencia a
// React aqui se colaria en ese bundle. El hook de React (para componentes) vive aparte, en
// store/use-dashboard-store.ts.
import { createStore, type StoreApi } from "zustand/vanilla";
import { buildModel } from "@/lib/core/model/build-model";
import { parseCSV, readTextFile } from "@/lib/core/csv/parse";
import { classify } from "@/lib/core/csv/classify";
import { dateISO, parseReportDateToken } from "@/lib/core/format";
import { requestGoogleAccessToken, revokeGoogleAccessToken } from "@/lib/integrations/google/oauth";
import { fetchGA4Properties, fetchAllGA4Datasets, type GA4Property } from "@/lib/integrations/google/ga4";
import { fetchGSCSites, fetchGSCDataset } from "@/lib/integrations/google/search-console";
import type { DashboardModel, Dataset, Settings } from "@/lib/core/types";

export interface ExportModuleDef {
  id: string;
  label: string;
  checked: boolean;
}

export const DEFAULT_EXPORT_MODULES: ExportModuleDef[] = [
  { id: "resumen", label: "Resumen tecnico", checked: true },
  { id: "trafico", label: "Trafico por canales", checked: true },
  { id: "usuarios", label: "Usuarios y fuentes", checked: true },
  { id: "audiencias", label: "Audiencias", checked: true },
  { id: "paginas", label: "Paginas mas visitadas", checked: true },
  { id: "tecnologia", label: "Tecnologia", checked: true },
  { id: "organico", label: "Busqueda organica", checked: true },
  { id: "demografia", label: "Demografia", checked: true },
  { id: "validacion", label: "Validacion tecnica", checked: false },
  { id: "fuentes-dashboard", label: "Reportes procesados", checked: false },
];

const DEFAULT_SETTINGS: Settings = { dateFrom: "", dateTo: "", dateMode: "safe" };

export type BannerType = "warn" | "ok" | "bad";

export interface BannerState {
  type: BannerType;
  message: string;
}

const DEFAULT_BANNER: BannerState = { type: "warn", message: "Sin datos cargados. Selecciona los CSV y presiona Procesar." };

function csvSourceName(files: File[]): string {
  const names = files.map((f) => f.name.replace(/\.csv$/i, ""));
  if (!names.length) return "CSV";
  return names.length <= 2 ? names.join("+") : `${names[0]}+${names.length - 1}_mas`;
}

export interface GoogleState {
  connected: boolean;
  status: string;
  ga4Properties: GA4Property[];
  gscSites: string[];
}

const DEFAULT_GOOGLE_STATE: GoogleState = {
  connected: false,
  status: "No conectado. Los datos seguiran viniendo de los CSV mientras no conectes una cuenta.",
  ga4Properties: [],
  gscSites: [],
};

function googleSourceName(propertyId: string, siteUrl: string, ga4Properties: GA4Property[]): string {
  const propLabel = ga4Properties.find((p) => p.id === propertyId)?.label || "";
  const accountName = propLabel ? propLabel.split(" - ")[0].trim() : "";
  if (accountName) return accountName;
  const gscName = siteUrl ? siteUrl.replace(/^sc-domain:/i, "").replace(/^https?:\/\//i, "").replace(/\/$/, "") : "";
  return gscName || "GoogleAnalytics";
}

export interface DashboardState {
  files: File[];
  datasets: Dataset[];
  filteredDatasets: Dataset[];
  model: DashboardModel | null;
  dataSourceName: string;
  settings: Settings;
  exportModules: ExportModuleDef[];
  topStatus: string;
  banner: BannerState;
  processing: boolean;
  google: GoogleState;

  setSettings: (partial: Partial<Settings>) => void;
  refreshModel: () => void;
  resetAll: () => void;
  setExportModuleChecked: (id: string, checked: boolean) => void;
  setAllExportModules: (checked: boolean) => void;

  pickFiles: (files: File[]) => void;
  processDashboard: () => Promise<void>;
  applyDateFilter: () => void;
  fillDetectedDateRange: () => void;

  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => void;
  processFromGoogle: (propertyId: string, siteUrl: string) => Promise<void>;
}

// Store "vanilla", sin dependencia de React: es el que deben importar lib/* (charts,
// secciones, exportacion, motor de exportacion standalone) para lectura/escritura
// imperativa (`dashboardStoreApi.getState()`), nunca `useDashboardStore` (el hook, mas
// abajo), para que ese codigo agnostico de framework no arrastre React a sus bundles.
export const dashboardStoreApi: StoreApi<DashboardState> = createStore<DashboardState>((set, get) => ({
  files: [],
  datasets: [],
  filteredDatasets: [],
  model: null,
  dataSourceName: "",
  settings: { ...DEFAULT_SETTINGS },
  exportModules: DEFAULT_EXPORT_MODULES.map((m) => ({ ...m })),
  topStatus: "Sin datos cargados",
  banner: { ...DEFAULT_BANNER },
  processing: false,
  google: { ...DEFAULT_GOOGLE_STATE },

  setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

  // Recalcula el modelo a partir de datasets/settings y actualiza filteredDatasets (el
  // array ya recortado por el filtro de fechas), que la exportacion a HTML usa para
  // "congelar" el rango de fechas seleccionado (ver lib/export/export-html.ts).
  refreshModel: () => {
    const { datasets, settings } = get();
    const model = buildModel(datasets, settings);
    set({ model, filteredDatasets: model.base });
  },

  resetAll: () =>
    set({
      files: [],
      datasets: [],
      filteredDatasets: [],
      model: null,
      dataSourceName: "",
      settings: { ...DEFAULT_SETTINGS },
      topStatus: "Sin datos cargados",
      banner: { ...DEFAULT_BANNER },
    }),

  setExportModuleChecked: (id, checked) =>
    set((s) => ({ exportModules: s.exportModules.map((m) => (m.id === id ? { ...m, checked } : m)) })),
  setAllExportModules: (checked) => set((s) => ({ exportModules: s.exportModules.map((m) => ({ ...m, checked })) })),

  pickFiles: (files) => {
    const csvFiles = files.filter((f) => /\.csv$/i.test(f.name));
    set({
      files: csvFiles,
      datasets: [],
      filteredDatasets: [],
      model: null,
      topStatus: `${csvFiles.length} CSV seleccionado(s). Presiona Procesar.`,
    });
  },

  processDashboard: async () => {
    const { files } = get();
    if (!files.length) return;
    set({ processing: true, topStatus: "Procesando archivos...", banner: { type: "warn", message: "Procesando y validando CSV..." } });
    try {
      const datasets: Dataset[] = [];
      for (const file of files) {
        const text = await readTextFile(file);
        const parsed = parseCSV(text);
        const type = classify(file.name, parsed.columns);
        if (type === "otro") {
          parsed.warnings = [
            ...(parsed.warnings || []),
            "No se pudo clasificar este archivo en ningun modulo del dashboard (trafico, usuarios, audiencias, paginas, tecnologia, organico o demografia). No se usara en los calculos. Verifica que sea una exportacion estandar de GA4 o Search Console.",
          ];
        }
        datasets.push({ name: file.name, type, ...parsed });
      }
      const dataSourceName = csvSourceName(files);
      const model = buildModel(datasets, get().settings);
      set({
        datasets,
        dataSourceName,
        model,
        filteredDatasets: model.base,
        processing: false,
        topStatus: `${datasets.length} reportes procesados - ${model.warnings.length} advertencia(s)`,
        banner: model.warnings.length
          ? { type: "warn", message: `Dashboard procesado con ${model.warnings.length} advertencia(s). Revisa Validacion tecnica.` }
          : { type: "ok", message: "Dashboard procesado correctamente." },
      });
    } catch (err) {
      console.error(err);
      set({
        processing: false,
        topStatus: "Error de procesamiento",
        banner: { type: "bad", message: "No fue posible procesar uno o mas archivos. Verifica que sean CSV validos." },
      });
    }
  },

  applyDateFilter: () => {
    const { datasets } = get();
    if (!datasets.length) {
      alert("Primero carga y procesa los CSV.");
      return;
    }
    get().refreshModel();
    set({ banner: { type: "ok", message: "Filtro de fechas aplicado. Revisa si el resultado fue exacto o agregado." } });
  },

  fillDetectedDateRange: () => {
    const { datasets } = get();
    const ranges = datasets.filter((d) => d.reportStart && d.reportEnd).map((d) => ({ start: d.reportStart as Date, end: d.reportEnd as Date }));
    if (!ranges.length) {
      alert("No se detecto un rango en los CSV procesados.");
      return;
    }
    let min = ranges[0].start;
    let max = ranges[0].end;
    ranges.forEach((r) => {
      if (r.start < min) min = r.start;
      if (r.end > max) max = r.end;
    });
    get().setSettings({ dateFrom: dateISO(min), dateTo: dateISO(max) });
    get().applyDateFilter();
  },

  connectGoogle: async () => {
    set((s) => ({ google: { ...s.google, status: "Cargando autenticacion de Google..." } }));
    try {
      await requestGoogleAccessToken();
      set((s) => ({ google: { ...s.google, status: "Conectado. Cargando propiedades disponibles..." } }));
      const [ga4Properties, gscSites] = await Promise.all([fetchGA4Properties(), fetchGSCSites()]);
      set({
        google: {
          connected: true,
          ga4Properties,
          gscSites,
          status: `Conectado. ${ga4Properties.length} propiedad(es) de GA4 y ${gscSites.length} sitio(s) de Search Console detectados.`,
        },
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "error desconocido";
      set((s) => ({
        google: {
          ...s.google,
          status: `No fue posible conectar con Google: ${message}. Verifica el Client ID, el origen autorizado y que tu cuenta este agregada como usuario de prueba en Google Cloud Console.`,
        },
      }));
    }
  },

  disconnectGoogle: () => {
    revokeGoogleAccessToken();
    set({ google: { ...DEFAULT_GOOGLE_STATE } });
  },

  processFromGoogle: async (propertyId, siteUrl) => {
    if (!propertyId && !siteUrl) {
      alert("Selecciona al menos una propiedad de GA4 o un sitio de Search Console.");
      return;
    }
    const { ga4Properties } = get().google;
    const dataSourceName = googleSourceName(propertyId, siteUrl, ga4Properties);
    const settings = get().settings;
    const dateFrom =
      settings.dateFrom ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      })();
    const dateTo = settings.dateTo || new Date().toISOString().slice(0, 10);
    const reportStart = parseReportDateToken(dateFrom);
    const reportEnd = parseReportDateToken(dateTo);
    set({ processing: true, topStatus: "Consultando Google Analytics / Search Console...", banner: { type: "warn", message: "Consultando datos en vivo desde Google..." } });
    try {
      const datasets: Dataset[] = [];
      if (propertyId) {
        const ga4Datasets = await fetchAllGA4Datasets(propertyId, dateFrom, dateTo, reportStart, reportEnd);
        datasets.push(...ga4Datasets);
      }
      if (siteUrl) {
        const gscDataset = await fetchGSCDataset(siteUrl, dateFrom, dateTo, reportStart, reportEnd);
        datasets.push(gscDataset);
      }
      const model = buildModel(datasets, settings);
      set({
        datasets,
        dataSourceName,
        model,
        filteredDatasets: model.base,
        processing: false,
        topStatus: `${datasets.length} reportes obtenidos de Google - ${model.warnings.length} advertencia(s)`,
        banner: model.warnings.length
          ? { type: "warn", message: `Datos de Google procesados con ${model.warnings.length} advertencia(s). El modulo Audiencias no se completa por esta via.` }
          : { type: "ok", message: "Datos de Google procesados correctamente. El modulo Audiencias no se completa por esta via." },
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "error desconocido";
      set({
        processing: false,
        topStatus: "Error al consultar Google",
        banner: { type: "bad", message: "No fue posible obtener los datos de Google: " + message },
      });
    }
  },
}));
