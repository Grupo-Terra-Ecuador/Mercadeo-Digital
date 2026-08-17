import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Bundle generado por scripts/build-export-engine.mjs (esbuild), no es codigo fuente.
    "public/export-engine.js",
    // Cloudflare Worker: sub-proyecto aparte con su propio codigo (copiado sin cambios del
    // proyecto original), no lo cubre el lint de la app Next.js.
    "worker/**",
  ]),
]);

export default eslintConfig;
