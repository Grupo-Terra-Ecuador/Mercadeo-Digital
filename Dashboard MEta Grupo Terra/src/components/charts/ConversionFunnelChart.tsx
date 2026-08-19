"use client";

import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_PALETTE, TOOLTIP_STYLE } from "@/lib/chart-colors";
import { formatInteger, formatPercent } from "@/lib/format";

export interface FunnelStage {
  name: string;
  value: number;
}

export default function ConversionFunnelChart({ stages }: { stages: FunnelStage[] }) {
  const base = stages[0]?.value || 1;
  const data = stages.map((s, i) => ({ ...s, fill: CHART_PALETTE[i % CHART_PALETTE.length] }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <FunnelChart>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => formatInteger(Number(value ?? 0))}
        />
        <Funnel dataKey="value" data={data} isAnimationActive>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
          <LabelList
            position="right"
            dataKey="name"
            fill="#f2f5f9"
            stroke="none"
            fontSize={12}
            fontWeight={700}
            content={(props: { x?: number; y?: number; width?: number; height?: number; index?: number }) => {
              const { x = 0, y = 0, width = 0, height = 0, index } = props;
              if (index === undefined) return null;
              const stage = data[index];
              const pct = base > 0 ? (stage.value / base) * 100 : 0;
              return (
                <text x={Number(x) + Number(width) + 12} y={Number(y) + Number(height) / 2} textAnchor="start" dominantBaseline="middle">
                  <tspan fill="#f2f5f9" fontSize={12} fontWeight={700}>
                    {stage.name}
                  </tspan>
                  <tspan fill="#93a0b8" fontSize={11} fontWeight={600} dx={8}>
                    {formatInteger(stage.value)} ({formatPercent(pct)})
                  </tspan>
                </text>
              );
            }}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
