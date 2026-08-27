"use client";

import { useMemo } from "react";
import { GalleryHorizontal, Image as ImageIcon, LayoutGrid, Video, type LucideIcon } from "lucide-react";
import { useFiltersStore } from "@/store/filters-store";
import { getAccountById, getCreativeInsightsForCampaigns, getFilteredCampaigns, resolveCurrency } from "@/lib/selectors";
import { calcCostPerResult, calcCtr } from "@/lib/metrics";
import { formatCurrency, formatCurrencyPrecise, formatInteger, formatPercent } from "@/lib/format";
import { useDashboardData } from "@/store/dashboard-data-context";
import type { CreativeFormat, QualityRanking } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBanner from "@/components/ui/ErrorBanner";
import BrandComparisonChart from "@/components/charts/BrandComparisonChart";

const FORMAT_META: Record<CreativeFormat, { label: string; icon: LucideIcon; color: string }> = {
  image: { label: "Imagen", icon: ImageIcon, color: "#4c8cff" },
  video: { label: "Video", icon: Video, color: "#a78bfa" },
  carousel: { label: "Carrusel", icon: GalleryHorizontal, color: "#22c55e" },
  collection: { label: "Colección", icon: LayoutGrid, color: "#f5b849" },
};

const RANKING_META: Record<QualityRanking, { label: string; color: string }> = {
  above_average: { label: "Sobre el promedio", color: "#22c55e" },
  average: { label: "Promedio", color: "#93a0b8" },
  below_average: { label: "Bajo el promedio", color: "#f0475b" },
  unknown: { label: "Sin datos suficientes", color: "#64708a" },
};

interface CreativeRow {
  id: string;
  headline: string;
  campaignName: string;
  format: CreativeFormat;
  swatch: string;
  thumbnailUrl?: string;
  currency: string;
  qualityRanking: QualityRanking;
  engagementRanking: QualityRanking;
  conversionRanking: QualityRanking;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  ctr: number;
  costPerResult: number;
}

export default function CreativosPage() {
  const filters = useFiltersStore();
  const { accounts, campaigns: allCampaigns, creatives: allCreatives, creativeDailyInsights: allCreativeInsights, error } = useDashboardData();

  const campaigns = useMemo(() => getFilteredCampaigns(allCampaigns, filters), [allCampaigns, filters]);
  const campaignById = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const { currency, mixed: mixedCurrency } = useMemo(() => resolveCurrency(accounts, campaigns), [accounts, campaigns]);
  const creativeInsights = useMemo(
    () => getCreativeInsightsForCampaigns(campaigns, allCreativeInsights, filters.dateStart, filters.dateEnd),
    [campaigns, allCreativeInsights, filters.dateStart, filters.dateEnd]
  );

  const rows: CreativeRow[] = useMemo(() => {
    const totalsByCreative = new Map<string, { spend: number; impressions: number; clicks: number; results: number }>();
    for (const row of creativeInsights) {
      const acc = totalsByCreative.get(row.creativeId) ?? { spend: 0, impressions: 0, clicks: 0, results: 0 };
      acc.spend += row.spend;
      acc.impressions += row.impressions;
      acc.clicks += row.clicks;
      acc.results += row.results;
      totalsByCreative.set(row.creativeId, acc);
    }

    const campaignIds = new Set(campaigns.map((c) => c.id));
    return allCreatives
      .filter((cr) => campaignIds.has(cr.campaignId))
      .map((cr) => {
        const t = totalsByCreative.get(cr.id) ?? { spend: 0, impressions: 0, clicks: 0, results: 0 };
        const campaign = campaignById.get(cr.campaignId);
        return {
          id: cr.id,
          headline: cr.headline,
          campaignName: campaign?.name ?? "—",
          format: cr.format,
          swatch: cr.swatch,
          thumbnailUrl: cr.thumbnailUrl,
          currency: (campaign && getAccountById(accounts, campaign.accountId)?.currency) ?? "USD",
          qualityRanking: cr.qualityRanking ?? "unknown",
          engagementRanking: cr.engagementRanking ?? "unknown",
          conversionRanking: cr.conversionRanking ?? "unknown",
          spend: t.spend,
          impressions: t.impressions,
          clicks: t.clicks,
          results: t.results,
          ctr: calcCtr({ spend: t.spend, reach: 0, impressions: t.impressions, clicks: t.clicks, results: t.results, landingPageViews: 0 }),
          costPerResult: calcCostPerResult({ spend: t.spend, reach: 0, impressions: t.impressions, clicks: t.clicks, results: t.results, landingPageViews: 0 }),
        };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [campaigns, campaignById, creativeInsights, allCreatives, accounts]);

  const formatChartData = useMemo(() => {
    const byFormat = new Map<CreativeFormat, number>();
    for (const row of rows) {
      byFormat.set(row.format, (byFormat.get(row.format) ?? 0) + row.spend);
    }
    return [...byFormat.entries()]
      .map(([format, value]) => ({ name: FORMAT_META[format].label, value, color: FORMAT_META[format].color }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Creativos" description="Desempeño de cada pieza creativa (imagen, video, carrusel o colección) usada en tus anuncios." />

      {error && <ErrorBanner message={error} />}
      {mixedCurrency && (
        <ErrorBanner
          tone="warning"
          message="Estos creativos pertenecen a cuentas con monedas distintas — la inversión mostrada mezcla monedas."
        />
      )}

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ChartCard title="Inversión por formato" subtitle="Qué tipo de creativo concentra más presupuesto" className="max-w-xl">
            <BrandComparisonChart data={formatChartData} currency={currency} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((row) => {
              const meta = FORMAT_META[row.format];
              const Icon = meta.icon;
              return (
                <div key={row.id} className="rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                  {row.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- miniatura viene de un CDN externo de Meta con subdominios variables
                    <img
                      src={row.thumbnailUrl}
                      alt={row.headline}
                      className="mb-3 h-24 w-full rounded-[12px] object-cover"
                    />
                  ) : (
                    <div
                      className="mb-3 flex h-24 items-center justify-center rounded-[12px] text-3xl"
                      style={{ background: `${row.swatch}22`, color: row.swatch }}
                    >
                      <Icon size={30} />
                    </div>
                  )}
                  <span
                    className="mb-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold"
                    style={{ borderColor: `${meta.color}4d`, color: meta.color, background: `${meta.color}1a` }}
                  >
                    {meta.label}
                  </span>
                  <div className="text-[13px] font-bold leading-snug text-text">{row.headline}</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-2">{row.campaignName}</div>

                  <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 border-t border-border pt-3">
                    <Metric label="Inversión" value={formatCurrency(row.spend, row.currency)} />
                    <Metric label="CTR" value={formatPercent(row.ctr)} />
                    <Metric label="Resultados" value={formatInteger(row.results)} />
                    <Metric label="Costo/Result." value={formatCurrencyPrecise(row.costPerResult, row.currency)} />
                  </div>

                  <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
                    <RankingRow label="Calidad" ranking={row.qualityRanking} />
                    <RankingRow label="Interacción" ranking={row.engagementRanking} />
                    <RankingRow label="Conversión" ranking={row.conversionRanking} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9.5px] font-bold uppercase tracking-wide text-muted-2">{label}</div>
      <div className="text-[12.5px] font-bold text-text">{value}</div>
    </div>
  );
}

function RankingRow({ label, ranking }: { label: string; ranking: QualityRanking }) {
  const meta = RANKING_META[ranking];
  return (
    <div className="flex items-center justify-between text-[10.5px]">
      <span className="font-semibold text-muted-2">{label}</span>
      <span className="inline-flex items-center gap-1 font-bold" style={{ color: meta.color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
        {meta.label}
      </span>
    </div>
  );
}
