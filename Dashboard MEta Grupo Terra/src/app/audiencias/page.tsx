"use client";

import { useMemo } from "react";
import { Cake, MonitorSmartphone, Rows3, Users } from "lucide-react";
import { useFiltersStore } from "@/store/filters-store";
import { getFilteredCampaigns, getInsightsForCampaigns } from "@/lib/selectors";
import { groupInsightsByCampaign } from "@/lib/metrics";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useDashboardData } from "@/store/dashboard-data-context";
import type { AudienceDimension } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBanner from "@/components/ui/ErrorBanner";
import DonutBreakdown from "@/components/charts/DonutBreakdown";

const DIMENSIONS: Array<{ key: AudienceDimension; title: string; subtitle: string; icon: typeof Users }> = [
  { key: "age", title: "Edad", subtitle: "Distribución de la inversión por grupo de edad", icon: Cake },
  { key: "gender", title: "Género", subtitle: "Distribución de la inversión por género", icon: Users },
  { key: "device", title: "Dispositivo", subtitle: "Distribución de la inversión por tipo de dispositivo", icon: MonitorSmartphone },
  { key: "placement", title: "Ubicación del anuncio", subtitle: "Dónde se mostraron los anuncios dentro de Meta", icon: Rows3 },
];

export default function AudienciasPage() {
  const filters = useFiltersStore();
  const {
    campaigns: allCampaigns,
    dailyInsights: allInsights,
    audienceShares: allAudienceShares,
    isMock,
    error,
  } = useDashboardData();

  const campaigns = useMemo(() => getFilteredCampaigns(allCampaigns, filters), [allCampaigns, filters]);
  const insights = useMemo(
    () => getInsightsForCampaigns(campaigns, allInsights, filters.dateStart, filters.dateEnd),
    [campaigns, allInsights, filters.dateStart, filters.dateEnd]
  );
  const totalsByCampaign = useMemo(() => groupInsightsByCampaign(insights), [insights]);

  const breakdowns = useMemo(() => {
    const campaignIds = new Set(campaigns.map((c) => c.id));
    const result: Record<AudienceDimension, Array<{ segment: string; spend: number; share: number }>> = {
      age: [],
      gender: [],
      device: [],
      placement: [],
    };

    for (const dimension of Object.keys(result) as AudienceDimension[]) {
      const bySegment = new Map<string, number>();
      for (const row of allAudienceShares) {
        if (row.dimension !== dimension || !campaignIds.has(row.campaignId)) continue;
        const totals = totalsByCampaign.get(row.campaignId);
        if (!totals) continue;
        bySegment.set(row.segment, (bySegment.get(row.segment) ?? 0) + totals.spend * row.share);
      }
      const totalSpend = [...bySegment.values()].reduce((sum, v) => sum + v, 0);
      result[dimension] = [...bySegment.entries()]
        .map(([segment, spend]) => ({ segment, spend, share: totalSpend > 0 ? spend / totalSpend : 0 }))
        .sort((a, b) => b.share - a.share);
    }
    return result;
  }, [campaigns, totalsByCampaign, allAudienceShares]);

  if (campaigns.length === 0) {
    return (
      <div>
        <PageHeader title="Audiencias" description="Composición de la audiencia que recibió tus anuncios." />
        {error && <ErrorBanner message={error} />}
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Audiencias"
        description="Composición de la audiencia que recibió tus anuncios, estimada a partir de la inversión distribuida del período seleccionado."
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {DIMENSIONS.map(({ key, title, icon: Icon }) => {
          const top = breakdowns[key][0];
          return (
            <div key={key} className="rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
              <div className="mb-2 flex items-center gap-1.5 text-muted-2">
                <Icon size={14} />
                <span className="text-[10.5px] font-bold uppercase tracking-wide">Principal — {title}</span>
              </div>
              <div className="text-lg font-bold text-text">{top?.segment ?? "—"}</div>
              <div className="text-[11px] font-semibold text-accent-2">
                {top ? `${formatPercent(top.share * 100)} de la inversión` : "Sin datos"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        {DIMENSIONS.map(({ key, title, subtitle }) => (
          <ChartCard key={key} title={title} subtitle={subtitle}>
            <DonutBreakdown data={breakdowns[key]} />
          </ChartCard>
        ))}
      </div>

      <ChartCard title="Nota sobre estos datos" subtitle="Cómo se calculan las audiencias en este panel">
        <p className="text-[12.5px] leading-relaxed text-muted">
          La inversión total del período (
          {formatCurrency(insights.reduce((sum, r) => sum + r.spend, 0))}) se distribuye entre los segmentos de cada
          dimensión según la proporción real que reporta Meta para cada campaña.{" "}
          {isMock
            ? "Estos son datos de ejemplo — al conectar tu cuenta real de Meta se reemplazan por el desglose real de tus campañas."
            : "\"Ubicación del anuncio\" agrupa por plataforma (Facebook, Instagram, Messenger, Audience Network); Meta ofrece un desglose aún más fino por posición específica dentro de cada una si lo necesitas más adelante."}
        </p>
      </ChartCard>
    </div>
  );
}
