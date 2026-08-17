// Integracion con la Search Console API (listar sitios verificados y consultar
// searchAnalytics).
import { googleFetch } from "./oauth";
import type { Dataset } from "../../core/types";

export async function fetchGSCSites(): Promise<string[]> {
  const data = await googleFetch<{ siteEntry?: { siteUrl: string }[] }>("https://www.googleapis.com/webmasters/v3/sites");
  return (data.siteEntry || []).map((s) => s.siteUrl);
}

interface GSCReportResponse {
  rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[];
}

export async function runGSCReport(siteUrl: string, dateFrom: string, dateTo: string): Promise<GSCReportResponse> {
  const body = { startDate: dateFrom, endDate: dateTo, dimensions: ["query"], rowLimit: 5000 };
  return googleFetch<GSCReportResponse>(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function gscResponseToDataset(apiResponse: GSCReportResponse, reportStart: Date | null, reportEnd: Date | null): Dataset {
  const columns = ["Consulta", "Clics", "Impresiones", "CTR", "Posicion media"];
  const rows = (apiResponse.rows || []).map((r) => ({
    Consulta: r.keys?.[0] ?? "",
    Clics: String(r.clicks ?? 0),
    Impresiones: String(r.impressions ?? 0),
    CTR: String(r.ctr ?? 0),
    "Posicion media": String(r.position ?? 0),
  }));
  return {
    name: "Search Console - Consultas (API)",
    type: "organico",
    columns,
    rows,
    delimiter: ",",
    headerIndex: 0,
    rawRows: rows.length + 1,
    warnings: [],
    notices: ["Datos obtenidos automaticamente desde la API de Search Console."],
    reportStart,
    reportEnd,
    rowDateCol: null,
  };
}

export async function fetchGSCDataset(siteUrl: string, dateFrom: string, dateTo: string, reportStart: Date | null, reportEnd: Date | null): Promise<Dataset> {
  const gsc = await runGSCReport(siteUrl, dateFrom, dateTo);
  return gscResponseToDataset(gsc, reportStart, reportEnd);
}
