"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_STYLE, CHART_ACCENT, CHART_GRID, CHART_MUTED, TOOLTIP_STYLE } from "@/lib/chart-colors";
import { formatCompact } from "@/lib/format";

interface Props {
  data: Array<{ index: number; current: number; previous: number }>;
  formatter: (value: number) => string;
}

export default function ComparisonTrendChart({ data, formatter }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="index" tickFormatter={(i: number) => `Día ${i}`} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis tickFormatter={formatCompact} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(label) => `Día ${label} del período`}
          formatter={(value) => formatter(Number(value ?? 0))}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: "#93a0b8" }} />
        <Line type="monotone" dataKey="current" name="Período actual" stroke={CHART_ACCENT} strokeWidth={2.25} dot={false} />
        <Line
          type="monotone"
          dataKey="previous"
          name="Período anterior"
          stroke={CHART_MUTED}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
