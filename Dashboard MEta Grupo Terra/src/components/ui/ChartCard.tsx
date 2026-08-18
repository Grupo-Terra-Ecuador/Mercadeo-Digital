import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, action, children, className }: Props) {
  return (
    <div className={`rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)] ${className ?? ""}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-bold text-text">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-2">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
