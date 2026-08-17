import { describe, it, expect } from "vitest";
import { parseCSV } from "@/lib/core/csv/parse";
import { classify } from "@/lib/core/csv/classify";
import { buildModel } from "@/lib/core/model/build-model";
import { isDateFilterActive, filterDatasetByDate } from "@/lib/core/model/date-filter";
import type { Dataset, Settings } from "@/lib/core/types";

function toDataset(name: string, text: string): Dataset {
  const parsed = parseCSV(text);
  const type = classify(name, parsed.columns);
  return { name, type, ...parsed };
}

const TRAFFIC_CSV = [
  "Fecha de inicio: 20240101",
  "Fecha de finalizacion: 20240131",
  "",
  "Grupo de canales principal de la sesion,Sesiones,Usuarios totales,Porcentaje de rebote",
  'Organic Search,1200,900,"45,5%"',
  'Direct,300,250,"38,2%"',
  'Total,1500,1150,"43,1%"',
].join("\n");

const USERS_CSV = [
  "Fecha de inicio: 20240101",
  "Fecha de finalizacion: 20240131",
  "",
  "Primer grupo de canales principal del usuario,Usuarios totales,Usuarios nuevos",
  "Organic Search,800,650",
  "Direct,200,180",
  "Total,1000,830",
].join("\n");

const NO_FILTER_SETTINGS: Settings = { dateFrom: "", dateTo: "", dateMode: "safe" };

describe("buildModel", () => {
  it("agrega usuarios totales, nuevos y estima recurrentes cuando el CSV no los trae", () => {
    const datasets = [toDataset("adquisicion_de_trafico.csv", TRAFFIC_CSV), toDataset("adquisicion_de_usuarios.csv", USERS_CSV)];
    const model = buildModel(datasets, NO_FILTER_SETTINGS);

    expect(model.totalUsers).toBe(1000);
    expect(model.newUsers).toBe(830);
    expect(model.returningUsers).toBe(170);
    expect(model.returningEstimated).toBe(true);
    expect(model.sessions).toBe(1500);
  });

  it("combina el informe de trafico y el de usuarios en una sola tabla de canales", () => {
    const datasets = [toDataset("adquisicion_de_trafico.csv", TRAFFIC_CSV), toDataset("adquisicion_de_usuarios.csv", USERS_CSV)];
    const model = buildModel(datasets, NO_FILTER_SETTINGS);
    const organic = model.channels.find((c) => c.label === "Organic Search");

    expect(organic?.sessions).toBe(1200);
    expect(organic?.users).toBe(800);
    expect(organic?.newUsers).toBe(650);
  });

  it('excluye las filas "Total" del calculo de agregados', () => {
    const datasets = [toDataset("adquisicion_de_trafico.csv", TRAFFIC_CSV)];
    const model = buildModel(datasets, NO_FILTER_SETTINGS);
    const total = model.channels.reduce((s, c) => s + c.sessions, 0);
    expect(total).toBe(1500);
  });

  it("no rompe con cero datasets", () => {
    const model = buildModel([], NO_FILTER_SETTINGS);
    expect(model.totalUsers).toBe(0);
    expect(model.channels).toEqual([]);
  });
});

describe("filtro de fechas responsable", () => {
  it("isDateFilterActive es false sin dateFrom/dateTo", () => {
    expect(isDateFilterActive(NO_FILTER_SETTINGS)).toBe(false);
  });

  it("conserva el total agregado completo cuando el CSV no tiene fecha por fila (modo safe)", () => {
    const dataset = toDataset("adquisicion_de_trafico.csv", TRAFFIC_CSV);
    const filtered = filterDatasetByDate(dataset, { dateFrom: "2024-01-10", dateTo: "2024-01-20", dateMode: "safe" });

    expect(filtered.filterStatus).toBe("incluido como agregado completo");
    expect(filtered.rows).toHaveLength(dataset.rows.length);
  });

  it("excluye el dataset agregado no filtrable en modo estricto", () => {
    const dataset = toDataset("adquisicion_de_trafico.csv", TRAFFIC_CSV);
    const filtered = filterDatasetByDate(dataset, { dateFrom: "2024-01-10", dateTo: "2024-01-20", dateMode: "strict" });

    expect(filtered.filterStatus).toBe("excluido: agregado no filtrable");
    expect(filtered.rows).toHaveLength(0);
  });

  it("excluye datasets cuyo rango de reporte no se solapa con el filtro", () => {
    const dataset = toDataset("adquisicion_de_trafico.csv", TRAFFIC_CSV);
    const filtered = filterDatasetByDate(dataset, { dateFrom: "2024-03-01", dateTo: "2024-03-31", dateMode: "safe" });

    expect(filtered.filterStatus).toBe("excluido: fuera del rango");
    expect(filtered.rows).toHaveLength(0);
  });
});
