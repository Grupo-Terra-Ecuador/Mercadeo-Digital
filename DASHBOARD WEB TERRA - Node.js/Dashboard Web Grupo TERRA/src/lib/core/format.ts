// Utilidades puras de normalizacion, formato y parseo de valores/fechas.
// Sin dependencias del DOM: son las funciones mas faciles y valiosas de testear.
//
// Los caracteres especiales/invisibles (marcas combinantes, BOM, NBSP, simbolos de
// moneda, guion largo) se construyen con String.fromCharCode en vez de escribirlos
// literalmente en el archivo, para evitar problemas de normalizacion Unicode al
// guardar/editar este archivo con distintas herramientas.
const CHAR = {
  bom: String.fromCharCode(0xfeff),
  nbsp: String.fromCharCode(0x00a0),
  emDash: String.fromCharCode(0x2014),
  euro: String.fromCharCode(0x20ac),
  pound: String.fromCharCode(0x00a3),
  combiningStart: 0x0300,
  combiningEnd: 0x036f,
};

function charRange(start: number, end: number): string {
  let out = "";
  for (let c = start; c <= end; c++) out += String.fromCharCode(c);
  return out;
}

const COMBINING_DIACRITICS = new RegExp("[" + charRange(CHAR.combiningStart, CHAR.combiningEnd) + "]", "g");
const LEADING_BOM = new RegExp("^" + CHAR.bom);
const CURRENCY_AND_SPACE_CHARS = new RegExp("[%$" + CHAR.euro + CHAR.pound + "\\s" + CHAR.nbsp + "]", "g");
const EM_DASH = CHAR.emDash;

export function norm(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(LEADING_BOM, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

export function esc(s: unknown): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (m) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[m]
  );
}

export function fmt(n: unknown): string {
  const v = Number(n || 0);
  return isFinite(v) ? v.toLocaleString("es-EC", { maximumFractionDigits: v >= 100 ? 0 : 2 }) : "0";
}

export function pct(n: unknown): string {
  const v = Number(n || 0);
  if (!isFinite(v)) return "0%";
  return (
    ((v > 1 ? v / 100 : v) * 100).toLocaleString("es-EC", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }) + "%"
  );
}

export function fmtCompact(n: unknown): string {
  const v = Number(n || 0);
  if (!isFinite(v)) return "0";
  const abs = Math.abs(v);
  if (abs >= 1000000) {
    return (v / 1000000).toLocaleString("es-EC", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " M";
  }
  if (abs >= 1000) {
    return (v / 1000).toLocaleString("es-EC", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " mil";
  }
  return v.toLocaleString("es-EC", { maximumFractionDigits: 0 });
}

export function fmtDuration(secondsInput: unknown): string {
  let seconds = Math.round(Number(secondsInput || 0));
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  if (seconds < 60) return `${seconds} s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} h y ${m} min`;
  return s > 0 ? `${m} min y ${s} s` : `${m} min`;
}

export function parseNum(v: unknown): number {
  if (v == null) return 0;
  let s = String(v).trim();
  if (!s || s === EM_DASH || s === "-") return 0;
  let neg = false;
  if (s.includes("(") && s.includes(")")) {
    neg = true;
    s = s.replace(/[()]/g, "");
  }
  s = s.replace(CURRENCY_AND_SPACE_CHARS, "");
  const lc = s.lastIndexOf(",");
  const ld = s.lastIndexOf(".");
  if (lc > -1 && ld > -1) {
    s = lc > ld ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lc > -1) {
    const p = s.split(",");
    s = p.length === 2 && p[1].length <= 2 ? p[0].replace(/\./g, "") + "." + p[1] : s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return (neg ? -1 : 1) * (isFinite(n) ? n : 0);
}

export function normalizeRate(v: unknown): number {
  const n = parseNum(v);
  return n > 1 ? n / 100 : n;
}

export function hasMetricValue(v: unknown): boolean {
  const s = String(v ?? "").trim();
  return s !== "" && s !== EM_DASH && s !== "-";
}

export function rateStatus(rate: number): "bad" | "warn" | "ok" {
  return rate >= 0.7 ? "bad" : rate >= 0.5 ? "warn" : "ok";
}

export function parseReportDateToken(input: unknown): Date | null {
  const s = String(input || "").trim();
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function dateISO(d: unknown): string {
  return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
}

export function dateLabel(d: unknown): string {
  return dateISO(d) || EM_DASH;
}
