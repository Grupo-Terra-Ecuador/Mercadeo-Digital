import { describe, it, expect } from "vitest";
import { splitRows, detectDelimiter, parseCSV } from "@/lib/core/csv/parse";
import { classify } from "@/lib/core/csv/classify";

const GA4_TRAFFIC_CSV = [
  "Grupo TERRA - Adquisicion de trafico",
  "Fecha de inicio: 20240101",
  "Fecha de finalizacion: 20240131",
  "",
  "Grupo de canales principal de la sesion,Sesiones,Usuarios totales,Porcentaje de rebote",
  'Organic Search,1200,900,"45,5%"',
  'Direct,300,250,"38,2%"',
  'Total,1500,1150,"43,1%"',
].join("\n");

describe("detectDelimiter", () => {
  it("detecta coma en un CSV estandar", () => {
    expect(detectDelimiter(GA4_TRAFFIC_CSV)).toBe(",");
  });

  it("detecta punto y coma cuando el archivo lo usa consistentemente", () => {
    const semi = "Canal;Sesiones\nOrganic;100\nDirect;50";
    expect(detectDelimiter(semi)).toBe(";");
  });
});

describe("splitRows", () => {
  it("respeta comillas que contienen el delimitador", () => {
    const rows = splitRows('a,"b,c",d\n1,2,3', ",");
    expect(rows[0]).toEqual(["a", "b,c", "d"]);
  });

  it("descarta filas completamente vacias", () => {
    const rows = splitRows("a,b\n\n1,2", ",");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseCSV", () => {
  it("salta metadatos y encuentra el encabezado real por heuristica", () => {
    const result = parseCSV(GA4_TRAFFIC_CSV);
    expect(result.columns).toContain("Grupo de canales principal de la sesion");
    expect(result.headerIndex).toBe(3);
    expect(result.rows).toHaveLength(3);
  });

  it("extrae el rango de fechas del reporte desde los metadatos", () => {
    const result = parseCSV(GA4_TRAFFIC_CSV);
    expect(result.reportStart?.getFullYear()).toBe(2024);
    expect(result.reportEnd?.getMonth()).toBe(0);
  });

  it("agrega un aviso (no exclusion) cuando el reporte no trae fecha por fila", () => {
    const result = parseCSV(GA4_TRAFFIC_CSV);
    expect(result.rowDateCol).toBeNull();
    expect(result.notices.length).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('no confunde una fila de datos con "iOS" como encabezado (regresion)', () => {
    const csv = [
      "Grupo TERRA - Tecnologia",
      "Fecha de inicio: 20240101",
      "Fecha de finalizacion: 20240105",
      "",
      "Categoria de dispositivo,Sistema operativo,Modelo del dispositivo movil,Navegador,Usuarios totales",
      "mobile,Android,SM-S928B,Chrome,1200",
      "mobile,iOS,iPhone,Safari,900",
      "desktop,Windows,(not set),Chrome,700",
      "desktop,Macintosh,(not set),Safari,400",
      "tablet,iOS,iPad,Safari,150",
    ].join("\n");
    const result = parseCSV(csv);
    expect(result.columns).toEqual([
      "Categoria de dispositivo",
      "Sistema operativo",
      "Modelo del dispositivo movil",
      "Navegador",
      "Usuarios totales",
    ]);
    expect(result.rows).toHaveLength(5);
  });

  it("devuelve estructura vacia segura para texto vacio", () => {
    const result = parseCSV("");
    expect(result.columns).toEqual([]);
    expect(result.warnings).toContain("Archivo vacio");
  });
});

describe("classify", () => {
  it("clasifica por nombre de archivo con convencion de exportacion de GA4", () => {
    const parsed = parseCSV(GA4_TRAFFIC_CSV);
    expect(classify("adquisicion_de_trafico.csv", parsed.columns)).toBe("trafico");
  });

  it("clasifica busqueda organica por combinacion de consulta + impresiones/clics", () => {
    const cols = ["Consulta", "Clics", "Impresiones", "CTR", "Posicion media"];
    expect(classify("search-console-export.csv", cols)).toBe("organico");
  });

  it('cae en "otro" cuando no reconoce ninguna columna ni convencion de nombre', () => {
    expect(classify("reporte-mensual.csv", ["Columna 1", "Columna 2"])).toBe("otro");
  });
});
