"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Plug, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-config";
import ConnectMetaPanel from "@/components/dashboard/ConnectMetaPanel";

export default function TopBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-border-2 bg-surface-2 text-text md:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-accent to-violet text-base">
            📊
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-text">AGROTA Ads Intelligence</div>
            <div className="text-[10px] font-semibold text-muted-2">Panel de campañas de Meta</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-yellow/30 bg-yellow/10 px-3 py-1.5 text-[11px] font-bold text-yellow sm:inline-flex">
            Datos de ejemplo · Meta sin conectar
          </span>
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-accent bg-accent px-3 py-2 text-xs font-bold text-white transition hover:bg-accent-2"
          >
            <Plug size={14} />
            Conectar cuenta de Meta
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[82%] max-w-[300px] border-r border-border-2 bg-surface p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-text">Módulos</span>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMobileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-[10px] border border-border-2 bg-surface-2 text-text"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-semibold ${
                      isActive ? "bg-accent/15 text-accent-2" : "text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <ConnectMetaPanel open={connectOpen} onClose={() => setConnectOpen(false)} />
    </>
  );
}
