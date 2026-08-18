"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_PALETTE, TOOLTIP_STYLE } from "@/lib/chart-colors";
import { formatPercent } from "@/lib/format";

interface Props {
  data: Array<{ segment: string; share: number }>;
}

export default function DonutBreakdown({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="share"
          nameKey="segment"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, idx) => (
            <Cell key={entry.segment} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatPercent(Number(value ?? 0) * 100)} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, fontWeight: 600, color: "#93a0b8" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
