import { describe, it, expect } from "vitest";
import { parseCSV } from "@/lib/core/csv/parse";
import { extractDailySeries, fullDateRangeOfDatasets } from "@/lib/charts/trend-chart";
import type { Dataset } from "@/lib/core/types";

function toDataset(name: string, columns: string[], rows: string[][]): Dataset {
  const csv = [columns.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return { name, type: "trafico", ...parseCSV(csv) };
}

describe("extractDailySeries", () => {
  it("agrupa por fecha y por etiqueta, y limita a los `limit` canales con mayor volumen", () => {
    const ds = [
      toDataset(
        "daily.csv",
        ["Fecha", "Grupo de canales principal de la sesion", "Sesiones"],
        [
          ["20240101", "Organic Search", "100"],
          ["20240101", "Direct", "10"],
          ["20240102", "Organic Search", "120"],
          ["20240102", "Direct", "15"],
        ]
      ),
    ];
    const series = extractDailySeries(ds, "channelSession", "sessions", { limit: 5 });
    expect(series?.dates).toHaveLength(2);
    expect(series?.channels).toEqual(["Organic Search", "Direct"]);
    expect(series?.dates[0].values["Organic Search"]).toBe(100);
    expect(series?.dates[1].values["Direct"]).toBe(15);
  });

  it("respeta el rango from/to", () => {
    const ds = [
      toDataset(
        "daily.csv",
        ["Fecha", "Grupo de canales principal de la sesion", "Sesiones"],
        [
          ["20240101", "Organic Search", "100"],
          ["20240115", "Organic Search", "200"],
        ]
      ),
    ];
    const series = extractDailySeries(ds, "channelSession", "sessions", {
      from: new Date(2024, 0, 10),
      to: new Date(2024, 0, 31),
    });
    expect(series?.dates).toHaveLength(1);
    expect(series?.dates[0].values["Organic Search"]).toBe(200);
  });

  it("devuelve null si ningun dataset tiene fecha por fila", () => {
    const ds = [toDataset("sin-fecha.csv", ["Grupo de canales principal de la sesion", "Sesiones"], [["Organic Search", "100"]])];
    expect(extractDailySeries(ds, "channelSession", "sessions")).toBeNull();
  });
});

describe("fullDateRangeOfDatasets", () => {
  it("calcula el rango min/max entre todas las filas con fecha", () => {
    const ds = [
      toDataset(
        "daily.csv",
        ["Fecha", "Sesiones"],
        [
          ["20240105", "1"],
          ["20240120", "2"],
          ["20240110", "3"],
        ]
      ),
    ];
    const { min, max } = fullDateRangeOfDatasets(ds);
    expect(min?.getDate()).toBe(5);
    expect(max?.getDate()).toBe(20);
  });
});
