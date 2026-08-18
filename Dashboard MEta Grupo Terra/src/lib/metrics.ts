import type { DailyInsight, MetricTotals } from "@/lib/types";

export function sumTotals(insights: DailyInsight[]): MetricTotals {
  return insights.reduce<MetricTotals>(
    (acc, row) => ({
      spend: acc.spend + row.spend,
      reach: acc.reach + row.reach,
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      results: acc.results + row.results,
    }),
    { spend: 0, reach: 0, impressions: 0, clicks: 0, results: 0 }
  );
}

export function calcCtr(totals: MetricTotals): number {
  return totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
}

export function calcCpc(totals: MetricTotals): number {
  return totals.clicks > 0 ? totals.spend / totals.clicks : 0;
}

export function calcCpm(totals: MetricTotals): number {
  return totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
}

export function calcCostPerResult(totals: MetricTotals): number {
  return totals.results > 0 ? totals.spend / totals.results : 0;
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function filterByDateRange<T extends { date: string }>(rows: T[], start: string, end: string): T[] {
  return rows.filter((row) => row.date >= start && row.date <= end);
}

export function previousPeriod(start: string, end: string): { start: string; end: string } {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const spanDays = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;

  const prevEnd = new Date(startDate);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - (spanDays - 1));

  return { start: prevStart.toISOString().slice(0, 10), end: prevEnd.toISOString().slice(0, 10) };
}

export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function groupInsightsByCampaign(insights: DailyInsight[]): Map<string, MetricTotals> {
  const map = new Map<string, MetricTotals>();
  for (const row of insights) {
    const acc = map.get(row.campaignId) ?? { spend: 0, reach: 0, impressions: 0, clicks: 0, results: 0 };
    acc.spend += row.spend;
    acc.reach += row.reach;
    acc.impressions += row.impressions;
    acc.clicks += row.clicks;
    acc.results += row.results;
    map.set(row.campaignId, acc);
  }
  return map;
}

export function buildDailySeries(insights: DailyInsight[]): Array<{
  date: string;
  spend: number;
  results: number;
  clicks: number;
  impressions: number;
}> {
  const byDate = new Map<string, { spend: number; results: number; clicks: number; impressions: number }>();
  for (const row of insights) {
    const acc = byDate.get(row.date) ?? { spend: 0, results: 0, clicks: 0, impressions: 0 };
    acc.spend += row.spend;
    acc.results += row.results;
    acc.clicks += row.clicks;
    acc.impressions += row.impressions;
    byDate.set(row.date, acc);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, values]) => ({ date, ...values }));
}
