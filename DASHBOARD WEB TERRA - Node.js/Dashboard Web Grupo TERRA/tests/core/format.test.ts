import { describe, it, expect } from "vitest";
import {
  norm,
  esc,
  fmt,
  pct,
  parseNum,
  hasMetricValue,
  dateISO,
  dateLabel,
  parseReportDateToken,
} from "@/lib/core/format";

describe("norm", () => {
  it("quita acentos, colapsa espacios y normaliza separadores", () => {
    expect(norm("  Sesión / Fuente  ")).toBe("sesion/fuente");
  });

  it("quita el BOM inicial", () => {
    const withBom = String.fromCharCode(0xfeff) + "Fecha";
    expect(norm(withBom)).toBe("fecha");
  });
});

describe("esc", () => {
  it("escapa caracteres HTML peligrosos", () => {
    expect(esc("<script>&\"'</script>")).toBe("&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;");
  });
});

describe("fmt/pct", () => {
  it("formatea numeros en es-EC", () => {
    expect(fmt(1234.5)).toBe("1.235");
    expect(fmt(45.678)).toBe("45,68");
  });

  it("formatea porcentajes aceptando fraccion (0-1) o porcentaje ya expresado en 0-100", () => {
    expect(pct(0.4567)).toBe("45,67%");
    expect(pct(45.67)).toBe("45,67%");
  });
});

describe("parseNum", () => {
  it("interpreta separador decimal es-EC (miles con punto, decimales con coma)", () => {
    expect(parseNum("1.234,56")).toBeCloseTo(1234.56);
  });
  it("interpreta separador decimal en-US (miles con coma, decimales con punto)", () => {
    expect(parseNum("1,234.56")).toBeCloseTo(1234.56);
  });
  it("ignora simbolo de porcentaje y espacios", () => {
    expect(parseNum("45%")).toBe(45);
  });
  it("trata el guion largo como cero, no como NaN", () => {
    expect(parseNum(String.fromCharCode(0x2014))).toBe(0);
  });
  it("interpreta parentesis como negativo", () => {
    expect(parseNum("(12,5)")).toBeCloseTo(-12.5);
  });
});

describe("hasMetricValue", () => {
  it("distingue string vacio / guion largo de un valor real (incluyendo 0)", () => {
    expect(hasMetricValue("")).toBe(false);
    expect(hasMetricValue(String.fromCharCode(0x2014))).toBe(false);
    expect(hasMetricValue("0")).toBe(true);
  });
});

describe("fechas", () => {
  it("parsea tokens YYYYMMDD, YYYY-MM-DD y DD/MM/YYYY", () => {
    expect(dateISO(parseReportDateToken("20240115"))).toBe("2024-01-15");
    expect(dateISO(parseReportDateToken("2024-01-15"))).toBe("2024-01-15");
    expect(dateISO(parseReportDateToken("15/01/2024"))).toBe("2024-01-15");
  });

  it("dateLabel devuelve guion largo para fechas invalidas", () => {
    expect(dateLabel(null)).toBe(String.fromCharCode(0x2014));
  });
});
