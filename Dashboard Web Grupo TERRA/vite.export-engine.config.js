import { defineConfig } from 'vite';

// Build separado (ver "npm run build", que corre este config despues del principal) que
// compila src/export/engine-entry.js a un unico archivo IIFE autocontenido:
// dist/export-engine.js. El HTML exportado por la app carga ese archivo ya compilado en
// vez de reconstruir funciones desde texto con `fn.toString()` (ver export-html.js).
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: 'src/export/engine-entry.js',
      name: 'TerraExportEngine',
      formats: ['iife'],
      fileName: () => 'export-engine.js',
    },
  },
});
