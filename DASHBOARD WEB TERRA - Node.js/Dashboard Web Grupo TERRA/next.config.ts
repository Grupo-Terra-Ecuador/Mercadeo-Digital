import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El dashboard es 100% estatico/client-side salvo el proxy de IA (Cloudflare Worker
  // aparte, ver worker/): igual que el proyecto original, no hay rutas de servidor ni
  // datos que dependan de Node en tiempo de ejecucion, asi que se exporta a HTML/JS/CSS
  // estatico (carpeta out/) deployable en cualquier hosting estatico.
  output: "export",
};

export default nextConfig;
