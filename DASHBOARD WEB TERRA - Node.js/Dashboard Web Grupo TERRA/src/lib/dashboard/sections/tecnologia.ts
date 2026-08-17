import { esc, pct } from "../../core/format";
import { metricTotal } from "../../charts/chart-utils";
import { renderBarChart } from "../../charts/bar-chart";
import { renderDonutChart } from "../../charts/donut-chart";
import type { DashboardModel } from "../../core/types";

export function renderTechnology(m: DashboardModel): void {
  renderDonutChart("deviceDonut", m.devices, { metric: "usuarios o sesiones", maxSegments: 8, centerLabel: "Tecnologia" });
  renderDonutChart("osDonut", m.operatingSystems, { metric: "usuarios o sesiones", maxSegments: 8, centerLabel: "Sistemas" });
  renderBarChart("deviceDetailBars", m.deviceDetails, {
    metric: "usuarios o sesiones",
    limit: 100,
    scrollClass: "limit-10",
    empty: "No se cargo un CSV con Marca del dispositivo movil o Modelo del dispositivo movil.",
  });
  renderBarChart("browserBars", m.browsers, { metric: "usuarios o sesiones", limit: 100 });
  renderBarChart("screenBars", m.screenFormats, {
    metric: "usuarios o sesiones",
    limit: 60,
    empty: "No se cargo un informe con la dimension Resolucion de pantalla. Disponible automaticamente al conectar con Google.",
  });

  const dev = m.devices[0];
  const os = m.operatingSystems?.[0];
  const detail = m.deviceDetails?.[0];
  const browser = m.browsers[0];
  const screen = m.screenFormats?.[0];
  const total = metricTotal(m.devices);
  const techNoteEl = document.getElementById("techNote");
  if (techNoteEl) {
    techNoteEl.innerHTML =
      dev || browser || os
        ? `<b>Lectura tecnica:</b> el dispositivo dominante es <b>${esc(dev?.label || "no detectado")}</b>${
            dev ? ` con ${pct(total ? dev.value / total : 0)} de participacion` : ""
          }; el sistema operativo principal es <b>${esc(os?.label || "no detectado")}</b>; ${
            detail
              ? `la ${m.deviceDetailType || "marca/modelo"} principal es <b>${esc(detail.label)}</b>`
              : "para identificar iPhone, Samsung, Redmi u otros equipos debes cargar un CSV con <b>Marca del dispositivo movil</b> o <b>Modelo del dispositivo movil</b>"
          }; el navegador principal es <b>${esc(browser?.label || "no detectado")}</b>; ${
            screen
              ? `el formato de pantalla mas usado es <b>${esc(screen.label)}</b>, util para saber a que resolucion debe verse bien el sitio primero`
              : "para saber en que resolucion de pantalla se ve tu sitio, carga un CSV con la dimension Resolucion de pantalla"
          }.`
        : "<b>Lectura tecnica:</b> exporta Detalles tecnologicos con Categoria de dispositivo, Sistema operativo, Marca o Modelo del dispositivo y Navegador.";
  }
}
