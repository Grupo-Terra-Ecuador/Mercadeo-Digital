// Clases Tailwind compartidas por los fragmentos HTML que arman las secciones del
// dashboard (tablas, tags, acordeones de detalle/IA). Centralizado aqui para no repetir
// las mismas cadenas larguisimas en cada seccion.

export const TABLEWRAP = "scrollbar-terra overflow-auto rounded-[13px] border border-border";
export const TABLEWRAP_LIMIT10 = TABLEWRAP + " max-h-[438px]";
export const TABLE = "w-full border-collapse bg-transparent";
export const TH = "sticky top-0 z-[1] bg-[#151e30] px-3 py-2.5 text-left align-top text-[10px] font-black uppercase tracking-[.06em] text-muted-2";
export const TH_NUM = TH + " text-right whitespace-nowrap";
// El <tr> que envuelve cada fila debe llevar class="group" para que este hover funcione.
export const TD = "border-b border-border px-3 py-2.5 text-left align-top text-xs text-muted group-hover:bg-white/[0.025]";
export const TD_NUM = TD + " text-right whitespace-nowrap";
export const TR = "group";
export const EMPTY = "rounded-[13px] border border-dashed border-border-2 bg-white/[0.015] p-[18px] text-center text-xs text-muted-2";

const TAG_BASE = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold";
export const TAG: Record<"default" | "ok" | "warn" | "bad" | "info" | "date", string> = {
  default: `${TAG_BASE} bg-muted/[0.12] text-muted`,
  ok: `${TAG_BASE} bg-green/[0.12] text-green`,
  warn: `${TAG_BASE} bg-yellow/[0.12] text-yellow`,
  bad: `${TAG_BASE} bg-red/[0.12] text-red`,
  info: `${TAG_BASE} bg-blue/[0.12] text-blue`,
  date: `${TAG_BASE} bg-purple/[0.13] text-purple`,
};

export const AI_BODY = "border border-blue/28 bg-blue/[0.08] rounded-[13px] px-3.5 py-3 text-xs leading-[1.55] text-[#a9d0ff]";

export const DETAIL_ACCORDION =
  "detail-accordion group mt-3 overflow-hidden rounded-terra border border-border bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,.03)]";
export const DETAIL_SUMMARY =
  "flex cursor-pointer list-none items-center justify-between gap-2 px-[18px] py-[18px] text-[13px] font-black text-text [&::-webkit-details-marker]:hidden";
export const DETAIL_CHEVRON = "text-xs text-muted transition-transform group-open:rotate-180";
export const DETAIL_BODY = "px-[18px] pb-[18px]";

export const AI_ACCORDION = "ai-accordion group mt-3 overflow-hidden rounded-[13px] border border-blue/28 bg-blue/[0.08]";
export const AI_SUMMARY =
  "flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-extrabold text-[#a9d0ff] [&::-webkit-details-marker]:hidden";
export const AI_CHEVRON = "text-[11px] text-[#a9d0ff] transition-transform group-open:rotate-180";
export const AI_INNER_BODY = "border-t border-blue/[0.18] px-3.5 pb-3.5 pt-2.5 text-xs leading-[1.55] text-[#a9d0ff]";

export const CHART_CARD = "min-w-0 rounded-terra border border-border bg-surface p-[18px]";
export const CHART_GRID = "grid grid-cols-2 gap-3 max-[1050px]:grid-cols-1";
export const CHART_HEAD_TITLE = "text-[13px] text-text";
export const CHART_HEAD_SUB = "mt-[3px] text-[11px] text-muted-2";
