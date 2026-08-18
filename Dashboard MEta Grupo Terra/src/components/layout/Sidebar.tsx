"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-config";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[64px] hidden h-[calc(100vh-64px)] w-[240px] shrink-0 overflow-y-auto border-r border-border bg-surface p-3 scrollbar-thin-accent md:block">
      <div className="mb-2 px-2 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-2">
        Módulos
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-[10px] border border-transparent px-3 py-2.5 text-[13px] font-semibold transition-all ${
                isActive
                  ? "border-accent/30 bg-gradient-to-r from-accent/25 to-accent/5 text-white shadow-[inset_2px_0_0_var(--color-accent)]"
                  : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <Icon
                size={17}
                className={isActive ? "text-accent-2" : "text-muted-2 group-hover:text-muted"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
