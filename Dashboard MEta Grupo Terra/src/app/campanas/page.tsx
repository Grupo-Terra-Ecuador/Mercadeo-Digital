"use client";

import { useMemo } from "react";
import { useFiltersStore } from "@/store/filters-store";
import { getFilteredCampaigns, getInsightsForCampaigns, getBrandById } from "@/lib/selectors";
import { calcCostPerResult, calcCpc, calcCpm, calcCtr, groupInsightsByCampaign } from "@/lib/metrics";
import { OBJECTIVE_LABELS } from "@/lib/mock/dataset";
import { formatCurrency, formatCurrencyPrecise, formatInteger, formatPercent } from "@/lib/format";
import type { Campaign } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";

interface CampaignRow {
  campaign: Campaign;
  brandName: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  results: number;
  costPerResult: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export default function CampanasPage() {
  const filters = useFiltersStore();

  const campaigns = useMemo(() => getFilteredCampaigns(filters), [filters]);
  const insights = useMemo(
    () => getInsightsForCampaigns(campaigns, filters.dateStart, filters.dateEnd),
    [campaigns, filters.dateStart, filters.dateEnd]
  );

  const rows: CampaignRow[] = useMemo(() => {
    const byCampaign = groupInsightsByCampaign(insights);
    return campaigns.map((campaign) => {
      const t = byCampaign.get(campaign.id) ?? { spend: 0, reach: 0, impressions: 0, clicks: 0, results: 0 };
      return {
        campaign,
        brandName: getBrandById(campaign.brandId)?.name ?? "—",
        spend: t.spend,
        reach: t.reach,
        impressions: t.impressions,
        clicks: t.clicks,
        results: t.results,
        costPerResult: calcCostPerResult(t),
        ctr: calcCtr(t),
        cpc: calcCpc(t),
        cpm: calcCpm(t),
      };
    });
  }, [campaigns, insights]);

  const columns: DataTableColumn<CampaignRow>[] = [
    {
      key: "name",
      header: "Campaña",
      sortValue: (r) => r.campaign.name,
      render: (r) => (
        <div>
          <div className="font-semibold">{r.campaign.name}</div>
          <div className="text-[10.5px] font-medium text-muted-2">{OBJECTIVE_LABELS[r.campaign.objective]}</div>
        </div>
      ),
    },
    { key: "brand", header: "Marca", sortValue: (r) => r.brandName, render: (r) => r.brandName },
    {
      key: "status",
      header: "Estado",
      sortValue: (r) => r.campaign.status,
      render: (r) => <StatusPill status={r.campaign.status} />,
    },
    { key: "spend", header: "Inversión", align: "right", sortValue: (r) => r.spend, render: (r) => formatCurrency(r.spend) },
    { key: "reach", header: "Alcance", align: "right", sortValue: (r) => r.reach, render: (r) => formatInteger(r.reach) },
    {
      key: "impressions",
      header: "Impresiones",
      align: "right",
      sortValue: (r) => r.impressions,
      render: (r) => formatInteger(r.impressions),
    },
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
    { key: "cpc", header: "CPC", align: "right", sortValue: (r) => r.cpc, render: (r) => formatCurrencyPrecise(r.cpc) },
    { key: "cpm", header: "CPM", align: "right", sortValue: (r) => r.cpm, render: (r) => formatCurrencyPrecise(r.cpm) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Campañas"
        description="Detalle de todas las campañas que cumplen con los filtros seleccionados, con sus métricas del período."
      />

      {campaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <ChartCard title={`${rows.length} campaña${rows.length === 1 ? "" : "s"}`} subtitle="Haz clic en un encabezado para ordenar la tabla">
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.campaign.id} defaultSortKey="spend" />
        </ChartCard>
      )}
    </div>
  );
}
