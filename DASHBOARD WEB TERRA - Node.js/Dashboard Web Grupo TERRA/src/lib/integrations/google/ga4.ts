// Integracion con la Google Analytics Admin API (listar propiedades) y la GA4 Data API
// (correr reportes). Devuelve datos; el llamador (store) decide que hacer con ellos, en vez
// de escribir directamente en el DOM como el proyecto original (aqui la lista de
// propiedades se renderiza declarativamente desde React).
import { googleFetch } from "./oauth";
import { GA4_TOTALS_DATASET_NAME } from "../../core/model/dataset-names";
import type { Dataset, DatasetType } from "../../core/types";

export interface GA4Property {
  id: string;
  label: string;
}

interface GA4AccountSummary {
  displayName: string;
  propertySummaries?: { property: string; displayName: string }[];
}

export async function fetchGA4Properties(): Promise<GA4Property[]> {
  const data = await googleFetch<{ accountSummaries?: GA4AccountSummary[] }>(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200"
  );
  const props: GA4Property[] = [];
  (data.accountSummaries || []).forEach((acc) =>
    (acc.propertySummaries || []).forEach((p) =>
      props.push({ id: p.property.replace("properties/", ""), label: `${acc.displayName} - ${p.displayName}` })
    )
  );
  return props;
}

interface GA4RunReportResponse {
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
}

export async function runGA4Report(
  propertyId: string,
  dimensionNames: string | string[],
  metricNames: string[],
  dateFrom: string,
  dateTo: string
): Promise<GA4RunReportResponse> {
  const names = Array.isArray(dimensionNames) ? dimensionNames : [dimensionNames];
  const body = {
    dimensions: names.map((name) => ({ name })),
    metrics: metricNames.map((name) => ({ name })),
    dateRanges: [{ startDate: dateFrom, endDate: dateTo }],
    limit: 100000,
  };
  return googleFetch<GA4RunReportResponse>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function ga4ResponseToDataset(
  name: string,
  type: DatasetType,
  dimHeaders: string | string[],
  metricHeaders: string[],
  apiResponse: GA4RunReportResponse,
  reportStart: Date | null,
  reportEnd: Date | null,
  rowDateCol: string | null = null
): Dataset {
  const headers = Array.isArray(dimHeaders) ? dimHeaders : [dimHeaders];
  const columns = [...headers, ...metricHeaders];
  const rows = (apiResponse.rows || []).map((r) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = r.dimensionValues?.[i]?.value ?? "";
    });
    metricHeaders.forEach((h, i) => {
      row[h] = r.metricValues?.[i]?.value ?? "0";
    });
    return row;
  });
  return {
    name,
    type,
    columns,
    rows,
    delimiter: ",",
    headerIndex: 0,
    rawRows: rows.length + 1,
    warnings: [],
    notices: ["Datos obtenidos automaticamente desde la API de Google Analytics."],
    reportStart,
    reportEnd,
    rowDateCol,
  };
}

// Trae y arma todos los datasets de GA4 usados por el dashboard para una propiedad y un
// rango de fechas dado.
export async function fetchAllGA4Datasets(
  propertyId: string,
  dateFrom: string,
  dateTo: string,
  reportStart: Date | null,
  reportEnd: Date | null
): Promise<Dataset[]> {
  const [traffic, userChannel, dayHour, sessionsQuality, usersDaily, totalsAgg, userSource, pages, device, os, model, browser, screen, gender, country, region, city] =
    await Promise.all([
      runGA4Report(propertyId, ["date", "sessionDefaultChannelGroup"], ["sessions", "totalUsers", "bounceRate"], dateFrom, dateTo),
      runGA4Report(propertyId, ["date", "firstUserDefaultChannelGroup"], ["totalUsers", "newUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["date", "dayOfWeek", "hour"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["date"], ["sessions", "bounceRate"], dateFrom, dateTo),
      runGA4Report(propertyId, ["date"], ["totalUsers", "newUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, [], ["totalUsers", "newUsers", "activeUsers", "userEngagementDuration", "eventCount"], dateFrom, dateTo),
      runGA4Report(propertyId, ["firstUserSourceMedium"], ["totalUsers", "newUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["pagePathPlusQueryString"], ["screenPageViews", "totalUsers", "bounceRate"], dateFrom, dateTo),
      runGA4Report(propertyId, ["deviceCategory"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["operatingSystem"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["mobileDeviceModel"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["browser"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["screenResolution"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["userGender"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["country"], ["totalUsers", "bounceRate"], dateFrom, dateTo),
      runGA4Report(propertyId, ["country", "region"], ["totalUsers"], dateFrom, dateTo),
      runGA4Report(propertyId, ["country", "city"], ["totalUsers"], dateFrom, dateTo),
    ]);

  return [
    ga4ResponseToDataset(
      "GA4 - Trafico por canal (API)",
      "trafico",
      ["Fecha", "Grupo de canales principal de la sesion"],
      ["Sesiones", "Usuarios totales", "Porcentaje de rebote"],
      traffic,
      reportStart,
      reportEnd,
      "Fecha"
    ),
    ga4ResponseToDataset(
      "GA4 - Usuarios por canal (API)",
      "usuarios",
      ["Fecha", "Primer grupo de canales principal del usuario"],
      ["Usuarios totales", "Usuarios nuevos"],
      userChannel,
      reportStart,
      reportEnd,
      "Fecha"
    ),
    ga4ResponseToDataset(
      "GA4 - Usuarios por dia y hora (API)",
      "usuarios",
      ["Fecha", "Dia de la semana", "Hora"],
      ["Usuarios totales"],
      dayHour,
      reportStart,
      reportEnd,
      "Fecha"
    ),
    ga4ResponseToDataset(
      "GA4 - Sesiones y rebote por dia (API)",
      "trafico",
      ["Fecha"],
      ["Sesiones", "Porcentaje de rebote"],
      sessionsQuality,
      reportStart,
      reportEnd,
      "Fecha"
    ),
    ga4ResponseToDataset(
      "GA4 - Usuarios por dia (API)",
      "usuarios",
      ["Fecha"],
      ["Usuarios totales", "Usuarios nuevos"],
      usersDaily,
      reportStart,
      reportEnd,
      "Fecha"
    ),
    ga4ResponseToDataset(
      GA4_TOTALS_DATASET_NAME,
      "usuarios",
      [],
      ["Usuarios totales", "Usuarios nuevos", "Usuarios activos", "Tiempo de interaccion total", "Numero de eventos"],
      totalsAgg,
      reportStart,
      reportEnd
    ),
    ga4ResponseToDataset(
      "GA4 - Usuarios por fuente (API)",
      "usuarios",
      ["Fuente del primer usuario / medio"],
      ["Usuarios totales", "Usuarios nuevos"],
      userSource,
      reportStart,
      reportEnd
    ),
    ga4ResponseToDataset(
      "GA4 - Paginas (API)",
      "paginas",
      ["Ruta de pagina y clase de pantalla"],
      ["Vistas", "Usuarios totales", "Porcentaje de rebote"],
      pages,
      reportStart,
      reportEnd
    ),
    ga4ResponseToDataset("GA4 - Dispositivo (API)", "tecnologia", ["Categoria de dispositivo"], ["Usuarios totales"], device, reportStart, reportEnd),
    ga4ResponseToDataset("GA4 - Sistema operativo (API)", "tecnologia", ["Sistema operativo"], ["Usuarios totales"], os, reportStart, reportEnd),
    ga4ResponseToDataset(
      "GA4 - Modelo de dispositivo (API)",
      "tecnologia",
      ["Modelo del dispositivo movil"],
      ["Usuarios totales"],
      model,
      reportStart,
      reportEnd
    ),
    ga4ResponseToDataset("GA4 - Navegador (API)", "tecnologia", ["Navegador"], ["Usuarios totales"], browser, reportStart, reportEnd),
    ga4ResponseToDataset(
      "GA4 - Formato de pantalla (API)",
      "tecnologia",
      ["Formato de pantalla"],
      ["Usuarios totales"],
      screen,
      reportStart,
      reportEnd
    ),
    ga4ResponseToDataset("GA4 - Sexo (API)", "demografia", ["Sexo"], ["Usuarios totales"], gender, reportStart, reportEnd),
    ga4ResponseToDataset("GA4 - Pais (API)", "demografia", ["Pais"], ["Usuarios totales", "Porcentaje de rebote"], country, reportStart, reportEnd),
    ga4ResponseToDataset("GA4 - Region (API)", "demografia", ["Pais", "Region"], ["Usuarios totales"], region, reportStart, reportEnd),
    ga4ResponseToDataset("GA4 - Ciudad (API)", "demografia", ["Pais", "Ciudad"], ["Usuarios totales"], city, reportStart, reportEnd),
  ];
}
