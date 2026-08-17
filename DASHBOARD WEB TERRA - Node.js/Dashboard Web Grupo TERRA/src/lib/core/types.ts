// Tipos compartidos del modelo de datos del dashboard. Portados desde la forma implicita
// que tenian los objetos planos del proyecto original (Vite + JS vanilla).

export type DatasetType =
  | "trafico"
  | "usuarios"
  | "audiencias"
  | "paginas"
  | "tecnologia"
  | "organico"
  | "demografia"
  | "otro"
  | "pendiente";

export type CsvRow = Record<string, string>;

export interface ParsedCsv {
  columns: string[];
  rows: CsvRow[];
  delimiter: string;
  headerIndex: number;
  rawRows: number;
  warnings: string[];
  notices: string[];
  reportStart: Date | null;
  reportEnd: Date | null;
  rowDateCol: string | null;
}

export interface Dataset extends ParsedCsv {
  name: string;
  type: DatasetType;
  filterStatus?: string;
  filterRowsBefore?: number;
  filterRowsAfter?: number;
}

export type DateMode = "safe" | "strict";

export interface Settings {
  dateFrom: string;
  dateTo: string;
  dateMode: DateMode;
}

export interface AggregateItem {
  label: string;
  value: number;
}

export interface GroupedRow {
  label: string;
  users: number;
  newUsers: number;
  returningUsers: number;
  sessions: number;
  views: number;
  clicks: number;
  impressions: number;
  bounceRate: number;
  position: number;
  ctr: number;
  usersAvailable?: boolean;
  newUsersAvailable?: boolean;
  returningUsersAvailable?: boolean;
  sessionsAvailable?: boolean;
  viewsAvailable?: boolean;
  clicksAvailable?: boolean;
  impressionsAvailable?: boolean;
  bounceAvailable?: boolean;
  positionAvailable?: boolean;
}

export type MetricKey =
  | "users"
  | "newUsers"
  | "returningUsers"
  | "sessions"
  | "engagedSessions"
  | "bounceRate"
  | "engagementRate"
  | "views"
  | "clicks"
  | "impressions"
  | "ctr"
  | "position";

export type LabelKey =
  | "channelSession"
  | "channelFirst"
  | "channel"
  | "sourceSession"
  | "sourceFirst"
  | "source"
  | "audienceName"
  | "page"
  | "device"
  | "operatingSystem"
  | "deviceBrand"
  | "deviceModel"
  | "browser"
  | "query"
  | "gender"
  | "country"
  | "region"
  | "city";

export type SynonymKey =
  | MetricKey
  | LabelKey
  | "dayOfWeek"
  | "hour"
  | "screenResolution"
  | "activeUsers"
  | "engagementDuration"
  | "eventCount";

export interface DateInfo {
  detectedStart: Date | null;
  detectedEnd: Date | null;
  active: boolean;
  exact: number;
  aggregated: number;
  excluded: number;
}

export interface DashboardModel {
  base: Dataset[];
  traffic: Dataset[];
  usersDs: Dataset[];
  audienceDs: Dataset[];
  pages: Dataset[];
  tech: Dataset[];
  organic: Dataset[];
  demo: Dataset[];
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  returningEstimated: boolean;
  sessions: number;
  bounce: { value: number; derived: boolean };
  channels: GroupedRow[];
  sources: GroupedRow[];
  audiences: GroupedRow[];
  pageRows: GroupedRow[];
  devices: AggregateItem[];
  operatingSystems: AggregateItem[];
  deviceDetails: AggregateItem[];
  deviceDetailType: string;
  browsers: AggregateItem[];
  screenFormats: AggregateItem[];
  queries: GroupedRow[];
  organicClicks: number;
  organicImpressions: number;
  organicCtr: number;
  organicPosition: number;
  genders: AggregateItem[];
  regions: GroupedRow[];
  countries: GroupedRow[];
  cities: GroupedRow[];
  warnings: { file: string; msg: string }[];
  dateInfo: DateInfo;
  primary: {
    user: Dataset | null;
    traffic: Dataset | null;
    channel: Dataset | null;
    source: Dataset | null;
    audience: Dataset | null;
    page: Dataset | null;
    device: Dataset | null;
    operatingSystem: Dataset | null;
    deviceModel: Dataset | null;
    deviceBrand: Dataset | null;
    browser: Dataset | null;
    organic: Dataset | null;
    region: Dataset | null;
    city: Dataset | null;
  };
}
