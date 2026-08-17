"use client";

import { useDashboardStore } from "@/store/use-dashboard-store";
import { moduleHasData } from "@/lib/dashboard/module-availability";
import { NAV_GROUPS } from "./nav-config";

export default function Sidebar() {
  const model = useDashboardStore((s) => s.model);

  return (
    <>
      <aside
        id="sidebar"
        aria-label="Navegacion principal"
        className="side sticky top-[58px] h-[calc(100vh-58px)] overflow-auto border-r border-border bg-surface p-[14px_10px] max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:right-auto max-[900px]:top-0 max-[900px]:z-[120] max-[900px]:h-[100dvh] max-[900px]:w-[min(86vw,320px)] max-[900px]:-translate-x-[105%] max-[900px]:overscroll-contain max-[900px]:border-r max-[900px]:border-border-2 max-[900px]:px-2.5 max-[900px]:pb-[18px] max-[900px]:pt-0 max-[900px]:shadow-[18px_0_50px_rgba(0,0,0,.45)] max-[900px]:transition-transform max-[900px]:duration-[250ms]"
      >
        <div className="mobile-side-head sticky top-0 z-[2] -mx-2.5 mb-2.5 hidden min-h-16 items-center justify-between gap-2.5 border-b border-border bg-surface/[.98] px-3.5 max-[900px]:flex">
          <div className="flex items-center gap-2.5 font-black text-text">
            <span>🌱</span>
            <span>
              Menu del dashboard
              <small className="block text-[9px] font-bold text-muted-2">Navegacion por modulos</small>
            </span>
          </div>
          <button
            id="mobileMenuClose"
            type="button"
            aria-label="Cerrar menu"
            className="grid h-[38px] w-[38px] place-items-center rounded-[10px] border border-border-2 bg-surface-2 text-[19px] text-text transition hover:border-orange hover:bg-orange/10 hover:text-orange-2"
          >
            ✕
          </button>
        </div>
        <nav className="nav">
          {NAV_GROUPS.map((group) => {
            const visibleLinks = group.links.filter((l) => !l.moduleId || moduleHasData(l.moduleId, model));
            if (!visibleLinks.length) return null;
            return (
              <div key={group.label}>
                <div className="px-2.5 pb-1.5 pt-2.5 text-[10px] font-black uppercase tracking-[.09em] text-muted-2">{group.label}</div>
                {visibleLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className="relative my-px flex items-center gap-2 rounded-[10px] border border-transparent px-2.5 py-2.5 text-[13px] font-bold text-muted-2 transition-all hover:bg-tomato/[.09] hover:text-tomato-2 aria-[current=page]:translate-x-0.5 aria-[current=page]:border-tomato/[.34] aria-[current=page]:bg-gradient-to-r aria-[current=page]:from-tomato/[.28] aria-[current=page]:to-tomato/[.12] aria-[current=page]:text-white aria-[current=page]:shadow-[0_8px_24px_rgba(255,99,71,.13),inset_3px_0_0_var(--color-tomato)]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
      <div
        id="mobileMenuOverlay"
        aria-hidden="true"
        className="mobile-overlay fixed inset-0 z-[105] hidden bg-[rgba(3,7,18,.72)] opacity-0 backdrop-blur-[3px] transition-opacity duration-[220ms]"
      />
    </>
  );
}
