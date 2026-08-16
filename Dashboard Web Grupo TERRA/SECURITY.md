# Politica de seguridad

Este proyecto es una aplicacion 100% estatica (sin backend propio) que procesa CSV de
Google Analytics 4 / Search Console en el navegador, y opcionalmente se conecta en vivo a
las APIs de Google via OAuth 2.0 (flujo para SPA, Google Identity Services).

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad, repórtalo directamente al equipo de Mercadeo
Digital de Grupo TERRA (no abras un issue publico con el detalle). Incluye pasos para
reproducir y el impacto esperado.

## Superficie de la aplicacion

- **Sin backend, sin base de datos, sin secretos de servidor.** Todo el procesamiento de
  CSV ocurre en el navegador del usuario; los datos no se envian a ningun servidor propio.
- **OAuth**: se usan unicamente scopes de solo lectura
  (`analytics.readonly`, `webmasters.readonly`). El Client ID de OAuth se lee de la
  variable de entorno `VITE_GOOGLE_CLIENT_ID` en tiempo de build (ver `.env.example`) y
  **no** esta hardcodeado en el codigo fuente. Para clientes publicos/SPA el Client ID no
  se considera secreto por diseño de OAuth, pero mantenerlo fuera del codigo permite usar
  distintos Client ID por entorno (dev/staging/produccion), cada uno con sus propios
  "Authorized JavaScript origins" configurados en Google Cloud Console.
- **XSS**: los valores provenientes de archivos CSV (que pueden contener texto arbitrario
  del usuario, p. ej. una consulta de busqueda) siempre pasan por `esc()`
  (`src/core/format.js`) antes de insertarse en el DOM via `innerHTML`. La exportacion a
  HTML standalone tambien escapa cualquier dato embebido como JSON dentro de un
  `<script>` (reemplazando el caracter "menor que" por su equivalente Unicode escapado)
  para evitar que un valor que contenga el cierre de esa etiqueta inyecte HTML/JS.
- **Exportacion a HTML**: el motor interactivo del HTML exportado (`src/export/engine-entry.js`)
  se compila con Vite a un bundle IIFE independiente (`export-engine.js`) durante el build
  de produccion. A diferencia de una version anterior de este proyecto (ver `legacy/`), el
  HTML exportado ya no reconstruye funciones a partir de `Function.prototype.toString()` de
  codigo en ejecucion, un patron fragil bajo minificacion y dificil de auditar.

## Recomendacion de Content-Security-Policy

El build de produccion externaliza todo el CSS/JS (sin `<style>`/`<script>` inline en la
app en vivo), lo que permite aplicar una CSP estricta en el hosting elegido. Linea base
sugerida (ajustar dominio segun donde se despliegue):

```
default-src 'self';
script-src 'self' https://accounts.google.com;
connect-src 'self' https://accounts.google.com https://analyticsdata.googleapis.com https://analyticsadmin.googleapis.com https://www.googleapis.com;
style-src 'self';
img-src 'self' data:;
```

Aplicar esto via los headers del hosting (o un archivo `_headers`/equivalente segun la
plataforma). El HTML exportado por la app (descargado por el usuario) es un documento
standalone servido fuera de este origen, por lo que la CSP del sitio principal no lo cubre;
si se aloja tambien en un servidor propio, aplicar una CSP equivalente alli.

## Dependencias

- Cero dependencias en tiempo de ejecucion (`dependencies` vacio en `package.json`); solo
  `devDependencies` (Vite, Vitest, ESLint) usadas para build/test/lint.
- Dependabot (`.github/dependabot.yml`, a nivel del repositorio) mantiene actualizadas las
  `devDependencies` y las GitHub Actions.
- `npm audit` corre en CI (no bloquea el build todavia; ver nota abajo) para visibilizar
  vulnerabilidades conocidas en la cadena de dependencias de build.

**Nota conocida:** al momento de escribir esto, `npm audit` reporta vulnerabilidades
(incluida una critica) en versiones de `esbuild` usadas transitivamente por Vite/Vitest.
Afectan unicamente al **servidor de desarrollo local** (`npm run dev`), no al build de
produccion ni al codigo que corre en el navegador del usuario final. Se documenta aqui en
vez de forzar un salto de version mayor (Vitest 4) sin validar antes su compatibilidad.
