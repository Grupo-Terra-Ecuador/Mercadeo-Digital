// Motor de agregacion: decide que dataset/columna usar por seccion y calcula totales,
// tasas ponderadas y agrupaciones. Logica pura, sin DOM.
import { norm, parseNum, normalizeRate, hasMetricValue } from '../format.js';
import { bestCol } from '../csv/synonyms.js';

export function isTotalRow(row, cols) {
  return cols
    .map((c) => norm(row[c]))
    .some((v) => v === 'total' || v === 'totales' || v === 'total general' || v === 'grand total');
}

export function cleanRows(d) {
  return d.rows.filter((r) => !isTotalRow(r, d.columns));
}

export function metricFrom(d, key) {
  const col = bestCol(d.columns, key);
  if (!col) return 0;
  const total = d.rows.find((r) => isTotalRow(r, d.columns));
  if (total) {
    return key === 'bounceRate' || key === 'engagementRate' || key === 'ctr'
      ? normalizeRate(total[col])
      : parseNum(total[col]);
  }
  return cleanRows(d).reduce((s, r) => s + parseNum(r[col]), 0);
}

export function preferredMetric(ds, key) {
  for (const d of ds) {
    const v = metricFrom(d, key);
    if (v > 0) return { value: v, dataset: d };
  }
  return { value: 0, dataset: null };
}

export function firstPositiveMetric(ds, key) {
  const ranked = [...ds].sort((a, b) => {
    const as = (bestCol(a.columns, key) ? 100 : 0) + Math.min(a.rows.length, 100);
    const bs = (bestCol(b.columns, key) ? 100 : 0) + Math.min(b.rows.length, 100);
    return bs - as;
  });
  return preferredMetric(ranked, key).value;
}

export function aggregate(ds, labelKey, valueKey, limit = 50) {
  const map = new Map();
  ds.forEach((d) => {
    const lc = bestCol(d.columns, labelKey);
    const vc = bestCol(d.columns, valueKey);
    if (!lc || !vc) return;
    cleanRows(d).forEach((r) => {
      const label = String(r[lc] || '(sin dato)').trim() || '(sin dato)';
      const value = parseNum(r[vc]);
      if (value > 0) map.set(label, (map.get(label) || 0) + value);
    });
  });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export function weightedRate(ds, rateKey, weightKey = 'sessions') {
  let num = 0;
  let den = 0;
  ds.forEach((d) => {
    const rc = bestCol(d.columns, rateKey);
    const wc = bestCol(d.columns, weightKey);
    if (!rc) return;
    cleanRows(d).forEach((r) => {
      const rate = normalizeRate(r[rc]);
      const weight = wc ? parseNum(r[wc]) : 1;
      if (isFinite(rate) && weight > 0) {
        num += rate * weight;
        den += weight;
      }
    });
  });
  return den ? num / den : 0;
}

export function bounceFromDatasets(ds) {
  const direct = weightedRate(ds, 'bounceRate', 'sessions');
  if (direct > 0) return { value: direct, derived: false };
  const engagement = weightedRate(ds, 'engagementRate', 'sessions');
  return engagement > 0 ? { value: Math.max(0, 1 - engagement), derived: true } : { value: 0, derived: false };
}

export function groupRows(ds, labelKey) {
  const map = new Map();
  ds.forEach((d) => {
    const lc = bestCol(d.columns, labelKey);
    if (!lc) return;
    const cols = {
      users: bestCol(d.columns, 'users'),
      newUsers: bestCol(d.columns, 'newUsers'),
      returningUsers: bestCol(d.columns, 'returningUsers'),
      sessions: bestCol(d.columns, 'sessions'),
      views: bestCol(d.columns, 'views'),
      bounceRate: bestCol(d.columns, 'bounceRate'),
      engagementRate: bestCol(d.columns, 'engagementRate'),
      clicks: bestCol(d.columns, 'clicks'),
      impressions: bestCol(d.columns, 'impressions'),
      position: bestCol(d.columns, 'position'),
    };
    cleanRows(d).forEach((r) => {
      const label = String(r[lc] || '(sin dato)').trim() || '(sin dato)';
      if (!map.has(label)) {
        map.set(label, {
          label,
          users: 0,
          newUsers: 0,
          returningUsers: 0,
          sessions: 0,
          views: 0,
          clicks: 0,
          impressions: 0,
          bounceNum: 0,
          bounceDen: 0,
          posNum: 0,
          posDen: 0,
          usersAvailable: false,
          newUsersAvailable: false,
          returningUsersAvailable: false,
          sessionsAvailable: false,
          viewsAvailable: false,
          clicksAvailable: false,
          impressionsAvailable: false,
          bounceAvailable: false,
          positionAvailable: false,
        });
      }
      const o = map.get(label);
      ['users', 'newUsers', 'returningUsers', 'sessions', 'views', 'clicks', 'impressions'].forEach((k) => {
        if (cols[k] && hasMetricValue(r[cols[k]])) {
          o[k] += parseNum(r[cols[k]]);
          o[`${k}Available`] = true;
        }
      });
      let br = 0;
      let rowBounceAvailable = false;
      if (cols.bounceRate && hasMetricValue(r[cols.bounceRate])) {
        br = normalizeRate(r[cols.bounceRate]);
        rowBounceAvailable = true;
        o.bounceAvailable = true;
      } else if (cols.engagementRate && hasMetricValue(r[cols.engagementRate])) {
        br = Math.max(0, 1 - normalizeRate(r[cols.engagementRate]));
        rowBounceAvailable = true;
        o.bounceAvailable = true;
      }
      const w = cols.sessions && hasMetricValue(r[cols.sessions])
        ? parseNum(r[cols.sessions])
        : cols.users && hasMetricValue(r[cols.users])
          ? parseNum(r[cols.users])
          : 1;
      if (rowBounceAvailable && isFinite(br) && w > 0) {
        o.bounceNum += br * w;
        o.bounceDen += w;
      }
      if (cols.position && hasMetricValue(r[cols.position])) {
        const pos = parseNum(r[cols.position]);
        const pw = cols.impressions && hasMetricValue(r[cols.impressions]) ? parseNum(r[cols.impressions]) : 1;
        if (pos > 0 && pw > 0) {
          o.posNum += pos * pw;
          o.posDen += pw;
          o.positionAvailable = true;
        }
      }
    });
  });
  return [...map.values()].map((o) => ({
    ...o,
    bounceRate: o.bounceDen ? o.bounceNum / o.bounceDen : 0,
    position: o.posDen ? o.posNum / o.posDen : 0,
    ctr: o.impressions ? o.clicks / o.impressions : 0,
  }));
}

export function bestDataset(ds, labelOptions = [], metricOptions = []) {
  let best = null;
  let bestScore = -1;
  for (const d of ds) {
    let score = Math.min(d.rows.length, 200) / 20;
    labelOptions.forEach((k, i) => {
      if (bestCol(d.columns, k)) score += 20 - i;
    });
    metricOptions.forEach((k, i) => {
      if (bestCol(d.columns, k)) score += 12 - i;
    });
    if (d.rows.length === 0) score -= 100;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}
