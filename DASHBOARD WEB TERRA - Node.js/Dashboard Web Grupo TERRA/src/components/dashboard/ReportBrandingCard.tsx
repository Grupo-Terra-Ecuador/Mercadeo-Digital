"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboardStore } from "@/store/use-dashboard-store";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB: generoso para un logo, prudente para no llenar localStorage.

const fieldClass =
  "w-full rounded-[10px] border border-border-2 bg-surface-2 px-2.5 py-[9px] text-text outline-none [color-scheme:dark] focus:border-orange focus:shadow-[0_0_0_3px_rgba(255,121,0,.15)]";

// Personalizacion de marca del informe: logo + nombre + fecha de procesamiento. Solo es
// editable aqui, en el dashboard en vivo — este componente (con sus controles de carga y
// campos de texto) nunca se clona hacia el HTML exportado (ver lib/export/export-html.ts,
// que arma su propio bloque de solo lectura leyendo directamente del store).
export default function ReportBrandingCard() {
  const branding = useDashboardStore((s) => s.branding);
  const hydrateBranding = useDashboardStore((s) => s.hydrateBranding);
  const setBrandLogo = useDashboardStore((s) => s.setBrandLogo);
  const setBrandName = useDashboardStore((s) => s.setBrandName);
  const setProcessedDateFrom = useDashboardStore((s) => s.setProcessedDateFrom);
  const setProcessedDateTo = useDashboardStore((s) => s.setProcessedDateTo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // localStorage no existe durante el render en servidor: se carga una sola vez, ya en el
  // navegador, en vez de leerlo directamente en el estado inicial del store.
  useEffect(() => {
    hydrateBranding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (PNG, JPG, SVG, etc.).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(`La imagen pesa demasiado (${(file.size / 1024 / 1024).toFixed(1)} MB). Usa una de hasta 2 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBrandLogo(String(reader.result));
    reader.onerror = () => setError("No se pudo leer la imagen. Intenta con otro archivo.");
    reader.readAsDataURL(file);
  }

  return (
    <section className="section my-6">
      <div className="card rounded-terra border border-border bg-surface p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
        <div className="cardtitle mb-2.5 flex items-center gap-1.5 text-[13px] font-black text-text">Personalizacion del informe</div>
        <div className="cardsub -mt-1 mb-3 text-[11px] text-muted-2">
          Logotipo y datos de marca para este informe. Solo se editan aqui, en el dashboard; en el HTML exportado apareceran
          congelados tal cual, sin ningun control de edicion.
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-dashed border-border-2 bg-white/[0.02]">
              {branding.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoDataUrl} alt="Logo de la marca" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] text-muted-2">Sin logo</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn rounded-[10px] border border-border-2 bg-transparent px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-surface-2 hover:text-text"
              >
                {branding.logoDataUrl ? "Cambiar logo" : "Subir logo"}
              </button>
              {branding.logoDataUrl && (
                <button
                  type="button"
                  onClick={() => setBrandLogo(null)}
                  className="text-[11px] font-bold text-muted-2 underline decoration-dotted hover:text-red"
                >
                  Quitar logo
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2.5 max-[900px]:grid-cols-1">
            <div className="field">
              <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Nombre de la marca</label>
              <input
                type="text"
                value={branding.brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ej. Grupo TERRA"
                className={fieldClass}
              />
            </div>
            <div className="field">
              <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Procesamiento desde</label>
              <input type="date" value={branding.processedDateFrom} onChange={(e) => setProcessedDateFrom(e.target.value)} className={fieldClass} />
            </div>
            <div className="field">
              <label className="mb-[5px] block text-[10px] font-black uppercase tracking-[.06em] text-muted-2">Procesamiento hasta</label>
              <input type="date" value={branding.processedDateTo} onChange={(e) => setProcessedDateTo(e.target.value)} className={fieldClass} />
            </div>
          </div>
        </div>
        {error && <div className="mt-2.5 rounded-[10px] border-l-4 border-red bg-red/[0.08] px-3 py-2.5 text-xs text-red-200">{error}</div>}
      </div>
    </section>
  );
}
