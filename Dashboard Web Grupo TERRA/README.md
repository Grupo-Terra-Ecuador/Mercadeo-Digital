# Dashboard Tecnico Web - Grupo TERRA

Dashboard de analitica web (GA4 + Search Console) que procesa CSV localmente en el
navegador o se conecta en vivo a las APIs de Google via OAuth. Aplicacion 100%
estatica/client-side: no requiere backend propio.

## Estructura del proyecto

```
src/
  core/          Logica pura: parseo de CSV, sinonimos ES/EN, motor de agregacion (testeada)
  charts/        Graficos de barras/donut/tendencia/heatmap (SVG y HTML generados a mano)
  sections/      Un modulo por seccion del dashboard (resumen, trafico, usuarios, ...)
  integrations/  OAuth + APIs de GA4 y Search Console
  export/        Exportacion a HTML standalone (engine-entry.js se compila aparte, ver abajo)
  ui/            Tooltip, navegacion, disponibilidad de modulos, seleccion de exportacion
  styles/        CSS (tokens, layout, componentes)
tests/           Tests unitarios (Vitest) del core y de charts/trend-chart.js
legacy/          Version anterior de un solo archivo HTML (referencia, ya no se mantiene)
```

Ver `../../.claude/plans/` (o pedir el documento de arquitectura) para el diagnostico
completo y las decisiones de diseño detras de esta estructura.

## Requisitos

- Node.js 20+ (probado con Node 24)
- Una cuenta de Google Cloud con las APIs "Google Analytics Data API", "Google Analytics
  Admin API" y "Search Console API" habilitadas, si se va a usar la conexion en vivo con
  Google (opcional; sin esto, la app funciona igual solo con CSV).

## Instalacion y desarrollo

```bash
npm install
cp .env.example .env.local   # completar VITE_GOOGLE_CLIENT_ID si se usara conexion con Google
npm run dev
```

`npm run dev` levanta la app en modo desarrollo. La funcion "Exportar HTML" **no** esta
disponible en este modo (ver seccion Build mas abajo): solo el resto del dashboard
(carga de CSV, conexion con Google, todas las visualizaciones) funciona con `npm run dev`.

## Tests y lint

```bash
npm run test       # Vitest, una sola corrida
npm run test:watch # Vitest en modo watch
npm run lint        # ESLint
npm run lint:fix
```

## Build de produccion

```bash
npm run build     # compila la app + el motor de exportacion (dos builds de Vite)
npm run preview   # sirve dist/ localmente para probar el build de produccion
```

El build genera dos artefactos en `dist/`:
- El bundle principal de la app (`index.html` + JS/CSS con hash).
- `export-engine.js`: bundle IIFE independiente que usa la funcion "Exportar HTML" para
  generar informes standalone interactivos (ver `src/export/engine-entry.js` y
  `src/export/export-html.js` para el detalle de por que esto reemplaza el enfoque anterior
  basado en `Function.prototype.toString()`).

La funcion "Exportar HTML" solo funciona sirviendo el build de produccion (`npm run
preview` o el sitio ya desplegado), porque depende de que `/export-engine.js` exista.

## Variables de entorno

Ver `.env.example`. `VITE_GOOGLE_CLIENT_ID` es el Client ID de OAuth 2.0 (tipo "Aplicacion
web") de Google Cloud Console; cada entorno de despliegue puede/debe tener el suyo, con sus
propios "Authorized JavaScript origins" configurados en Cloud Console.

## Seguridad

Ver [`SECURITY.md`](./SECURITY.md).
