// Compila src/lib/export/engine-entry.ts a un unico bundle IIFE autocontenido
// (public/export-engine.js), igual que vite.export-engine.config.js en el proyecto
// original: el HTML exportado descarga y embebe este archivo como texto (ver
// src/lib/export/export-html.ts), nunca reconstruye codigo desde funciones en ejecucion.
//
// Se ejecuta como parte de `npm run build`, despues de `next build`, para que
// /export-engine.js exista en el output estatico servido por Next.js.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

await build({
  entryPoints: [path.join(root, "src/lib/export/engine-entry.ts")],
  outfile: path.join(root, "public/export-engine.js"),
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "TerraExportEngine",
  platform: "browser",
  target: ["es2020"],
  tsconfig: path.join(root, "tsconfig.json"),
  logLevel: "info",
  // El grafo de imports de engine-entry.ts arrastra src/lib/config.ts (via el store ->
  // integrations/google/oauth.ts), que en la app de Next.js lee `process.env.NEXT_PUBLIC_*`
  // — Next.js reemplaza esas referencias por su valor real en tiempo de build. esbuild, al
  // compilar este bundle aparte, NO lo hace: sin este `define`, `process` queda como
  // variable global de Node inexistente en el navegador y el bundle entero revienta con
  // "process is not defined" apenas se ejecuta (nunca llega a exponer
  // window.TerraExportEngine). El HTML exportado nunca usa estos valores (no vuelve a
  // conectarse a Google ni a la IA), asi que basta con reemplazarlos por texto vacio.
  define: {
    "process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID": '""',
    "process.env.NEXT_PUBLIC_AI_WORKER_URL": '""',
    "process.env.NODE_ENV": '"production"',
  },
});
