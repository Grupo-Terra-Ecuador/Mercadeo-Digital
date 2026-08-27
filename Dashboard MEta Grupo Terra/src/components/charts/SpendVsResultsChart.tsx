"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AXIS_TICK_STYLE,
  CHART_ACCENT,
  CHART_GRID,
  CHART_YELLOW,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "@/lib/chart-colors";
import { formatCompact, formatCurrencyPrecise, formatDateLong, formatDateShort, formatInteger } from "@/lib/format";

interface Props {
  data: Array<{ date: string; spend: number; results: number }>;
  resultLabel: string;
  currency?: string;
}

export default function SpendVsResultsChart({ data, resultLabel, currency = "USD" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis yAxisId="left" tickFormatter={formatCompact} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={40} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={formatCompact} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label) => formatDateLong(String(label ?? ""))}
          formatter={(value, name) =>
            name === "Inversión" ? [formatCurrencyPrecise(Number(value ?? 0), currency), name] : [formatInteger(Number(value ?? 0)), name]
          }
        />
        <Bar yAxisId="left" dataKey="results" name={resultLabel} fill={CHART_ACCENT} fillOpacity={0.55} radius={[4, 4, 0, 0]} maxBarSize={20} />
        <Line yAxisId="right" type="monotone" dataKey="spend" name="Inversión" stroke={CHART_YELLOW} strokeWidth={2.25} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
