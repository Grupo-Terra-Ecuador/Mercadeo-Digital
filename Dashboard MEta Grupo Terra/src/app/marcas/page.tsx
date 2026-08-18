"use client";

import { useMemo } from "react";
import { useFiltersStore } from "@/store/filters-store";
import { getAccountById, getFilteredCampaigns, getInsightsForCampaigns } from "@/lib/selectors";
import { calcCostPerResult, calcCtr, groupInsightsByCampaign } from "@/lib/metrics";
import { DATASET } from "@/lib/mock/dataset";
import { formatCurrency, formatCurrencyPrecise, formatInteger, formatPercent } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import BrandComparisonChart from "@/components/charts/BrandComparisonChart";
import DonutBreakdown from "@/components/charts/DonutBreakdown";

interface BrandRow {
  id: string;
  name: string;
  color: string;
  accountName: string;
  totalCampaigns: number;
  activeCampaigns: number;
  spend: number;
  results: number;
  costPerResult: number;
  ctr: number;
  share: number;
}

export default function MarcasPage() {
  const filters = useFiltersStore();

  const campaigns = useMemo(() => getFilteredCampaigns(filters), [filters]);
  const insights = useMemo(
    () => getInsightsForCampaigns(campaigns, filters.dateStart, filters.dateEnd),
    [campaigns, filters.dateStart, filters.dateEnd]
  );

  const rows: BrandRow[] = useMemo(() => {
    const byCampaign = groupInsightsByCampaign(insights);
    const brandIds = new Set(campaigns.map((c) => c.brandId));
    const totalSpendAll = insights.reduce((sum, r) => sum + r.spend, 0);

    const result: BrandRow[] = [];
    for (const brandId of brandIds) {
      const brand = DATASET.brands.find((b) => b.id === brandId);
      if (!brand) continue;
      const brandCampaigns = campaigns.filter((c) => c.brandId === brandId);
      const totals = { spend: 0, reach: 0, impressions: 0, clicks: 0, results: 0 };
      for (const c of brandCampaigns) {
        const t = byCampaign.get(c.id);
        if (!t) continue;
        totals.spend += t.spend;
        totals.impressions += t.impressions;
        totals.clicks += t.clicks;
        totals.results += t.results;
      }
      result.push({
        id: brand.id,
        name: brand.name,
        color: brand.color,
        accountName: getAccountById(brand.accountId)?.name ?? "—",
        totalCampaigns: brandCampaigns.length,
        activeCampaigns: brandCampaigns.filter((c) => c.status === "ACTIVE").length,
        spend: totals.spend,
        results: totals.results,
        costPerResult: calcCostPerResult(totals),
        ctr: calcCtr(totals),
        share: totalSpendAll > 0 ? totals.spend / totalSpendAll : 0,
      });
    }
    return result.sort((a, b) => b.spend - a.spend);
  }, [campaigns, insights]);

  const chartData = useMemo(() => rows.map((r) => ({ name: r.name, value: r.spend, color: r.color })), [rows]);
  const shareData = useMemo(() => rows.map((r) => ({ segment: r.name, share: r.share })), [rows]);

  const columns: DataTableColumn<BrandRow>[] = [
    {
      key: "name",
      header: "Marca",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
          <span className="font-semibold">{r.name}</span>
        </div>
      ),
    },
    { key: "account", header: "Cuenta", sortValue: (r) => r.accountName, render: (r) => r.accountName },
    {
      key: "campaigns",
      header: "Campañas activas",
      align: "right",
      sortValue: (r) => r.activeCampaigns,
      render: (r) => `${r.activeCampaigns} / ${r.totalCampaigns}`,
    },
    { key: "spend", header: "Inversión", align: "right", sortValue: (r) => r.spend, render: (r) => formatCurrency(r.spend) },
    {
      key: "results",
      header: "Resultados",
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
    {
      key: "share",
      header: "% del total",
      align: "right",
      sortValue: (r) => r.share,
      render: (r) => formatPercent(r.share * 100),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Marcas" description="Rendimiento agregado por marca dentro de las cuentas publicitarias conectadas." />

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
            <ChartCard title="Inversión por marca" subtitle="Comparativo del gasto total en el período seleccionado">
              <BrandComparisonChart data={chartData} />
            </ChartCard>
            <ChartCard title="Participación de inversión" subtitle="Porcentaje del gasto total que representa cada marca">
              <DonutBreakdown data={shareData} />
            </ChartCard>
          </div>

          <ChartCard title={`${rows.length} marca${rows.length === 1 ? "" : "s"}`} subtitle="Haz clic en un encabezado para ordenar la tabla">
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} defaultSortKey="spend" />
          </ChartCard>
        </>
      )}
    </div>
  );
}
