"use client";

import { CheckCircle2, X } from "lucide-react";

const STEPS = [
  {
    title: "Crear una app en Meta for Developers",
    detail: "En developers.facebook.com se registra una app gratuita asociada a tu negocio.",
  },
  {
    title: "Solicitar el permiso ads_read",
    detail: "Ese permiso permite leer (sin modificar) las métricas de tus cuentas publicitarias.",
  },
  {
    title: "Generar un token de acceso",
    detail: "Meta entrega una clave que autoriza a este dashboard a consultar tus datos en tu nombre.",
  },
  {
    title: "Elegir las cuentas publicitarias",
    detail: "Con el token conectado, se listan todas las cuentas a las que tengas acceso para elegir cuáles mostrar aquí.",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ConnectMetaPanel({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-[420px] overflow-y-auto border-l border-border-2 bg-surface p-5 shadow-2xl scrollbar-thin-accent">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">Conectar con Meta Ads</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[10px] border border-border-2 bg-surface-2 text-text"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mb-5 text-[13px] leading-relaxed text-muted">
          Este dashboard todavía muestra <span className="text-text font-semibold">datos de ejemplo</span>.
          Para ver tus cuentas publicitarias reales se necesitan credenciales oficiales de Meta. Así funciona el
          proceso, en pasos simples:
        </p>

        <ol className="mb-6 flex flex-col gap-4">
          {STEPS.map((step, idx) => (
            <li key={step.title} className="flex gap-3">
              <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-2">
                {idx + 1}
              </div>
              <div>
                <div className="text-[13px] font-bold text-text">{step.title}</div>
                <div className="text-[12px] leading-relaxed text-muted">{step.detail}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mb-5 flex items-start gap-2 rounded-[12px] border border-border bg-surface-2 p-3 text-[12px] leading-relaxed text-muted">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green" />
          <span>
            No necesitas hacer nada técnico: cuando quieras avanzar, te acompaño paso a paso a crear la app en
            Meta y a conectar tus cuentas reales.
          </span>
        </div>

        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-[10px] border border-border-2 bg-surface-2 px-4 py-3 text-sm font-bold text-muted-2"
        >
          Conectar cuenta — próximamente
        </button>
      </div>
    </div>
  );
}
