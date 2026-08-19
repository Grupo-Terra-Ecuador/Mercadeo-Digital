"use client";

import { useMemo } from "react";
import { Coins, Target, TrendingUp, Wallet } from "lucide-react";
import { useFiltersStore } from "@/store/filters-store";
import { getBrandById, getFilteredCampaigns, getInsightsForCampaigns } from "@/lib/selectors";
import {
  calcCostPerResult,
  calcCtr,
  enumerateDates,
  groupInsightsByCampaign,
  pctChange,
  previousPeriod,
  sumTotals,
} from "@/lib/metrics";
import { RESULT_LABELS } from "@/lib/mock/dataset";
import { formatCurrency, formatCurrencyPrecise, formatDateLong, formatInteger, formatPercent } from "@/lib/format";
import { useDashboardData } from "@/store/dashboard-data-context";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import KpiCard from "@/components/ui/KpiCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBanner from "@/components/ui/ErrorBanner";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import ComparisonTrendChart from "@/components/charts/ComparisonTrendChart";

interface BrandCompareRow {
  brandId: string;
  name: string;
  currentSpend: number;
  previousSpend: number;
  spendDelta: number;
  currentResults: number;
  previousResults: number;
  resultsDelta: number;
}

export default function ComparativoPage() {
  const filters = useFiltersStore();
  const { brands, campaigns: allCampaigns, dailyInsights: allInsights, error } = useDashboardData();

  const campaigns = useMemo(() => getFilteredCampaigns(allCampaigns, filters), [allCampaigns, filters]);
  const prevRange = useMemo(() => previousPeriod(filters.dateStart, filters.dateEnd), [filters.dateStart, filters.dateEnd]);

  const insights = useMemo(
    () => getInsightsForCampaigns(campaigns, allInsights, filters.dateStart, filters.dateEnd),
    [campaigns, allInsights, filters.dateStart, filters.dateEnd]
  );
  const prevInsights = useMemo(
    () => getInsightsForCampaigns(campaigns, allInsights, prevRange.start, prevRange.end),
    [campaigns, allInsights, prevRange]
  );

  const totals = useMemo(() => sumTotals(insights), [insights]);
  const prevTotals = useMemo(() => sumTotals(prevInsights), [prevInsights]);

  const resultLabel = filters.objective !== "all" ? RESULT_LABELS[filters.objective] : "Resultados";

  const overlaySeries = useMemo(() => {
    const currentDates = enumerateDates(filters.dateStart, filters.dateEnd);
    const previousDates = enumerateDates(prevRange.start, prevRange.end);
    const currentByDate = new Map(insights.map((r) => [r.date, r]));
    const prevByDate = new Map(prevInsights.map((r) => [r.date, r]));

    return currentDates.map((date, idx) => {
      const cur = currentByDate.get(date);
      const prevDate = previousDates[idx];
      const prev = prevDate ? prevByDate.get(prevDate) : undefined;
      return {
        index: idx + 1,
        currentSpend: cur?.spend ?? 0,
        previousSpend: prev?.spend ?? 0,
        currentResults: cur?.results ?? 0,
        previousResults: prev?.results ?? 0,
      };
    });
  }, [filters.dateStart, filters.dateEnd, prevRange, insights, prevInsights]);

  const spendOverlay = useMemo(
    () => overlaySeries.map((r) => ({ index: r.index, current: r.currentSpend, previous: r.previousSpend })),
    [overlaySeries]
  );
  const resultsOverlay = useMemo(
    () => overlaySeries.map((r) => ({ index: r.index, current: r.currentResults, previous: r.previousResults })),
    [overlaySeries]
  );

  const brandRows: BrandCompareRow[] = useMemo(() => {
    const currentByCampaign = groupInsightsByCampaign(insights);
    const previousByCampaign = groupInsightsByCampaign(prevInsights);
    const brandIds = new Set(campaigns.map((c) => c.brandId));

    return [...brandIds]
      .map((brandId) => {
        const brand = getBrandById(brands, brandId);
        const brandCampaigns = campaigns.filter((c) => c.brandId === brandId);
        let currentSpend = 0;
        let previousSpend = 0;
        let currentResults = 0;
        let previousResults = 0;
        for (const c of brandCampaigns) {
          const cur = currentByCampaign.get(c.id);
          const prev = previousByCampaign.get(c.id);
          if (cur) {
            currentSpend += cur.spend;
            currentResults += cur.results;
          }
          if (prev) {
            previousSpend += prev.spend;
            previousResults += prev.results;
          }
        }
        return {
          brandId,
          name: brand?.name ?? brandId,
          currentSpend,
          previousSpend,
          spendDelta: pctChange(currentSpend, previousSpend),
          currentResults,
          previousResults,
          resultsDelta: pctChange(currentResults, previousResults),
        };
      })
      .sort((a, b) => b.currentSpend - a.currentSpend);
  }, [campaigns, insights, prevInsights, brands]);

  const columns: DataTableColumn<BrandCompareRow>[] = [
    { key: "name", header: "Marca", sortValue: (r) => r.name, render: (r) => <span className="font-semibold">{r.name}</span> },
    {
      key: "currentSpend",
      header: "Inversión actual",
      align: "right",
      sortValue: (r) => r.currentSpend,
      render: (r) => formatCurrency(r.currentSpend),
    },
    {
      key: "previousSpend",
      header: "Inversión anterior",
      align: "right",
      sortValue: (r) => r.previousSpend,
      render: (r) => formatCurrency(r.previousSpend),
    },
    {
      key: "spendDelta",
      header: "Δ Inversión",
      align: "right",
      sortValue: (r) => r.spendDelta,
      render: (r) => <Delta value={r.spendDelta} />,
    },
    {
      key: "currentResults",
      header: `${resultLabel} actual`,
      align: "right",
      sortValue: (r) => r.currentResults,
      render: (r) => formatInteger(r.currentResults),
    },
    {
      key: "resultsDelta",
      header: "Δ Resultados",
      align: "right",
      sortValue: (r) => r.resultsDelta,
      render: (r) => <Delta value={r.resultsDelta} />,
    },
  ];

  if (campaigns.length === 0) {
    return (
      <div>
        <PageHeader title="Análisis comparativo" description="Compara el período seleccionado contra el período inmediatamente anterior." />
        {error && <ErrorBanner message={error} />}
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Análisis comparativo"
        description={`Período actual: ${formatDateLong(filters.dateStart)} – ${formatDateLong(filters.dateEnd)}  ·  Período anterior: ${formatDateLong(prevRange.start)} – ${formatDateLong(prevRange.end)}`}
      />
      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiCard label="Inversión" value={formatCurrency(totals.spend)} deltaPct={pctChange(totals.spend, prevTotals.spend)} icon={Wallet} />
        <KpiCard label={resultLabel} value={formatInteger(totals.results)} deltaPct={pctChange(totals.results, prevTotals.results)} icon={Target} />
        <KpiCard
          label="Costo por resultado"
          value={formatCurrencyPrecise(calcCostPerResult(totals))}
          deltaPct={pctChange(calcCostPerResult(totals), calcCostPerResult(prevTotals))}
          icon={Coins}
          invertDeltaColor
        />
        <KpiCard
          label="CTR"
          value={formatPercent(calcCtr(totals))}
          deltaPct={pctChange(calcCtr(totals), calcCtr(prevTotals))}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <ChartCard title="Inversión: actual vs. anterior" subtitle="Ambos períodos alineados por día relativo (Día 1, Día 2, …)">
          <ComparisonTrendChart data={spendOverlay} formatter={(v) => formatCurrency(v)} />
        </ChartCard>
        <ChartCard title={`${resultLabel}: actual vs. anterior`} subtitle="Ambos períodos alineados por día relativo">
          <ComparisonTrendChart data={resultsOverlay} formatter={(v) => formatInteger(v)} />
        </ChartCard>
      </div>

      <ChartCard title="Comparativo por marca" subtitle="Inversión y resultados del período actual frente al período anterior">
        <DataTable columns={columns} rows={brandRows} rowKey={(r) => r.brandId} defaultSortKey="currentSpend" />
      </ChartCard>
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return <span className={`font-bold ${positive ? "text-green" : "text-red"}`}>{positive ? "+" : ""}{value.toFixed(1)}%</span>;
}
