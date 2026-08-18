import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardShell from "@/components/dashboard/DashboardShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AGROTA Ads Intelligence — Panel de campañas de Meta",
  description: "Dashboard para analizar campañas de Meta Ads de cualquier cuenta publicitaria conectada.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} dark`}>
      <body className="font-sans text-[14px] leading-[1.5] antialiased">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
