// Parser de CSV con deteccion automatica de separador y de la fila de encabezado.
// Logica pura (no toca el DOM) salvo readTextFile, que necesita un objeto File del navegador.
import { norm, parseNum, parseReportDateToken, dateLabel } from "../format";
import { metricKeys, labelKeys, synonyms } from "./synonyms";
import type { ParsedCsv } from "../types";

// Construidos con String.fromCharCode (no literales) por la misma razon que en format.ts:
// evitar caracteres invisibles/BOM/null crudos en el archivo fuente.
const BOM = String.fromCharCode(0xfeff);
const NULL_CHAR = String.fromCharCode(0x0000);
const REPLACEMENT_CHAR = String.fromCharCode(0xfffd);
const LEADING_BOM = new RegExp("^" + BOM);
const NULL_CHARS = new RegExp(NULL_CHAR, "g");
const REPLACEMENT_CHARS = new RegExp(REPLACEMENT_CHAR, "g");

export function splitRows(text: string, d: string): string[][] {
  text = String(text || "").replace(LEADING_BOM, "").replace(NULL_CHARS, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const nx = text[i + 1];
    if (ch === '"') {
      if (q && nx === '"') {
        cell += '"';
        i++;
      } else q = !q;
    } else if (ch === d && !q) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !q) {
      if (ch === "\r" && nx === "\n") i++;
      row.push(cell);
      if (row.some((x) => String(x).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((x) => String(x).trim() !== "")) rows.push(row);
  return rows.map((r) => r.map((c) => String(c ?? "").trim().replace(/^"|"$/g, "")));
}

export function detectDelimiter(text: string): string {
  let best = ",";
  let score = -1;
  for (const d of [",", ";", "\t", "|"]) {
    const rows = splitRows(text, d).slice(0, 70);
    const counts = rows.map((r) => r.length).filter((x) => x > 1);
    const max = Math.max(0, ...counts);
    const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
    const s = max * 3 + avg + counts.length / 10;
    if (s > score) {
      score = s;
      best = d;
    }
  }
  return best;
}

// Longitud minima para permitir una coincidencia "difusa" (subcadena) entre una celda y
// un sinonimo. Sin este limite, un valor de dato corto como "iOS" hace match por subcadena
// dentro de la palabra "usuarios" (u-s-u-a-r-IOS), inflando el puntaje de una fila de datos
// por encima del encabezado real. Los nombres de columna reales casi siempre superan este
// largo, asi que el limite no reduce coincidencias legitimas.
const MIN_FUZZY_MATCH_LENGTH = 4;

export function headerScore(row: string[], next: string[][] = []): number {
  const cells = row.map(norm).filter(Boolean);
  if (cells.length < 2) return -100;
  let score = cells.length;
  [...metricKeys, ...labelKeys].forEach((k) =>
    (synonyms[k] || []).map(norm).forEach((s) => {
      if (
        cells.some(
          (c) =>
            c === s ||
            (c.length >= MIN_FUZZY_MATCH_LENGTH && c.includes(s)) ||
            (c.length >= MIN_FUZZY_MATCH_LENGTH && s.includes(c))
        )
      ) {
        score += 5;
      }
    })
  );
  const joined = cells.join("|");
  if (/usuarios|sesiones|rebote|canal|fuente|pagina|dispositivo|navegador|consulta|clics|impresiones|sexo|edad|pais|ciudad/.test(joined)) {
    score += 12;
  }
  if (/resumen|informe|periodo|fecha|agrota/.test(joined) && cells.length < 4) score -= 10;
  let nums = 0;
  next.slice(0, 6).forEach((r) =>
    r.forEach((c) => {
      if (parseNum(c) !== 0) nums++;
    })
  );
  return score + Math.min(12, nums);
}

export function uniqueColumns(cols: string[]): string[] {
  const seen: Record<string, number> = {};
  return cols.map((c, i) => {
    const b = String(c || `Columna ${i + 1}`).trim().replace(LEADING_BOM, "") || `Columna ${i + 1}`;
    seen[b] = (seen[b] || 0) + 1;
    return seen[b] === 1 ? b : `${b} ${seen[b]}`;
  });
}

export function findRowDateCol(cols: string[]): string | null {
  return (
    (cols || []).find((c) => {
      const n = norm(c);
      return /^(fecha|date|dia|day)$/.test(n) || /(^| )(fecha|date|dia|day|mes|month|semana|week)( |$)/.test(n);
    }) || null
  );
}

export function extractReportDates(text: string): { start: Date | null; end: Date | null } {
  const out: { start: Date | null; end: Date | null } = { start: null, end: null };
  const lines = String(text || "").split(/\r?\n/).slice(0, 40).join("\n");
  let m = lines.match(/Fecha\s+de\s+inicio\s*:\s*([0-9\-/]+)/i);
  if (m) out.start = parseReportDateToken(m[1]);
  m = lines.match(/Fecha\s+de\s+finalizaci[oó]n\s*:\s*([0-9\-/]+)/i);
  if (m) out.end = parseReportDateToken(m[1]);
  return out;
}

export function parseCSV(text: string): ParsedCsv {
  const delimiter = detectDelimiter(text);
  const raw = splitRows(text, delimiter);
  const meta = extractReportDates(text);
  if (!raw.length) {
    return {
      columns: [],
      rows: [],
      delimiter,
      headerIndex: -1,
      rawRows: 0,
      warnings: ["Archivo vacio"],
      notices: [],
      reportStart: meta.start,
      reportEnd: meta.end,
      rowDateCol: null,
    };
  }
  let best = 0;
  let bestScore = -999;
  raw.slice(0, 90).forEach((r, i) => {
    const score = headerScore(r, raw.slice(i + 1, i + 8));
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  const columns = uniqueColumns(raw[best]);
  const rows = raw
    .slice(best + 1)
    .filter((r) => r.some((c) => String(c).trim() !== ""))
    .map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i] ?? ""])));
  const warnings: string[] = [];
  const notices: string[] = [];
  if (columns.length <= 1) warnings.push("Se detecto una sola columna. Revise el separador o la exportacion.");
  if (best > 10) warnings.push("El encabezado se encontro despues de la fila 10. Validar el archivo.");
  const rowDateCol = findRowDateCol(columns);
  if (!rowDateCol && meta.start && meta.end) {
    notices.push(
      `Reporte agregado por periodo (${dateLabel(meta.start)} a ${dateLabel(meta.end)}). La lectura es valida; solo limita el filtrado exacto por dia.`
    );
  }
  if (!rowDateCol && (!meta.start || !meta.end)) {
    notices.push("No se detecto Fecha por fila ni rango en metadatos. El archivo se procesa completo mientras no se aplique un filtro de fechas.");
  }
  return {
    columns,
    rows,
    delimiter,
    headerIndex: best,
    rawRows: raw.length,
    warnings,
    notices,
    reportStart: meta.start,
    reportEnd: meta.end,
    rowDateCol,
  };
}

export async function readTextFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let text = new TextDecoder("utf-8").decode(buf);
  const replacementCount = (text.match(REPLACEMENT_CHARS) || []).length;
  const nullCount = (text.match(NULL_CHARS) || []).length;
  if (replacementCount > 20 || nullCount > 10) {
    try {
      text = new TextDecoder("utf-16le").decode(buf);
    } catch {
      // Se conserva el texto UTF-8 si la decodificacion alternativa falla.
    }
  }
  return text;
}
