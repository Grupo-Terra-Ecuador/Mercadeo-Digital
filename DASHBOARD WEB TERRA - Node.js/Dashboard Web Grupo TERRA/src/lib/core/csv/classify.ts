// Clasifica un CSV cargado (por nombre de archivo y columnas) en uno de los modulos
// del dashboard: trafico, usuarios, audiencias, paginas, tecnologia, organico, demografia.
import { norm } from "../format";
import { hasCol } from "./synonyms";
import type { DatasetType } from "../types";

export function classify(name: string, cols: string[]): DatasetType {
  const n = norm(name);
  const j = norm(cols.join(" "));
  if (
    (n.includes("consulta") || n.includes("query") || j.includes("consulta")) &&
    (j.includes("impresiones") || j.includes("clicks") || j.includes("clics"))
  ) {
    return "organico";
  }
  if (
    n.includes("adquisicion_de_trafico") ||
    n.includes("traffic_acquisition") ||
    n.includes("traffic acquisition") ||
    j.includes("session default channel group") ||
    j.includes("grupo de canales principal de la sesion")
  ) {
    return "trafico";
  }
  if (
    n.includes("adquisicion_de_usuarios") ||
    n.includes("user_acquisition") ||
    n.includes("user acquisition") ||
    j.includes("first user default channel group") ||
    j.includes("grupo de canales principal del primer usuario")
  ) {
    return "usuarios";
  }
  if (n.includes("audiencia") || n.includes("audience") || hasCol(cols, "audienceName")) return "audiencias";
  if (
    n.includes("paginas_y_pantallas") ||
    n.includes("pages_and_screens") ||
    n.includes("pages and screens") ||
    n.includes("pagina_de_destino") ||
    hasCol(cols, "page")
  ) {
    return "paginas";
  }
  if (
    n.includes("tecnologia") ||
    n.includes("tech") ||
    n.includes("navegador") ||
    n.includes("sistema_operativo") ||
    n.includes("device_model") ||
    n.includes("device_brand") ||
    n.includes("modelo_del_dispositivo") ||
    n.includes("marca_del_dispositivo") ||
    hasCol(cols, "device") ||
    hasCol(cols, "operatingSystem") ||
    hasCol(cols, "deviceBrand") ||
    hasCol(cols, "deviceModel") ||
    hasCol(cols, "browser")
  ) {
    return "tecnologia";
  }
  if (
    n.includes("demograf") ||
    n.includes("sexo") ||
    n.includes("pais") ||
    n.includes("ciudad") ||
    n.includes("region") ||
    n.includes("provincia") ||
    hasCol(cols, "gender") ||
    hasCol(cols, "country") ||
    hasCol(cols, "region") ||
    hasCol(cols, "city")
  ) {
    return "demografia";
  }
  return "otro";
}

export function labelType(t: string): string {
  return (
    (
      {
        trafico: "Trafico",
        usuarios: "Usuarios",
        audiencias: "Audiencias",
        paginas: "Paginas",
        tecnologia: "Tecnologia",
        organico: "Busqueda organica",
        demografia: "Demografia",
        otro: "Otro",
        pendiente: "Pendiente",
      } as Record<string, string>
    )[t] || t
  );
}
