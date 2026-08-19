import { AlertTriangle } from "lucide-react";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-5 flex items-center gap-2 rounded-[12px] border border-red/30 bg-red/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-red">
      <AlertTriangle size={15} className="shrink-0" />
      {message}
    </div>
  );
}
