"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_STYLE, CHART_GRID, TOOLTIP_STYLE } from "@/lib/chart-colors";
import { formatCompact, formatCurrencyPrecise } from "@/lib/format";

interface Props {
  data: Array<{ name: string; value: number; color: string }>;
  currency?: string;
}

export default function BrandComparisonChart({ data, currency = "USD" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} horizontal={false} />
        <XAxis type="number" tickFormatter={formatCompact} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={150} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          formatter={(value) => [formatCurrencyPrecise(Number(value ?? 0), currency), "Inversión"]}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
