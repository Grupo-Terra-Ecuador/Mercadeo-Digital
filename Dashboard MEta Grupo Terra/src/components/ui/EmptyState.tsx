export default function EmptyState({
  title = "Sin datos para estos filtros",
  description = "Ajusta el rango de fechas o los filtros para ver resultados.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-border-2 bg-surface p-10 text-center">
      <p className="text-sm font-bold text-text">{title}</p>
      <p className="text-xs text-muted-2">{description}</p>
    </div>
  );
}
