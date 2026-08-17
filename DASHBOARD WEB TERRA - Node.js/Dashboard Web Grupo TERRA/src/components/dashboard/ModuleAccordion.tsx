"use client";

import type { ReactNode } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { moduleHasData, type ModuleId } from "@/lib/dashboard/module-availability";

export default function ModuleAccordion({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id: ModuleId;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const model = useDashboardStore((s) => s.model);
  const checked = useDashboardStore((s) => s.exportModules.find((m) => m.id === id)?.checked ?? true);
  const setExportModuleChecked = useDashboardStore((s) => s.setExportModuleChecked);
  const available = moduleHasData(id, model);

  if (!available) return null;

  return (
    <section id={id} className="section my-6 scroll-mt-[78px]">
      <details
        className="accordion group overflow-hidden rounded-[18px] border border-border bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]"
        open={defaultOpen}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-transparent bg-gradient-to-r from-orange/10 to-white/[0.015] px-4 py-3.5 group-open:border-border [&::-webkit-details-marker]:hidden">
          <span className="module-title flex items-center gap-2 text-[15px] font-black text-text">{title}</span>
          <span className="summary-actions flex shrink-0 items-center gap-2.5">
            <label
              className="module-select inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-orange/28 bg-orange/[.08] px-2.5 py-1.5 text-[11px] font-black text-orange-2"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                className="export-section h-3.5 w-3.5 accent-orange"
                value={id}
                checked={checked}
                onChange={(e) => setExportModuleChecked(id, e.target.checked)}
              />{" "}
              Incluir en HTML
            </label>
            <span className="chevron grid h-6 w-6 place-items-center rounded-lg bg-white/[0.06] text-muted transition-transform group-open:rotate-180 group-open:text-orange-2">
              ▾
            </span>
          </span>
        </summary>
        <div className="module-body p-4">{children}</div>
      </details>
    </section>
  );
}
