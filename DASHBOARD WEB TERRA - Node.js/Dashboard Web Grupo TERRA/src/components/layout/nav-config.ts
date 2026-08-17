import type { ModuleId } from "@/lib/dashboard/module-availability";

export interface NavLink {
  id: string;
  label: string;
  moduleId?: ModuleId;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Carga",
    links: [
      { id: "carga", label: "Archivos" },
      { id: "resumen", label: "Resumen", moduleId: "resumen" },
    ],
  },
  {
    label: "Analitica",
    links: [
      { id: "trafico", label: "Trafico por canales", moduleId: "trafico" },
      { id: "usuarios", label: "Usuarios y fuentes", moduleId: "usuarios" },
      { id: "audiencias", label: "Audiencias", moduleId: "audiencias" },
      { id: "paginas", label: "Paginas", moduleId: "paginas" },
      { id: "tecnologia", label: "Tecnologia", moduleId: "tecnologia" },
      { id: "organico", label: "Busqueda organica", moduleId: "organico" },
      { id: "demografia", label: "Demografia", moduleId: "demografia" },
    ],
  },
  {
    label: "Control",
    links: [
      { id: "validacion", label: "Validacion", moduleId: "validacion" },
      { id: "fuentes-dashboard", label: "Reportes procesados", moduleId: "fuentes-dashboard" },
    ],
  },
];
