// Estado global mutable de la aplicacion (equivalente al `state` del archivo original) y
// la lista de modulos exportables. Vive en un solo lugar para que el resto de modulos lo
// importen en vez de declarar variables globales sueltas.
export const state = {
  files: [],
  datasets: [],
  filteredDatasets: [],
  model: null,
  dataSourceName: '',
  settings: { dateFrom: '', dateTo: '', dateMode: 'safe' },
};

export const EXPORT_MODULES = [
  { id: 'resumen', label: 'Resumen tecnico', checked: true },
  { id: 'trafico', label: 'Trafico por canales', checked: true },
  { id: 'usuarios', label: 'Usuarios y fuentes', checked: true },
  { id: 'audiencias', label: 'Audiencias', checked: true },
  { id: 'paginas', label: 'Paginas mas visitadas', checked: true },
  { id: 'tecnologia', label: 'Tecnologia', checked: true },
  { id: 'organico', label: 'Busqueda organica', checked: true },
  { id: 'demografia', label: 'Demografia', checked: true },
  { id: 'validacion', label: 'Validacion tecnica', checked: false },
  { id: 'fuentes-dashboard', label: 'Reportes procesados', checked: false },
];
