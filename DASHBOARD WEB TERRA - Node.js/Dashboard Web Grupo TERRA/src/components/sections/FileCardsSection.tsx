"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { renderFileCards } from "@/lib/dashboard/sections/file-cards";
import { EMPTY } from "@/lib/dashboard/html-styles";

export default function FileCardsSection() {
  const model = useDashboardStore((s) => s.model);
  const files = useDashboardStore((s) => s.files);
  const datasets = useDashboardStore((s) => s.datasets);

  useEffect(() => {
    renderFileCards();
  }, [model, files, datasets]);

  return (
    <div id="fileCards" className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2.5">
      <div className={EMPTY}>Sin archivos cargados.</div>
    </div>
  );
}
