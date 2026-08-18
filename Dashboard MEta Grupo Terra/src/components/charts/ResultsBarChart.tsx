"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_STYLE, CHART_GREEN, CHART_GRID, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "@/lib/chart-colors";
import { formatCompact, formatDateLong, formatDateShort, formatInteger } from "@/lib/format";

interface Props {
  data: Array<{ date: string; results: number }>;
  resultLabel: string;
}

export default function ResultsBarChart({ data, resultLabel }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={formatCompact} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label) => formatDateLong(String(label ?? ""))}
          formatter={(value) => [formatInteger(Number(value ?? 0)), resultLabel]}
        />
        <Bar dataKey="results" fill={CHART_GREEN} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
