// Filtro de fechas "responsable": nunca recorta un CSV agregado sin fecha por fila de
// forma que falsee el dato; en ese caso conserva el total agregado completo (modo "safe").
//
// A diferencia del original, estas funciones reciben `settings` explicito en vez de leer
// un objeto `state` global, para que sean puras y testeables de forma aislada.
import { parseReportDateToken, dateISO } from '../format.js';
import { findRowDateCol } from '../csv/parse.js';

export function isDateFilterActive(settings) {
  return !!(settings.dateFrom || settings.dateTo);
}

export function selectedDateRange(settings) {
  return {
    from: settings.dateFrom ? parseReportDateToken(settings.dateFrom) : null,
    to: settings.dateTo ? parseReportDateToken(settings.dateTo) : null,
  };
}

export function rangesOverlap(a1, a2, b1, b2) {
  if (!a1 || !a2 || !b1 || !b2) return true;
  return a1 <= b2 && b1 <= a2;
}

export function filterDatasetByDate(d, settings) {
  if (!isDateFilterActive(settings)) {
    return { ...d, filterStatus: 'sin filtro', filterRowsBefore: d.rows.length, filterRowsAfter: d.rows.length };
  }
  const { from, to } = selectedDateRange(settings);
  const f = from || new Date(-8640000000000000);
  const t = to || new Date(8640000000000000);
  const clone = {
    ...d,
    rows: [...d.rows],
    warnings: [...(d.warnings || [])],
    notices: [...(d.notices || [])],
    filterRowsBefore: d.rows.length,
    filterRowsAfter: d.rows.length,
  };
  const rowDateCol = d.rowDateCol || findRowDateCol(d.columns);
  if (rowDateCol) {
    clone.rows = d.rows.filter((r) => {
      const dt = parseReportDateToken(r[rowDateCol]);
      return dt && dt >= f && dt <= t;
    });
    clone.filterRowsAfter = clone.rows.length;
    clone.filterStatus = 'filtrado exacto por fecha';
    if (!clone.rows.length) clone.warnings.push('El filtro no encontro filas coincidentes.');
    return clone;
  }
  if (d.reportStart && d.reportEnd) {
    if (!rangesOverlap(d.reportStart, d.reportEnd, f, t)) {
      clone.rows = [];
      clone.filterRowsAfter = 0;
      clone.filterStatus = 'excluido: fuera del rango';
      clone.warnings.push('El rango del reporte no coincide con el filtro seleccionado.');
      return clone;
    }
    const partial = (from && dateISO(from) !== dateISO(d.reportStart)) || (to && dateISO(to) !== dateISO(d.reportEnd));
    if (settings.dateMode === 'strict' && partial) {
      clone.rows = [];
      clone.filterRowsAfter = 0;
      clone.filterStatus = 'excluido: agregado no filtrable';
      clone.warnings.push('Modo estricto: el CSV no puede recortarse porque no contiene Fecha por fila.');
      return clone;
    }
    clone.filterStatus = partial ? 'incluido como agregado completo' : 'incluido: rango coincidente';
    if (partial) {
      clone.warnings.push(
        'El filtro solicitado es parcial, pero el CSV esta agregado para todo el periodo. Se conserva el total completo en modo seguro.'
      );
    }
    return clone;
  }
  if (settings.dateMode === 'strict') {
    clone.rows = [];
    clone.filterRowsAfter = 0;
    clone.filterStatus = 'excluido: sin fecha';
    clone.warnings.push('Modo estricto: archivo sin fecha ni rango detectado.');
  } else {
    clone.filterStatus = 'incluido sin validar fecha';
    clone.notices.push('Archivo procesado completo porque no tiene Fecha por fila ni rango detectable.');
  }
  return clone;
}
