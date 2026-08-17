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
});
