import type { LucideIcon } from "lucide-react";
import { BarChart3, Building2, GalleryHorizontalEnd, LayoutDashboard, Megaphone, Users } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Resumen ejecutivo", icon: LayoutDashboard },
  { href: "/campanas", label: "Campañas", icon: Megaphone },
  { href: "/marcas", label: "Marcas", icon: Building2 },
  { href: "/creativos", label: "Creativos", icon: GalleryHorizontalEnd },
  { href: "/audiencias", label: "Audiencias", icon: Users },
  { href: "/comparativo", label: "Análisis comparativo", icon: BarChart3 },
];
