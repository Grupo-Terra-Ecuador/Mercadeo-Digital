"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { renderValidation } from "@/lib/dashboard/sections/validacion";
import { EMPTY } from "@/lib/dashboard/html-styles";

export default function ValidacionSection() {
  const model = useDashboardStore((s) => s.model);
  const datasets = useDashboardStore((s) => s.datasets);

  useEffect(() => {
    renderValidation();
  }, [model, datasets]);

  return (
    <div id="validation">
      <div className={EMPTY}>Sin archivos cargados.</div>
    </div>
  );
}
