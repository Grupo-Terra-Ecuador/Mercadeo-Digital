// Muestra/oculta modulos, submodulos y enlaces de navegacion segun si el modelo trae
// datos reales para cada uno (para no mostrar graficas ni menus vacios sin sentido).
import { EXPORT_MODULES } from '../state.js';
import { updateNavGroupVisibility, syncActiveNavToViewport } from './nav.js';
import { updateExportSelection } from './export-selection.js';

function positive(v) {
  return Number(v || 0) > 0;
}

export function moduleHasData(id, m) {
  if (!m) return true;
  switch (id) {
    case 'resumen':
      return positive(m.totalUsers) || positive(m.newUsers) || positive(m.returningUsers) || positive(m.sessions) || positive(m.bounce?.value);
    case 'trafico':
      return Array.isArray(m.channels) && m.channels.some((x) => positive(x.sessions) || positive(x.users));
    case 'usuarios':
      return positive(m.totalUsers) || positive(m.newUsers) || positive(m.returningUsers) || (Array.isArray(m.sources) && m.sources.length > 0);
    case 'audiencias':
      return Array.isArray(m.audiences) && m.audiences.some((x) => positive(x.users) || positive(x.sessions));
    case 'paginas':
      return Array.isArray(m.pageRows) && m.pageRows.some((x) => positive(x.views) || positive(x.users));
    case 'tecnologia':
      return [m.devices, m.operatingSystems, m.deviceDetails, m.browsers].some((arr) => Array.isArray(arr) && arr.length > 0);
    case 'organico':
      return positive(m.organicClicks) || positive(m.organicImpressions) || (Array.isArray(m.queries) && m.queries.length > 0);
    case 'demografia':
      return [m.genders, m.regions, m.countries, m.cities].some((arr) => Array.isArray(arr) && arr.length > 0);
    case 'validacion':
    case 'fuentes-dashboard':
      return Array.isArray(m.base) && m.base.length > 0;
    default:
      return true;
  }
}

export function toggleDataContainer(childId, visible) {
  const child = document.getElementById(childId);
  if (!child) return;
  const container = child.closest('.chart-card') || child.closest('.card') || child;
  container.hidden = !visible;
  const grid = container.parentElement;
  if (grid?.classList.contains('chart-grid')) grid.classList.add('dynamic-grid');
}

export function setSubmoduleAvailability(m) {
  const hasChannels = Array.isArray(m.channels) && m.channels.length > 0;
  const hasSources = Array.isArray(m.sources) && m.sources.length > 0;
  const hasUserComposition = Number(m.newUsers || 0) > 0 || Number(m.returningUsers || 0) > 0;
  const hasTech = [m.devices, m.operatingSystems, m.deviceDetails, m.browsers].some((arr) => Array.isArray(arr) && arr.length > 0);
  const hasGeo = [m.genders, m.regions, m.countries, m.cities].some((arr) => Array.isArray(arr) && arr.length > 0);

  const summaryGrid = document.getElementById('summaryChannel')?.parentElement;
  summaryGrid?.classList.add('dynamic-grid');
  const summaryChannel = document.getElementById('summaryChannel');
  if (summaryChannel) summaryChannel.hidden = !hasChannels;
  const summaryTech = document.getElementById('summaryTech');
  if (summaryTech) summaryTech.hidden = !hasTech;
  const summaryLocation = document.getElementById('summaryLocation');
  if (summaryLocation) summaryLocation.hidden = !hasGeo;

  toggleDataContainer('userComposition', hasUserComposition);
  toggleDataContainer('sourceBars', hasSources);
  toggleDataContainer('sourceTable', hasSources);
  toggleDataContainer('deviceDonut', Array.isArray(m.devices) && m.devices.length > 0);
  toggleDataContainer('osDonut', Array.isArray(m.operatingSystems) && m.operatingSystems.length > 0);
  toggleDataContainer('deviceDetailBars', Array.isArray(m.deviceDetails) && m.deviceDetails.length > 0);
  toggleDataContainer('browserBars', Array.isArray(m.browsers) && m.browsers.length > 0);
  toggleDataContainer('genderDonut', Array.isArray(m.genders) && m.genders.length > 0);
  toggleDataContainer('regionBars', Array.isArray(m.regions) && m.regions.length > 0);
  toggleDataContainer('countryDonut', Array.isArray(m.countries) && m.countries.length > 0);
  const countryBars = document.getElementById('countryBars');
  if (countryBars) countryBars.hidden = !(Array.isArray(m.countries) && m.countries.length > 0);
  toggleDataContainer('cityBars', Array.isArray(m.cities) && m.cities.length > 0);
}

export function setModuleAvailability(m) {
  EXPORT_MODULES.forEach((mod) => {
    const available = moduleHasData(mod.id, m);
    const section = document.getElementById(mod.id);
    const link = document.querySelector(`.nav a[href="#${mod.id}"]`);
    const check = document.querySelector(`.export-section[value="${mod.id}"]`);
    if (section) section.hidden = !available;
    if (link) {
      link.hidden = !available;
      link.setAttribute('aria-disabled', available ? 'false' : 'true');
    }
    if (check) {
      if (!available) {
        if (check.dataset.autoHidden !== '1') check.dataset.wasChecked = check.checked ? '1' : '0';
        check.dataset.autoHidden = '1';
        check.checked = false;
        check.disabled = true;
      } else {
        check.disabled = false;
        if (check.dataset.autoHidden === '1') {
          check.checked = check.dataset.wasChecked === '1';
          delete check.dataset.autoHidden;
          delete check.dataset.wasChecked;
        }
      }
    }
  });
  setSubmoduleAvailability(m);
  updateNavGroupVisibility();
  updateExportSelection();
  requestAnimationFrame(syncActiveNavToViewport);
}

export function restoreAllModules() {
  EXPORT_MODULES.forEach((mod) => {
    const section = document.getElementById(mod.id);
    const link = document.querySelector(`.nav a[href="#${mod.id}"]`);
    const check = document.querySelector(`.export-section[value="${mod.id}"]`);
    if (section) section.hidden = false;
    if (link) {
      link.hidden = false;
      link.setAttribute('aria-disabled', 'false');
    }
    if (check) {
      check.disabled = false;
      if (check.dataset.autoHidden === '1') check.checked = check.dataset.wasChecked === '1';
      delete check.dataset.autoHidden;
      delete check.dataset.wasChecked;
    }
  });
  document.querySelectorAll('.nav .navlabel').forEach((x) => (x.hidden = false));
  document.querySelectorAll('.chart-card[hidden],.card[hidden],.kpi[hidden]').forEach((x) => (x.hidden = false));
  const countryBars = document.getElementById('countryBars');
  if (countryBars) countryBars.hidden = false;
  updateExportSelection();
}
