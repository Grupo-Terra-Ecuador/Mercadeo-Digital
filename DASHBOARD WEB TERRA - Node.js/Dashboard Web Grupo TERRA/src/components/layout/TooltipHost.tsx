export default function TooltipHost() {
  return (
    <div
      id="tooltip"
      role="tooltip"
      aria-hidden="true"
      className="fixed z-[999999] max-w-[min(520px,calc(100vw-28px))] -translate-y-1.5 rounded-[13px] border border-border-2 bg-[#1e293b] px-[15px] py-[13px] text-xs font-semibold leading-[1.55] text-[#f8fafc] opacity-0 shadow-terra transition-all duration-[120ms] [overflow-wrap:anywhere] [white-space:pre-line] pointer-events-none"
    />
  );
}
