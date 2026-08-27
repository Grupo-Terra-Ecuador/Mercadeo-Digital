"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_STYLE, CHART_ACCENT, CHART_GRID, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "@/lib/chart-colors";
import { formatCompact, formatCurrencyPrecise, formatDateLong, formatDateShort } from "@/lib/format";

interface Props {
  data: Array<{ date: string; spend: number }>;
  currency?: string;
}

export default function SpendTrendChart({ data, currency = "USD" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_ACCENT} stopOpacity={0.45} />
            <stop offset="100%" stopColor={CHART_ACCENT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={formatCompact} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label) => formatDateLong(String(label ?? ""))}
          formatter={(value) => [formatCurrencyPrecise(Number(value ?? 0), currency), "Inversión"]}
        />
        <Area type="monotone" dataKey="spend" stroke={CHART_ACCENT} strokeWidth={2} fill="url(#spendGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
