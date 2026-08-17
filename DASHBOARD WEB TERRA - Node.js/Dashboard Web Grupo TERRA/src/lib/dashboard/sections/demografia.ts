import { esc, norm, parseNum, hasMetricValue, pct } from "../../core/format";
import { bestCol } from "../../core/csv/synonyms";
import { cleanRows } from "../../core/model/aggregate";
import { renderBarChart } from "../../charts/bar-chart";
import { renderDonutChart } from "../../charts/donut-chart";
import { dashboardStoreApi } from "@/store/dashboard-store";
import type { AggregateItem, Dataset, DashboardModel, SynonymKey } from "../../core/types";

export function findDemografiaPrimary(labelKey: SynonymKey): Dataset | null {
  const { datasets } = dashboardStoreApi.getState();
  const src = datasets.filter((d) => d.type === "demografia");
  let best: Dataset | null = null;
  let bestScore = -1;
  for (const d of src) {
    const labelCol = bestCol(d.columns, labelKey);
    const metricCol = bestCol(d.columns, "users") || bestCol(d.columns, "sessions");
    if (!labelCol || !metricCol) continue;
    const score = d.rows.length;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export function populateCountrySelect(selectId: string, primary: Dataset | null, preferred?: string): void {
  const el = document.getElementById(selectId) as HTMLSelectElement | null;
  if (!el) return;
  if (!primary) {
    el.innerHTML = '<option value="">Todos los paises</option>';
    return;
  }
  const countryCol = bestCol(primary.columns, "country");
  if (!countryCol) {
    el.innerHTML = '<option value="">Todos los paises</option>';
    return;
  }
  const countries = [...new Set(cleanRows(primary).map((r) => String(r[countryCol] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const keep = el.value;
  el.innerHTML = '<option value="">Todos los paises</option>' + countries.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  if (keep && countries.includes(keep)) el.value = keep;
  else if (preferred && countries.includes(preferred)) el.value = preferred;
}

export function filterByCountryAndGroup(primary: Dataset | null, labelKey: SynonymKey, countryValue: string): AggregateItem[] {
  if (!primary) return [];
  const countryCol = bestCol(primary.columns, "country");
  const labelCol = bestCol(primary.columns, labelKey);
  const metricCol = bestCol(primary.columns, "users") || bestCol(primary.columns, "sessions");
  if (!labelCol || !metricCol) return [];
  const map = new Map<string, number>();
  cleanRows(primary).forEach((r) => {
    if (countryValue && countryCol && norm(r[countryCol]) !== norm(countryValue)) return;
    const label = String(r[labelCol] || "").trim();
    if (!label) return;
    const val = hasMetricValue(r[metricCol]) ? parseNum(r[metricCol]) : 0;
    map.set(label, (map.get(label) || 0) + val);
  });
  return [...map.entries()].map(([label, value]) => ({ label, value })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
}

export function renderRegionFiltered(): void {
  const primary = findDemografiaPrimary("region");
  const sel = document.getElementById("regionCountrySelect") as HTMLSelectElement | null;
  const chosen = sel ? sel.value : "";
  const data = filterByCountryAndGroup(primary, "region", chosen);
  renderBarChart("regionBars", data, {
    metric: "usuarios",
    limit: 60,
    empty: 'No se cargo un informe con la dimension Region (Provincia). En GA4 esta dimension se llama "Region".',
  });
  renderDonutChart("regionDonut", data, { metric: "usuarios", maxSegments: 8, centerLabel: "Provincias" });
}

export function renderCityFiltered(): void {
  const primary = findDemografiaPrimary("city");
  const sel = document.getElementById("cityCountrySelect") as HTMLSelectElement | null;
  const chosen = sel ? sel.value : "";
  const data = filterByCountryAndGroup(primary, "city", chosen);
  renderBarChart("cityBars", data, { metric: "usuarios", limit: 300, empty: "No se cargo un informe con la dimension Ciudad." });
}

export function renderDemographics(m: DashboardModel): void {
  const countryData = m.countries.map((x) => ({ label: x.label, value: x.users }));
  renderDonutChart("genderDonut", m.genders, { metric: "usuarios", maxSegments: 8, centerLabel: "Sexo" });
  populateCountrySelect("regionCountrySelect", findDemografiaPrimary("region"), "Ecuador");
  populateCountrySelect("cityCountrySelect", findDemografiaPrimary("city"), "Ecuador");
  renderRegionFiltered();
  renderCityFiltered();
  renderDonutChart("countryDonut", countryData, { metric: "usuarios", maxSegments: 8, centerLabel: "Paises" });
  renderBarChart("countryBars", countryData, { metric: "usuarios", limit: 250, empty: "No se cargo un informe con la dimension Pais." });

  const gender = m.genders[0];
  const region = m.regions[0];
  const country = m.countries[0];
  const cities = m.cities.slice(0, 3);
  const demoNoteEl = document.getElementById("demoNote");
  if (demoNoteEl) {
    demoNoteEl.innerHTML =
      gender || region || country || cities.length
        ? `<b>Lectura descriptiva:</b> ${gender ? `sexo principal <b>${esc(gender.label)}</b>` : "sexo no disponible"}; ${
            region ? `provincia/region principal <b>${esc(region.label)}</b>` : "provincia/region no disponible porque no se cargo el CSV de Region"
          }; ${
            country
              ? `pais principal <b>${esc(country.label)}</b>${country.bounceRate ? ` con una tasa de rebote aproximada de ${pct(country.bounceRate)}` : ""}`
              : "pais no disponible"
          }; ${
            cities.length ? `ciudades principales <b>${cities.map((x) => esc(x.label)).join(", ")}</b>` : "ciudad no disponible porque no se cargo el CSV correspondiente"
          }. GA4 puede ocultar o agrupar informacion por umbrales de privacidad.`
        : "<b>Lectura descriptiva:</b> carga reportes demograficos con Sexo, Region (Provincia), Pais y Ciudad.";
  }
}
