"use client";

import { useMemo } from "react";
import { Wallet, Eye, ScanEye, Target, Coins, MousePointerClick, Percent, TrendingUp, Gauge, Repeat } from "lucide-react";
import { useFiltersStore } from "@/store/filters-store";
import { getFilteredCampaigns, getInsightsForCampaigns, getBrandById } from "@/lib/selectors";
import {
  buildDailySeries,
  calcCostPerResult,
  calcCpc,
  calcCpm,
  calcCtr,
  calcFrequency,
  FREQUENCY_FATIGUE_THRESHOLD,
  groupInsightsByCampaign,
  pctChange,
  previousPeriod,
  sumTotals,
} from "@/lib/metrics";
import { RESULT_LABELS } from "@/lib/mock/dataset";
import { formatCurrency, formatCurrencyPrecise, formatInteger, formatPercent } from "@/lib/format";
import { useDashboardData } from "@/store/dashboard-data-context";
import PageHeader from "@/components/ui/PageHeader";
import KpiCard from "@/components/ui/KpiCard";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBanner from "@/components/ui/ErrorBanner";
import StatusPill from "@/components/ui/StatusPill";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import SpendTrendChart from "@/components/charts/SpendTrendChart";
import ResultsBarChart from "@/components/charts/ResultsBarChart";
import SpendVsResultsChart from "@/components/charts/SpendVsResultsChart";
import BrandComparisonChart from "@/components/charts/BrandComparisonChart";
import ConversionFunnelChart from "@/components/charts/ConversionFunnelChart";
import Link from "next/link";

interface TopCampaignRow {
  id: string;
  name: string;
  brandName: string;
  status: ReturnType<typeof getFilteredCampaigns>[number]["status"];
  spend: number;
  results: number;
  costPerResult: number;
  ctr: number;
}

export default function ResumenEjecutivoPage() {
  const filters = useFiltersStore();
  const { accounts, brands, campaigns: allCampaigns, dailyInsights: allInsights, error } = useDashboardData();

  const campaigns = useMemo(() => getFilteredCampaigns(allCampaigns, filters), [allCampaigns, filters]);
  const insights = useMemo(
    () => getInsightsForCampaigns(campaigns, allInsights, filters.dateStart, filters.dateEnd),
    [campaigns, allInsights, filters.dateStart, filters.dateEnd]
  );

  const prevRange = useMemo(() => previousPeriod(filters.dateStart, filters.dateEnd), [filters.dateStart, filters.dateEnd]);
  const prevInsights = useMemo(
    () => getInsightsForCampaigns(campaigns, allInsights, prevRange.start, prevRange.end),
    [campaigns, allInsights, prevRange]
  );

  const totals = useMemo(() => sumTotals(insights), [insights]);
  const prevTotals = useMemo(() => sumTotals(prevInsights), [prevInsights]);

  const resultLabel = filters.objective !== "all" ? RESULT_LABELS[filters.objective] : "Resultados";

  const dailySeries = useMemo(() => buildDailySeries(insights), [insights]);

  const brandComparisonData = useMemo(() => {
    const brandCampaigns = getFilteredCampaigns(allCampaigns, { ...filters, brandId: "all", campaignId: "all" });
    const brandInsights = getInsightsForCampaigns(brandCampaigns, allInsights, filters.dateStart, filters.dateEnd);
    const byBrand = new Map<string, number>();
    const campaignToBrand = new Map(brandCampaigns.map((c) => [c.id, c.brandId]));
    for (const row of brandInsights) {
      const brandId = campaignToBrand.get(row.campaignId);
      if (!brandId) continue;
      byBrand.set(brandId, (byBrand.get(brandId) ?? 0) + row.spend);
    }
    return [...byBrand.entries()]
      .map(([brandId, value]) => {
        const brand = getBrandById(brands, brandId);
        return { name: brand?.name ?? brandId, value, color: brand?.color ?? "#4c8cff" };
      })
      .sort((a, b) => b.value - a.value);
  }, [allCampaigns, allInsights, brands, filters]);

  const topCampaigns: TopCampaignRow[] = useMemo(() => {
    const byCampaign = groupInsightsByCampaign(insights);
    return campaigns
      .map((c) => {
        const t = byCampaign.get(c.id) ?? { spend: 0, reach: 0, impressions: 0, clicks: 0, results: 0, landingPageViews: 0 };
        return {
          id: c.id,
          name: c.name,
          brandName: getBrandById(brands, c.brandId)?.name ?? "—",
          status: c.status,
          spend: t.spend,
          results: t.results,
          costPerResult: calcCostPerResult(t),
          ctr: calcCtr(t),
        };
      })
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8);
  }, [campaigns, insights, brands]);

  const columns: DataTableColumn<TopCampaignRow>[] = [
    { key: "name", header: "Campaña", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "brand", header: "Marca", render: (r) => r.brandName },
    { key: "status", header: "Estado", render: (r) => <StatusPill status={r.status} /> },
    {
      key: "spend",
      header: "Inversión",
      align: "right",
      sortValue: (r) => r.spend,
      render: (r) => formatCurrency(r.spend),
    },
    {
      key: "results",
      header: resultLabel,
      align: "right",
      sortValue: (r) => r.results,
      render: (r) => formatInteger(r.results),
    },
    {
      key: "costPerResult",
      header: "Costo/Resultado",
      align: "right",
      sortValue: (r) => r.costPerResult,
      render: (r) => formatCurrencyPrecise(r.costPerResult),
    },
    { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.ctr, render: (r) => formatPercent(r.ctr) },
  ];

  if (campaigns.length === 0) {
    return (
      <div>
        <PageHeader title="Resumen ejecutivo" description="Visión general del rendimiento de tus campañas de Meta." />
        {error && <ErrorBanner message={error} />}
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Resumen ejecutivo"
        description={`Rendimiento agregado de ${campaigns.length} campaña${campaigns.length === 1 ? "" : "s"} de ${accounts.length} cuenta${accounts.length === 1 ? "" : "s"} publicitaria${accounts.length === 1 ? "" : "s"}.`}
      />
      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Inversión" value={formatCurrency(totals.spend)} deltaPct={pctChange(totals.spend, prevTotals.spend)} icon={Wallet} />
        <KpiCard label="Alcance" value={formatInteger(totals.reach)} deltaPct={pctChange(totals.reach, prevTotals.reach)} icon={Eye} />
        <KpiCard label="Impresiones" value={formatInteger(totals.impressions)} deltaPct={pctChange(totals.impressions, prevTotals.impressions)} icon={ScanEye} />
        <KpiCard label={resultLabel} value={formatInteger(totals.results)} deltaPct={pctChange(totals.results, prevTotals.results)} icon={Target} />
        <KpiCard
          label="Costo por resultado"
          value={formatCurrencyPrecise(calcCostPerResult(totals))}
          deltaPct={pctChange(calcCostPerResult(totals), calcCostPerResult(prevTotals))}
          icon={Coins}
          invertDeltaColor
        />
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Clics" value={formatInteger(totals.clicks)} deltaPct={pctChange(totals.clicks, prevTotals.clicks)} icon={MousePointerClick} />
        <KpiCard label="CTR" value={formatPercent(calcCtr(totals))} deltaPct={pctChange(calcCtr(totals), calcCtr(prevTotals))} icon={Percent} />
        <KpiCard
          label="CPC"
          value={formatCurrencyPrecise(calcCpc(totals))}
          deltaPct={pctChange(calcCpc(totals), calcCpc(prevTotals))}
          icon={TrendingUp}
          invertDeltaColor
        />
        <KpiCard
          label="CPM"
          value={formatCurrencyPrecise(calcCpm(totals))}
          deltaPct={pctChange(calcCpm(totals), calcCpm(prevTotals))}
          icon={Gauge}
          invertDeltaColor
        />
        <KpiCard
          label="Frecuencia"
          value={`${calcFrequency(totals).toFixed(1)}x`}
          deltaPct={pctChange(calcFrequency(totals), calcFrequency(prevTotals))}
          icon={Repeat}
          invertDeltaColor={calcFrequency(totals) >= FREQUENCY_FATIGUE_THRESHOLD}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <ChartCard title="Evolución diaria de inversión" subtitle="Gasto en Meta Ads por día en el período seleccionado">
          <SpendTrendChart data={dailySeries} />
        </ChartCard>
        <ChartCard title={`${resultLabel} por día`} subtitle="Atribución diaria de resultados">
          <ResultsBarChart data={dailySeries} resultLabel={resultLabel} />
        </ChartCard>
        <ChartCard title="Gasto diario vs. resultados" subtitle="Correlación entre inversión y resultados obtenidos">
          <SpendVsResultsChart data={dailySeries} resultLabel={resultLabel} />
        </ChartCard>
        <ChartCard title="Comparativo de inversión por marca" subtitle="Inversión total por marca en el período seleccionado">
          <BrandComparisonChart data={brandComparisonData} />
        </ChartCard>
      </div>

      <ChartCard title="Embudo de conversión" subtitle="De impresiones a resultados, para ver en qué paso se pierden los prospectos">
        <ConversionFunnelChart
          stages={[
            { name: "Impresiones", value: totals.impressions },
            { name: "Clics", value: totals.clicks },
            { name: "Vistas de página de destino", value: totals.landingPageViews },
            { name: resultLabel, value: totals.results },
          ]}
        />
        {totals.landingPageViews === 0 && totals.clicks > 0 && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-2">
            &ldquo;Vistas de página de destino&rdquo; está en 0 porque estas campañas no dirigen a una página web
            externa (por ejemplo, campañas de mensajes o interacción) — es normal en ese caso, no un error.
          </p>
        )}
      </ChartCard>

      <ChartCard
        title="Campañas con mayor inversión"
        subtitle="Top 8 campañas del período seleccionado"
        action={
          <Link href="/campanas" className="text-[11px] font-bold text-accent-2 hover:underline">
            Ver todas las campañas →
          </Link>
        }
      >
        <DataTable columns={columns} rows={topCampaigns} rowKey={(r) => r.id} defaultSortKey="spend" />
      </ChartCard>
    </div>
  );
}
