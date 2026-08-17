import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grupo TERRA - Dashboard Tecnico Web V15 - Datos automatizados GA4 y Search Console",
  description:
    "Dashboard de analitica web (GA4 + Search Console) que procesa CSV localmente en el navegador o se conecta en vivo a las APIs de Google.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} dark`}>
      <body className="bg-bg text-text font-sans text-[14px] leading-[1.5] antialiased">
        {children}
      </body>
    </html>
  );
}
