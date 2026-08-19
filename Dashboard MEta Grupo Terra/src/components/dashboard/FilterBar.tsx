"use client";

import { useMemo } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useFiltersStore, DEFAULT_RANGE_START, DEFAULT_RANGE_END } from "@/store/filters-store";
import { OBJECTIVE_LABELS, STATUS_LABELS, isoDateOffset } from "@/lib/mock/dataset";
import { getFilteredCampaigns } from "@/lib/selectors";
import { useDashboardData } from "@/store/dashboard-data-context";

const PRESETS = [
  { label: "7 días", days: 7 },
  { label: "14 días", days: 14 },
  { label: "30 días", days: 30 },
];

export default function FilterBar() {
  const filters = useFiltersStore();
  const { accounts, brands, campaigns, refresh, loading, isMock } = useDashboardData();

  // Se calcula en cada render (no en un efecto) para no encadenar renders;
  // el único riesgo es un aviso de hidratación inofensivo justo a medianoche.
  const maxDate = new Date().toISOString().slice(0, 10);

  const brandOptions = useMemo(
    () => brands.filter((b) => filters.accountId === "all" || b.accountId === filters.accountId),
    [brands, filters.accountId]
  );

  const campaignOptions = useMemo(
    () =>
      getFilteredCampaigns(campaigns, {
        accountId: filters.accountId,
        brandId: filters.brandId,
        objective: filters.objective,
        status: filters.status,
        campaignId: "all",
      }).sort((a, b) => a.name.localeCompare(b.name)),
    [campaigns, filters.accountId, filters.brandId, filters.objective, filters.status]
  );

  const isDefault =
    filters.dateStart === DEFAULT_RANGE_START &&
    filters.dateEnd === DEFAULT_RANGE_END &&
    filters.accountId === "all" &&
    filters.brandId === "all" &&
    filters.objective === "all" &&
    filters.status === "all" &&
    filters.campaignId === "all";

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[16px] border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Desde">
          <input
            type="date"
            value={filters.dateStart}
            max={filters.dateEnd}
            onChange={(e) => filters.setDateRange(e.target.value, filters.dateEnd)}
            className="h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs font-semibold text-text outline-none focus:border-accent"
          />
        </Field>
        <Field label="Hasta">
          <input
            type="date"
            value={filters.dateEnd}
            min={filters.dateStart}
            max={maxDate}
            onChange={(e) => filters.setDateRange(filters.dateStart, e.target.value)}
            className="h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs font-semibold text-text outline-none focus:border-accent"
          />
        </Field>
        <div className="flex gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => filters.setDateRange(isoDateOffset(maxDate, -(preset.days - 1)), maxDate)}
              className="h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-[11px] font-bold text-muted transition hover:border-accent hover:text-text"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <Field label="Cuenta">
          <select
            value={filters.accountId}
            onChange={(e) => filters.setAccountId(e.target.value)}
            className="h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs font-semibold text-text outline-none focus:border-accent"
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Marca">
          <select
            value={filters.brandId}
            onChange={(e) => filters.setBrandId(e.target.value)}
            className="h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs font-semibold text-text outline-none focus:border-accent"
          >
            <option value="all">Todas las marcas</option>
            {brandOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Objetivo">
          <select
            value={filters.objective}
            onChange={(e) => filters.setObjective(e.target.value as typeof filters.objective)}
            className="h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs font-semibold text-text outline-none focus:border-accent"
          >
            <option value="all">Todos los objetivos</option>
            {Object.entries(OBJECTIVE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estado">
          <select
            value={filters.status}
            onChange={(e) => filters.setStatus(e.target.value as typeof filters.status)}
            className="h-9 rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs font-semibold text-text outline-none focus:border-accent"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Campaña">
          <select
            value={filters.campaignId}
            onChange={(e) => filters.setCampaignId(e.target.value)}
            className="h-9 max-w-[220px] rounded-[10px] border border-border-2 bg-surface-2 px-2.5 text-xs font-semibold text-text outline-none focus:border-accent"
          >
            <option value="all">Todas las campañas</option>
            {campaignOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => refresh()}
          disabled={loading}
          title={isMock ? "Reintentar conexión con Meta y traer datos actualizados" : "Traer los datos más recientes de Meta"}
          className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-accent bg-accent px-3 text-[11px] font-bold text-white transition hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {loading ? "Actualizando…" : "Actualizar datos"}
        </button>
        <button
          type="button"
          onClick={filters.resetFilters}
          disabled={isDefault}
          className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border-2 bg-surface-2 px-3 text-[11px] font-bold text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={13} />
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-2">{label}</span>
      {children}
    </label>
  );
}
