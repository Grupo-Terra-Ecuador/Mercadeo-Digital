"use client";

import { useMemo } from "react";
import { GalleryHorizontal, Image as ImageIcon, LayoutGrid, Video, type LucideIcon } from "lucide-react";
import { useFiltersStore } from "@/store/filters-store";
import { getCreativeInsightsForCampaigns, getFilteredCampaigns } from "@/lib/selectors";
import { calcCostPerResult, calcCtr } from "@/lib/metrics";
import { DATASET } from "@/lib/mock/dataset";
import { formatCurrency, formatCurrencyPrecise, formatInteger, formatPercent } from "@/lib/format";
import type { CreativeFormat } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";
import BrandComparisonChart from "@/components/charts/BrandComparisonChart";

const FORMAT_META: Record<CreativeFormat, { label: string; icon: LucideIcon; color: string }> = {
  image: { label: "Imagen", icon: ImageIcon, color: "#4c8cff" },
  video: { label: "Video", icon: Video, color: "#a78bfa" },
  carousel: { label: "Carrusel", icon: GalleryHorizontal, color: "#22c55e" },
  collection: { label: "Colección", icon: LayoutGrid, color: "#f5b849" },
};

interface CreativeRow {
  id: string;
  headline: string;
  campaignName: string;
  format: CreativeFormat;
  swatch: string;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  ctr: number;
  costPerResult: number;
}

export default function CreativosPage() {
  const filters = useFiltersStore();

  const campaigns = useMemo(() => getFilteredCampaigns(filters), [filters]);
  const campaignNameById = useMemo(() => new Map(campaigns.map((c) => [c.id, c.name])), [campaigns]);
  const creativeInsights = useMemo(
    () => getCreativeInsightsForCampaigns(campaigns, filters.dateStart, filters.dateEnd),
    [campaigns, filters.dateStart, filters.dateEnd]
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
    return DATASET.creatives
      .filter((cr) => campaignIds.has(cr.campaignId))
      .map((cr) => {
        const t = totalsByCreative.get(cr.id) ?? { spend: 0, impressions: 0, clicks: 0, results: 0 };
        return {
          id: cr.id,
          headline: cr.headline,
          campaignName: campaignNameById.get(cr.campaignId) ?? "—",
          format: cr.format,
          swatch: cr.swatch,
          spend: t.spend,
          impressions: t.impressions,
          clicks: t.clicks,
          results: t.results,
          ctr: calcCtr({ spend: t.spend, reach: 0, impressions: t.impressions, clicks: t.clicks, results: t.results }),
          costPerResult: calcCostPerResult({ spend: t.spend, reach: 0, impressions: t.impressions, clicks: t.clicks, results: t.results }),
        };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [campaigns, campaignNameById, creativeInsights]);

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

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ChartCard title="Inversión por formato" subtitle="Qué tipo de creativo concentra más presupuesto" className="max-w-xl">
            <BrandComparisonChart data={formatChartData} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((row) => {
              const meta = FORMAT_META[row.format];
              const Icon = meta.icon;
              return (
                <div key={row.id} className="rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                  <div
                    className="mb-3 flex h-24 items-center justify-center rounded-[12px] text-3xl"
                    style={{ background: `${row.swatch}22`, color: row.swatch }}
                  >
                    <Icon size={30} />
                  </div>
                  <span
                    className="mb-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold"
                    style={{ borderColor: `${meta.color}4d`, color: meta.color, background: `${meta.color}1a` }}
                  >
                    {meta.label}
                  </span>
                  <div className="text-[13px] font-bold leading-snug text-text">{row.headline}</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-2">{row.campaignName}</div>

                  <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 border-t border-border pt-3">
                    <Metric label="Inversión" value={formatCurrency(row.spend)} />
                    <Metric label="CTR" value={formatPercent(row.ctr)} />
                    <Metric label="Resultados" value={formatInteger(row.results)} />
                    <Metric label="Costo/Result." value={formatCurrencyPrecise(row.costPerResult)} />
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
