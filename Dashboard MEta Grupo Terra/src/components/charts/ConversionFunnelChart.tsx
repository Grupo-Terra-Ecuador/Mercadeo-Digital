"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_STYLE, CHART_GRID, CHART_PALETTE, TOOLTIP_STYLE } from "@/lib/chart-colors";
import { formatCompact, formatInteger, formatPercent } from "@/lib/format";

export interface FunnelStage {
  name: string;
  value: number;
}

export default function ConversionFunnelChart({ stages }: { stages: FunnelStage[] }) {
  const base = stages[0]?.value || 1;
  const data = stages.map((s, i) => ({
    ...s,
    pct: base > 0 ? (s.value / base) * 100 : 0,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 62)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 70, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} horizontal={false} />
        <XAxis type="number" tickFormatter={formatCompact} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={170} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          formatter={(value: unknown, _name: unknown, item: { payload?: { pct?: number } }) => [
            `${formatInteger(Number(value ?? 0))} (${formatPercent(item?.payload?.pct ?? 0)})`,
            "Cantidad",
          ]}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={34}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="pct"
            position="right"
            formatter={(value: unknown) => formatPercent(Number(value ?? 0))}
            fill="#93a0b8"
            fontSize={11}
            fontWeight={700}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
