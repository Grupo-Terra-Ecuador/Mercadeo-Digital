"use client";

import { useDashboardStore } from "@/store/use-dashboard-store";

const BANNER_STYLES: Record<string, string> = {
  warn: "border-yellow/25 bg-yellow/10 text-yellow",
  ok: "border-green/25 bg-green/10 text-green",
  bad: "border-red/25 bg-red/10 text-red",
};

const BANNER_ICON: Record<string, string> = { warn: "⚠️", ok: "✅", bad: "🔴" };

export default function Hero() {
  const banner = useDashboardStore((s) => s.banner);

  return (
    <section id="carga" className="hero relative mb-[18px] overflow-hidden rounded-[22px] border border-border-2 bg-gradient-to-br from-[#13203a] via-[#0f172a] to-[#1a1000] p-7 max-[900px]:rounded-2xl max-[900px]:p-[22px_18px]">
      <div className="pointer-events-none absolute -right-[90px] -top-[90px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(255,121,0,.28),transparent_66%)]" />
      <div className="eyebrow relative z-[1] mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/[.11] px-[13px] py-1.5 text-[11px] font-black text-orange-2">
        Dashboard 1.0 BETA - Datos automatizados GA4 y Search Console - navegacion activa - modulos dinamicos segun datos
      </div>
      <h1 className="relative z-[1] mb-2 text-[30px] leading-[1.12] max-[900px]:text-[25px]">
        Dashboard de <span className="text-orange">analitica web tecnica</span>
      </h1>
      <p className="relative z-[1] mb-5 max-w-[820px] text-muted">
        Visualiza unicamente adquisicion, usuarios, audiencias, fuentes, paginas, dispositivos, navegadores, rebote, consultas
        organicas y demografia. Se eliminaron embudos, leads, estimaciones comerciales, ecommerce, marcas y diagnosticos de
        ventas.
      </p>
      <div
        id="statusBanner"
        className={`statusBanner relative z-[1] mt-[13px] flex items-start gap-2.5 rounded-[13px] border px-3.5 py-3 text-[13px] font-bold ${BANNER_STYLES[banner.type]}`}
      >
        <span>{BANNER_ICON[banner.type]}</span>
        <span>{banner.message}</span>
      </div>
      <div className="scope relative z-[1] mt-3 rounded-[13px] border border-blue/25 bg-blue/[0.07] px-3.5 py-3 text-xs leading-[1.55] text-[#bddcff]">
        <b>Alcance tecnico:</b> adquisicion de trafico por canales; usuarios totales, nuevos y recurrentes; audiencias;
        fuente/medio; paginas mas visitadas; dispositivo; navegador; tasa de rebote; consultas de busqueda organica; sexo,
        provincia/region, pais y ciudad.
      </div>
    </section>
  );
}
