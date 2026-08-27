import { AlertTriangle } from "lucide-react";

interface Props {
  message: string;
  tone?: "error" | "warning";
}

const TONE_STYLES: Record<NonNullable<Props["tone"]>, string> = {
  error: "border-red/30 bg-red/10 text-red",
  warning: "border-yellow/30 bg-yellow/10 text-yellow",
};

export default function ErrorBanner({ message, tone = "error" }: Props) {
  return (
    <div className={`mb-5 flex items-center gap-2 rounded-[12px] border px-3.5 py-2.5 text-[12.5px] font-semibold ${TONE_STYLES[tone]}`}>
      <AlertTriangle size={15} className="shrink-0" />
      {message}
    </div>
  );
}
