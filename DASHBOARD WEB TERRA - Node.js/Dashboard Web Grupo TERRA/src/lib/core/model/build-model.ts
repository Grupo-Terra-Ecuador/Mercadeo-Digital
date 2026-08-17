// Orquesta el modelo completo del dashboard a partir de los datasets cargados: elige el
// "mejor" dataset por seccion, calcula metricas totales y arma cada agrupacion (canales,
// fuentes, audiencias, paginas, tecnologia, organico, demografia).
//
// buildModel(datasets, settings) recibe sus datos de entrada como parametros en vez de leer
// un estado global: no muta nada externo, solo devuelve el modelo. El llamador (el store)
// es responsable de guardar el resultado.
import { bestCol } from "../csv/synonyms";
import {
  metricFrom,
  firstPositiveMetric,
  bounceFromDatasets,
  groupRows,
  aggregate,
  bestDataset,
  weightedRate,
} from "./aggregate";
import { isDateFilterActive, filterDatasetByDate } from "./date-filter";
import { GA4_TOTALS_DATASET_NAME } from "./dataset-names";
import type { DashboardModel, Dataset, DatasetType, GroupedRow, Settings } from "../types";

const DATASET_PRIORITY: Record<DatasetType, number> = {
  usuarios: 0,
  audiencias: 1,
  trafico: 2,
  paginas: 3,
  tecnologia: 4,
  organico: 5,
  demografia: 6,
  otro: 9,
  pendiente: 9,
};

export function datasetPriority(type: DatasetType): number {
  return DATASET_PRIORITY[type] ?? 9;
}

export function summarizeDateFilter(allDatasets: Dataset[], base: Dataset[], settings: Settings): DashboardModel["dateInfo"] {
  const ranges = allDatasets
    .filter((d) => d.reportStart && d.reportEnd)
    .map((d) => ({ start: d.reportStart as Date, end: d.reportEnd as Date }));
  let min: Date | null = null;
  let max: Date | null = null;
  ranges.forEach((r) => {
    if (!min || r.start < min) min = r.start;
    if (!max || r.end > max) max = r.end;
  });
  return {
    detectedStart: min,
    detectedEnd: max,
    active: isDateFilterActive(settings),
    exact: base.filter((d) => d.filterStatus === "filtrado exacto por fecha").length,
    aggregated: base.filter((d) => String(d.filterStatus || "").includes("agregado")).length,
    excluded: base.filter((d) => d.filterRowsAfter === 0 && isDateFilterActive(settings)).length,
  };
}

function emptyGroupedRow(label: string): GroupedRow {
  return {
    label,
    users: 0,
    newUsers: 0,
    returningUsers: 0,
    sessions: 0,
    views: 0,
    clicks: 0,
    impressions: 0,
    bounceRate: 0,
    position: 0,
    ctr: 0,
  };
}

export function buildModel(datasets: Dataset[], settings: Settings): DashboardModel {
  const base = datasets
    .map((d) => filterDatasetByDate(d, settings))
    .sort((a, b) => datasetPriority(a.type) - datasetPriority(b.type));

  const traffic = base.filter((d) => d.type === "trafico");
  const usersDs = base.filter((d) => d.type === "usuarios");
  const audienceDs = base.filter((d) => d.type === "audiencias");
  const pages = base.filter((d) => d.type === "paginas");
  const tech = base.filter((d) => d.type === "tecnologia");
  const organic = base.filter((d) => d.type === "organico");
  const demo = base.filter((d) => d.type === "demografia");

  const userPrimary =
    bestDataset(usersDs, ["sourceFirst", "channelFirst"], ["users", "newUsers", "returningUsers"]) ||
    bestDataset(usersDs, [], ["users", "newUsers", "returningUsers"]);
  const trafficPrimary =
    bestDataset(traffic, ["channelSession"], ["sessions", "users", "bounceRate"]) ||
    bestDataset(traffic, ["channel"], ["sessions", "users"]);
  const totalsPrimary = usersDs.find((d) => d.name === GA4_TOTALS_DATASET_NAME) || null;
  const totalUsers =
    (totalsPrimary ? metricFrom(totalsPrimary, "users") : 0) ||
    (userPrimary ? metricFrom(userPrimary, "users") : 0) ||
    firstPositiveMetric(usersDs, "users") ||
    (trafficPrimary ? metricFrom(trafficPrimary, "users") : 0) ||
    firstPositiveMetric(base, "users");
  const newUsers =
    (totalsPrimary ? metricFrom(totalsPrimary, "newUsers") : 0) ||
    (userPrimary ? metricFrom(userPrimary, "newUsers") : 0) ||
    firstPositiveMetric(usersDs, "newUsers") ||
    (trafficPrimary ? metricFrom(trafficPrimary, "newUsers") : 0);
  let returningUsers =
    (userPrimary ? metricFrom(userPrimary, "returningUsers") : 0) ||
    firstPositiveMetric(usersDs, "returningUsers") ||
    (trafficPrimary ? metricFrom(trafficPrimary, "returningUsers") : 0);
  let returningEstimated = false;
  if (!returningUsers && totalUsers && newUsers) {
    returningUsers = Math.max(0, totalUsers - newUsers);
    returningEstimated = true;
  }
  const sessions =
    (trafficPrimary ? metricFrom(trafficPrimary, "sessions") : 0) ||
    firstPositiveMetric(traffic, "sessions") ||
    firstPositiveMetric(base, "sessions");

  let bounce = bounceFromDatasets(trafficPrimary ? [trafficPrimary] : traffic);
  if (!bounce.value) bounce = bounceFromDatasets(userPrimary ? [userPrimary] : usersDs);
  if (!bounce.value) bounce = bounceFromDatasets(pages);
  if (!bounce.value) bounce = bounceFromDatasets(tech);

  const channelPrimary =
    bestDataset(traffic, ["channelSession"], ["sessions", "users", "bounceRate"]) ||
    bestDataset(traffic, ["channel"], ["sessions", "users"]);
  const userChannelPrimary =
    bestDataset(usersDs, ["channelFirst"], ["users", "newUsers", "returningUsers", "bounceRate"]) ||
    bestDataset(usersDs, ["channel"], ["users", "newUsers", "returningUsers"]);
  let channels: GroupedRow[] = channelPrimary
    ? groupRows([channelPrimary], bestCol(channelPrimary.columns, "channelSession") ? "channelSession" : "channel")
    : [];
  if (userChannelPrimary) {
    const userKey = bestCol(userChannelPrimary.columns, "channelFirst") ? "channelFirst" : "channel";
    const userChannelRows = groupRows([userChannelPrimary], userKey);
    const channelMap = new Map(channels.map((x) => [x.label, { ...x }]));
    userChannelRows.forEach((u) => {
      const current = channelMap.get(u.label) || emptyGroupedRow(u.label);
      current.users = u.users || current.users || 0;
      current.newUsers = u.newUsers || current.newUsers || 0;
      current.returningUsers = u.returningUsers || current.returningUsers || 0;
      current.usersAvailable = !!(u.usersAvailable || current.usersAvailable);
      current.newUsersAvailable = !!(u.newUsersAvailable || current.newUsersAvailable);
      current.returningUsersAvailable = !!(u.returningUsersAvailable || current.returningUsersAvailable);
      if (!current.bounceAvailable && u.bounceAvailable) {
        current.bounceRate = u.bounceRate;
        current.bounceAvailable = true;
      }
      channelMap.set(u.label, current);
    });
    channels = [...channelMap.values()];
  }
  channels.sort((a, b) => (b.sessions || 0) - (a.sessions || 0) || (b.users || 0) - (a.users || 0));

  const sourcePrimary =
    bestDataset(usersDs, ["sourceFirst"], ["users", "newUsers", "returningUsers"]) ||
    bestDataset(usersDs, ["source"], ["users", "newUsers", "returningUsers"]) ||
    bestDataset(traffic, ["sourceSession"], ["users", "sessions"]) ||
    bestDataset(traffic, ["source"], ["users", "sessions"]);
  let sources: GroupedRow[] = [];
  if (sourcePrimary) {
    const key = bestCol(sourcePrimary.columns, "sourceFirst")
      ? "sourceFirst"
      : bestCol(sourcePrimary.columns, "sourceSession")
        ? "sourceSession"
        : "source";
    sources = groupRows([sourcePrimary], key);
  }
  sources.sort((a, b) => b.users - a.users || b.sessions - a.sessions);

  const audiencePrimary = bestDataset(audienceDs, ["audienceName"], ["users", "newUsers", "sessions"]);
  const audiences = audiencePrimary
    ? groupRows([audiencePrimary], "audienceName").sort((a, b) => b.users - a.users || b.sessions - a.sessions)
    : [];

  const pagePrimary = bestDataset(pages, ["page"], ["views", "users", "bounceRate"]);
  const pageRows = pagePrimary
    ? groupRows([pagePrimary], "page").sort((a, b) => b.views - a.views || b.users - a.users)
    : [];

  const devicePrimary = bestDataset(tech, ["device"], ["users", "sessions"]);
  let devices = devicePrimary ? aggregate([devicePrimary], "device", "users", 20) : [];
  if (!devices.length && devicePrimary) devices = aggregate([devicePrimary], "device", "sessions", 20);

  const osPrimary = bestDataset(tech, ["operatingSystem"], ["users", "sessions"]);
  let operatingSystems = osPrimary ? aggregate([osPrimary], "operatingSystem", "users", 100) : [];
  if (!operatingSystems.length && osPrimary) operatingSystems = aggregate([osPrimary], "operatingSystem", "sessions", 100);

  const modelPrimary = bestDataset(tech, ["deviceModel"], ["users", "sessions"]);
  const brandPrimary = bestDataset(tech, ["deviceBrand"], ["users", "sessions"]);
  const deviceDetailPrimary = modelPrimary || brandPrimary;
  const deviceDetailKey = modelPrimary ? "deviceModel" : "deviceBrand";
  let deviceDetails = deviceDetailPrimary ? aggregate([deviceDetailPrimary], deviceDetailKey, "users", 250) : [];
  if (!deviceDetails.length && deviceDetailPrimary) {
    deviceDetails = aggregate([deviceDetailPrimary], deviceDetailKey, "sessions", 250);
  }
  const deviceDetailType = modelPrimary ? "modelo" : brandPrimary ? "marca" : "";

  const browserPrimary = bestDataset(tech, ["browser"], ["users", "sessions"]);
  let browsers = browserPrimary ? aggregate([browserPrimary], "browser", "users", 100) : [];
  if (!browsers.length && browserPrimary) browsers = aggregate([browserPrimary], "browser", "sessions", 100);

  const screenPrimary = bestDataset(tech, ["screenResolution"], ["users", "sessions"]);
  let screenFormats = screenPrimary ? aggregate([screenPrimary], "screenResolution", "users", 60) : [];
  if (!screenFormats.length && screenPrimary) screenFormats = aggregate([screenPrimary], "screenResolution", "sessions", 60);

  const organicPrimary = bestDataset(organic, ["query"], ["clicks", "impressions", "position"]);
  const organicDs = organicPrimary ? [organicPrimary] : [];
  const queries = organicDs.length
    ? groupRows(organicDs, "query").sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    : [];
  const organicClicks = queries.reduce((s, x) => s + x.clicks, 0);
  const organicImpressions = queries.reduce((s, x) => s + x.impressions, 0);
  const organicCtr = organicImpressions ? organicClicks / organicImpressions : weightedRate(organicDs, "ctr", "impressions");
  let organicPosition = organicImpressions
    ? queries.reduce((s, x) => s + x.position * x.impressions, 0) / organicImpressions
    : weightedRate(organicDs, "position", "impressions");
  if (!isFinite(organicPosition)) organicPosition = 0;

  const genderPrimary = bestDataset(demo, ["gender"], ["users"]);
  const countryPrimary = bestDataset(demo, ["country"], ["users"]);
  const regionPrimary = bestDataset(demo, ["region"], ["users"]);
  const cityPrimary = bestDataset(demo, ["city"], ["users"]);
  const genders = genderPrimary ? aggregate([genderPrimary], "gender", "users", 30) : [];
  const countries = countryPrimary
    ? groupRows([countryPrimary], "country").filter((x) => x.users > 0).sort((a, b) => b.users - a.users)
    : [];
  const regions = regionPrimary
    ? groupRows([regionPrimary], "region").filter((x) => x.users > 0).sort((a, b) => b.users - a.users)
    : [];
  const cities = cityPrimary
    ? groupRows([cityPrimary], "city").filter((x) => x.users > 0).sort((a, b) => b.users - a.users)
    : [];

  const warnings = base.flatMap((d) => (d.warnings || []).map((msg) => ({ file: d.name, msg })));

  return {
    base,
    traffic,
    usersDs,
    audienceDs,
    pages,
    tech,
    organic,
    demo,
    totalUsers,
    newUsers,
    returningUsers,
    returningEstimated,
    sessions,
    bounce,
    channels,
    sources,
    audiences,
    pageRows,
    devices,
    operatingSystems,
    deviceDetails,
    deviceDetailType,
    browsers,
    screenFormats,
    queries,
    organicClicks,
    organicImpressions,
    organicCtr,
    organicPosition,
    genders,
    regions,
    countries,
    cities,
    warnings,
    dateInfo: summarizeDateFilter(datasets, base, settings),
    primary: {
      user: userPrimary,
      traffic: trafficPrimary,
      channel: channelPrimary,
      source: sourcePrimary,
      audience: audiencePrimary,
      page: pagePrimary,
      device: devicePrimary,
      operatingSystem: osPrimary,
      deviceModel: modelPrimary,
      deviceBrand: brandPrimary,
      browser: browserPrimary,
      organic: organicPrimary,
      region: regionPrimary,
      city: cityPrimary,
    },
  };
}
