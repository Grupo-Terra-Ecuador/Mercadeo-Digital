import { STATUS_LABELS } from "@/lib/mock/dataset";
import type { CampaignStatus } from "@/lib/types";

const STATUS_STYLES: Record<CampaignStatus, string> = {
  ACTIVE: "border-green/30 bg-green/10 text-green",
  PAUSED: "border-yellow/30 bg-yellow/10 text-yellow",
  ARCHIVED: "border-border-2 bg-surface-3 text-muted-2",
};

export default function StatusPill({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
