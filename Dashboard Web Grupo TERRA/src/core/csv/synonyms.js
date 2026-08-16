// Diccionario de sinonimos ES/EN usado para reconocer columnas de exportaciones de
// GA4 y Search Console sin importar el idioma o la redaccion exacta del encabezado.
// Es el corazon del producto: aqui vive el conocimiento de dominio, no en la UI.
import { norm } from '../format.js';

export const synonyms = {
  users: ['usuarios totales', 'total users', 'usuarios activos', 'active users', 'usuarios', 'total de usuarios'],
  newUsers: ['usuarios nuevos', 'new users', 'nuevos usuarios'],
  returningUsers: ['usuarios recurrentes', 'returning users', 'usuarios que vuelven', 'usuarios establecidos'],
  audienceName: ['nombre de la audiencia', 'audience name', 'nombre de audiencia'],
  sessions: ['sesiones', 'sessions'],
  engagedSessions: ['sesiones con interaccion', 'sesiones interactivas', 'engaged sessions'],
  bounceRate: ['porcentaje de rebote', 'porcentaje de rebotes', 'tasa de rebote', 'bounce rate', 'bounce rate percentage'],
  engagementRate: [
    'porcentaje de interacciones',
    'porcentaje de interaccion',
    'tasa de interaccion',
    'engagement rate',
    'interaction rate',
  ],
  channelSession: [
    'grupo de canales principal de la sesion',
    'session default channel group',
    'grupo de canales de la sesion',
  ],
  channelFirst: [
    'primer grupo de canales principal del usuario',
    'grupo de canales principal del primer usuario',
    'first user default channel group',
    'grupo de canales del primer usuario',
  ],
  dayOfWeek: ['dia de la semana', 'day of week', 'dia semana', 'dayofweek'],
  hour: ['hora', 'hour'],
  screenResolution: ['resolucion de pantalla', 'formato de pantalla', 'screen resolution', 'resolucion'],
  activeUsers: ['usuarios activos', 'active users'],
  engagementDuration: [
    'tiempo de interaccion total',
    'tiempo de interaccion',
    'user engagement duration',
    'userengagementduration',
  ],
  eventCount: ['numero de eventos', 'recuento de eventos', 'event count', 'eventos'],
  channel: ['grupo de canales', 'default channel group', 'canal'],
  sourceSession: [
    'fuente de la sesion / medio',
    'fuente de la sesion/medio de la sesion',
    'fuente de la sesion',
    'session source / medium',
    'session source medium',
    'session source',
  ],
  sourceFirst: [
    'fuente del primer usuario / medio',
    'fuente del primer usuario/medio del primer usuario',
    'fuente del primer usuario',
    'first user source / medium',
    'first user source medium',
    'first user source',
  ],
  source: ['fuente / medio', 'fuente/medio', 'source / medium', 'source medium', 'fuente', 'source', 'campana'],
  page: [
    'ruta de pagina y clase de pantalla',
    'page path and screen class',
    'ruta de pagina',
    'page path',
    'pagina de destino',
    'landing page',
    'pagina',
    'page',
  ],
  views: ['vistas', 'views', 'screen page views', 'vistas de pagina'],
  device: ['categoria de dispositivo', 'device category', 'dispositivo'],
  operatingSystem: ['sistema operativo', 'operating system'],
  deviceBrand: ['marca del dispositivo movil', 'marca del dispositivo', 'mobile device branding', 'mobile device brand', 'device brand'],
  deviceModel: ['modelo del dispositivo movil', 'modelo del dispositivo', 'mobile device model', 'device model'],
  browser: ['navegador', 'browser'],
  query: ['consulta', 'query', 'search term', 'consulta de la busqueda de google organica'],
  clicks: ['clics', 'clicks', 'organic google search clicks', 'clics de busqueda organica'],
  impressions: ['impresiones', 'impressions'],
  ctr: ['ctr', 'porcentaje de clics', 'click through rate'],
  position: ['posicion media', 'average position', 'posicion'],
  gender: ['sexo', 'gender', 'genero'],
  country: ['pais', 'country'],
  region: ['region', 'provincia', 'state'],
  city: ['ciudad', 'city'],
};

export const metricKeys = [
  'users', 'newUsers', 'returningUsers', 'sessions', 'engagedSessions', 'bounceRate',
  'engagementRate', 'views', 'clicks', 'impressions', 'ctr', 'position',
];

export const labelKeys = [
  'channelSession', 'channelFirst', 'channel', 'sourceSession', 'sourceFirst', 'source',
  'audienceName', 'page', 'device', 'operatingSystem', 'deviceBrand', 'deviceModel',
  'browser', 'query', 'gender', 'country', 'region', 'city',
];

export function bestCol(cols, type) {
  const list = cols.map((raw) => ({ raw, n: norm(raw) }));
  const syn = (synonyms[type] || []).map(norm);
  for (const s of syn) {
    const e = list.find((c) => c.n === s);
    if (e) return e.raw;
  }
  for (const s of syn) {
    const e = list.find((c) => c.n.includes(s) || s.includes(c.n));
    if (e) return e.raw;
  }
  return null;
}

export function hasCol(cols, type) {
  return !!bestCol(cols, type);
}
