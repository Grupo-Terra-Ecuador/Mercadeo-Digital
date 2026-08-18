import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDelta } from "@/lib/format";

interface Props {
  label: string;
  value: string;
  deltaPct?: number;
  icon?: LucideIcon;
  invertDeltaColor?: boolean;
}

export default function KpiCard({ label, value, deltaPct, icon: Icon, invertDeltaColor }: Props) {
  const isPositive = (deltaPct ?? 0) >= 0;
  const isGood = invertDeltaColor ? !isPositive : isPositive;

  return (
    <div className="rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">{label}</span>
        {Icon && <Icon size={15} className="text-muted-2" />}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-text">{value}</div>
      {deltaPct !== undefined && (
        <div
          className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold ${
            isGood ? "text-green" : "text-red"
          }`}
        >
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {formatDelta(deltaPct)}
          <span className="font-medium text-muted-2">vs. periodo anterior</span>
        </div>
      )}
    </div>
  );
}
