# Estado del proyecto - Dashboard Tecnico Web Grupo TERRA (Next.js)

Documento de continuidad. Objetivo: que cualquier persona (o una nueva sesion de IA sin
memoria de esta conversacion) pueda entender que se hizo, por que, que queda pendiente y
como seguir escalando el proyecto, sin tener que releer todo el historial de chat.

Ultima actualizacion: ver fecha del ultimo commit relacionado a este archivo.

---

## 1. Resumen ejecutivo

Este proyecto es una **migracion completa** del dashboard tecnico de analitica web de Grupo
TERRA, que antes vivia en `Dashboard Web Grupo TERRA.zip` (carpeta hermana de esta) como un
proyecto **Vite + JavaScript vanilla (sin framework, sin TypeScript)**. Ese proyecto anterior
ya era en si mismo una migracion de un unico archivo HTML monolitico (`legacy/dashboard_agrota_v14_11_menu_exportacion.html`,
~1400 lineas); este es el **segundo salto**: de Vite/vanilla a **Next.js 16 (App Router) +
TypeScript + Tailwind CSS v4**.

**Requisito explicito del usuario para esta migracion:** conservar el comportamiento
funcional al 100% y la estetica visual (tema oscuro, acentos naranja/tomate de marca) tal
cual el proyecto anterior, cambiando unicamente el stack por dentro.

**Alcance de la migracion (completado):**
- Los 10 modulos del dashboard (Resumen, Trafico, Usuarios, Audiencias, Paginas,
  Tecnologia, Organico, Demografia, Validacion, Reportes procesados), con sus KPIs,
  graficos (donut, barras, tendencia, mapa de calor), tablas y notas tecnicas.
- Carga y parseo de CSV en el navegador (deteccion de separador, encabezado, sinonimos
  ES/EN, fechas).
- Conexion en vivo con Google (OAuth via Google Identity Services) a GA4 Data API,
  GA4 Admin API y Search Console API.
- Bloque "Toma de decisiones (IA)" por modulo, contra el Cloudflare Worker existente
  (proxy hacia la API de Claude).
- Exportacion a HTML standalone, interactivo, sin servidor.
- Filtro de fechas responsable + rangos independientes por grafica de tendencia.
- Tests unitarios (Vitest) portados y verificados.

---

## 2. Estructura de carpetas

```
Dashboard Web Grupo TERRA/
├── src/
│   ├── app/                      App Router de Next.js: layout.tsx, page.tsx (una sola ruta "/"), globals.css
│   ├── components/
│   │   ├── layout/                TopBar, Sidebar, TooltipHost, nav-config.ts
│   │   ├── dashboard/              DashboardShell, Hero, SettingsPanel, GoogleConnectCard,
│   │   │                           DateFilterCard, ExportSelectionPanel, ModuleAccordion,
│   │   │                           TrendControls, AiInsightBlock
│   │   └── sections/                Un componente React por modulo (ResumenSection.tsx, ...)
│   ├── lib/
│   │   ├── core/                    Logica pura portada 1:1 desde el proyecto Vite: format,
│   │   │                            csv/parse+classify+synonyms, model/aggregate+build-model+date-filter (con tests)
│   │   ├── charts/                  Funciones que generan HTML con clases Tailwind (donut, bar,
│   │   │                            trend, heatmap) — agnosticas de framework, ver seccion 3
│   │   ├── ui/                      nav.ts, tooltip.ts, render-helpers.ts (agnosticas de framework)
│   │   ├── dashboard/
│   │   │   ├── sections/              Un archivo .ts por modulo con la logica de render (paralelo
│   │   │   │                          a components/sections/*.tsx, ver seccion 3)
│   │   │   ├── module-availability.ts Decide si un modulo/submodulo tiene datos reales
│   │   │   ├── export-selection.ts    Seleccion de modulos a exportar + expand/collapse acordeones
│   │   │   └── html-styles.ts         Clases Tailwind compartidas (tablas, tags, acordeones)
│   │   ├── integrations/
│   │   │   ├── google/                oauth.ts, ga4.ts, search-console.ts
│   │   │   └── ai/                     client.ts, summarize.ts, render-markdown.ts
│   │   ├── export/                    export-html.ts (descarga el informe) + engine-entry.ts (ver seccion 3)
│   │   └── config.ts                  Lee NEXT_PUBLIC_GOOGLE_CLIENT_ID / NEXT_PUBLIC_AI_WORKER_URL
│   └── store/
│       ├── dashboard-store.ts         Store "vanilla" de Zustand (sin React), equivalente a state.js + main.js
│       └── use-dashboard-store.ts     Hook de React sobre ese store — separado a proposito, ver seccion 3
├── scripts/build-export-engine.mjs    Build del motor de exportacion con esbuild (ver seccion 3)
├── worker/                             Cloudflare Worker — copiado sin cambios de codigo, ver seccion 5
├── tests/core/                         Vitest: mismos casos que el proyecto original, portados a .ts
├── public/export-engine.js             Generado por scripts/build-export-engine.mjs (no editar a mano)
├── next.config.ts                      output: "export" (build 100% estatico)
├── vitest.config.ts
├── eslint.config.mjs
└── package.json
```

---

## 3. Decisiones de arquitectura clave (y el porque)

| Decision | Por que |
|---|---|
| Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | Elegido explicitamente por el usuario para esta migracion. |
| Tailwind **puro** (sin copiar las hojas de estilo CSS del proyecto anterior) | Decision explicita del usuario, asumiendo el riesgo de pequeña deriva visual a cambio de un stack 100% Tailwind idiomatico. Los tokens de color de marca (`--color-bg`, `--color-orange`, etc.) se definen una vez en `src/app/globals.css` via `@theme`. |
| `output: "export"` en `next.config.ts` | El dashboard sigue siendo 100% estatico/client-side salvo el proxy de IA (Worker aparte): mismo principio de arquitectura que el proyecto Vite original. Genera una carpeta `out/` deployable en cualquier hosting estatico. |
| Funciones de graficos/UI (`lib/charts/*`, `lib/ui/*`, `lib/dashboard/sections/*`) escritas como **funciones TypeScript que operan sobre el DOM por id**, no como hooks/componentes React | Es la pieza mas importante de la arquitectura: estas mismas funciones se usan (a) desde la app en vivo, invocadas dentro de un `useEffect` de cada componente de seccion, y (b) desde el motor de exportacion standalone (`lib/export/engine-entry.ts`), compilado aparte con esbuild. Un componente de seccion React solo dibuja el "cascaron" (tarjetas, contenedores con `id` fijo); el contenido real de cada grafico lo escribe una de estas funciones via `innerHTML`. Esto preserva exactamente el mismo enfoque que ya tenia el proyecto Vite original (evitar `Function.prototype.toString()`), ahora adaptado a React. |
| Store de Zustand **partido en dos archivos** (`store/dashboard-store.ts` sin React + `store/use-dashboard-store.ts` con el hook) | Trampa real que se encontro durante el build: si el hook de React (`useStore` de `zustand/react`) vive en el mismo archivo que el store, **React entero se cuela en el bundle del motor de exportacion** aunque `engine-entry.ts` nunca lo use (el bundler no puede eliminar codigo muerto a nivel de una sola sentencia top-level). La regla practica: **todo lo que este bajo `lib/*` debe importar `dashboardStoreApi` de `dashboard-store.ts`** (nunca `useDashboardStore`); **todo lo que este bajo `components/*` debe importar `useDashboardStore` de `use-dashboard-store.ts`**. Si en el futuro un archivo de `lib/` importa `useDashboardStore` por error, hay que volver a revisar el tamaño de `public/export-engine.js` (deberia rondar ~55kB; si sube a ~63kB, React se volvio a colar). |
| Orden del script `build` (`node scripts/build-export-engine.mjs && next build`, **no al reves**) | Con `output: "export"`, `next build` copia el contenido de `public/` a `out/` en el momento en que corre. Si el motor de exportacion se compila *despues* de `next build`, `out/export-engine.js` queda desactualizado o ausente en un build limpio. Se verifico expresamente con un build desde cero. |
| Cloudflare Worker sin tocar | Decision explicita del usuario: minimizar riesgo sobre un servicio ya desplegado en produccion. Solo se actualizo `worker/wrangler.toml` (`ALLOWED_ORIGINS`) agregando `localhost:3000`; **falta ejecutar `wrangler deploy`** para que ese cambio tome efecto (ver seccion 7). |
| Variables de entorno renombradas de `VITE_*` a `NEXT_PUBLIC_*` | Convencion de Next.js para variables expuestas al navegador. Mismos valores que el proyecto original, copiados directamente a `.env.local` (nunca mostrados en el chat). |
| `define` de `process.env.*` en `scripts/build-export-engine.mjs` | Mismo tipo de trampa que la fila del store: `dashboardStoreApi` incluye las acciones de Google/IA (aunque el motor de exportacion nunca las llame), y esas acciones importan `src/lib/config.ts`, que lee `process.env.NEXT_PUBLIC_*`. Next.js reemplaza esas referencias al compilar la app; esbuild no, y sin este `define` el bundle exportado revienta con `process is not defined` apenas se ejecuta (ver seccion 4, punto 6). Si en el futuro se agrega una variable `process.env.*` nueva a algun archivo bajo `lib/*`, hay que agregarla tambien aqui o el motor de exportacion se puede volver a romper. |

---

## 4. Bugs encontrados y corregidos durante la migracion

Ademas del propio trabajo de traduccion linea por linea (JS → TS, HTML a mano → JSX), se
encontraron y corrigieron estos problemas reales:

1. **React se colaba en el bundle del motor de exportacion** (63.5kB en vez de ~55kB, con
   `react.production.js` embebido). Causa: `useDashboardStore` (hook) y `dashboardStoreApi`
   (vanilla) vivian en el mismo archivo. Corregido separandolos en dos archivos (ver
   seccion 3). Verificado con `grep` sobre el bundle generado tras la correccion (0
   coincidencias de `react.production`).
2. **`public/export-engine.js` no quedaba incluido en un build limpio de `out/`** por el
   orden de los pasos del script `build`. Corregido invirtiendo el orden (ver seccion 3).
   Verificado borrando `out/` y `public/export-engine.js` y corriendo `npm run build` desde
   cero.
3. **Resumen de IA de Demografia enviaba `null` en vez de las cifras reales** para
   `topPaises`/`topProvincias`/`topCiudades` (`src/lib/integrations/ai/summarize.ts`). Causa
   raiz: esas listas vienen del modelo como `GroupedRow` (campo `users`), pero la funcion
   que arma el resumen para la IA leia `.value` (campo que solo existe en `AggregateItem`,
   usado por generos/dispositivos/etc.) — bug latente tambien presente en el codigo
   JavaScript original (ahi pasaba desapercibido porque JS no avisa de esto en tiempo de
   build; TypeScript si lo marco como error al portar el codigo). Corregido con
   `topGeoRows()`, una variante que lee `.users`.
4. **Tres avisos al usuario (`alert(...)`) que faltaban** en `src/store/dashboard-store.ts`,
   encontrados en una auditoria linea-por-linea especifica de la integracion con Google
   pedida por el usuario:
   - "Aplicar filtro" sin CSV procesados → ahora alerta "Primero carga y procesa los CSV."
   - "Usar rango detectado" sin datos → ahora alerta "No se detecto un rango en los CSV
     procesados."
   - "Traer datos de Google" sin seleccionar propiedad/sitio → ahora alerta "Selecciona al
     menos una propiedad de GA4 o un sitio de Search Console."
   Antes de la correccion, esos tres botones simplemente no hacian nada (sin explicacion)
   en vez de avisar, a diferencia del proyecto original. Verificado en navegador con
   Playwright (captura de los dialogos `alert()`).
5. **Error 429 "Exhausted concurrent requests quota" al conectar con una cuenta real de
   Google** (`src/lib/integrations/google/ga4.ts`, encontrado por el usuario probando con su
   propia cuenta — la unica prueba que no se pudo hacer durante la migracion, ver seccion
   5.1). Causa raiz: `fetchAllGA4Datasets` pedia los 17 reportes de GA4 con un solo
   `Promise.all` disparando las 17 peticiones al mismo tiempo; la GA4 Data API limita a
   ~10 peticiones concurrentes por propiedad. **Este comportamiento ya existia igual en el
   proyecto original** (mismo patron de `Promise.all` con las 17 llamadas), asi que no era
   una regresion de la migracion, sino un problema real que solo se manifiesta con una
   cuenta/cuota de Google real. Corregido agregando `runWithConcurrencyLimit()`: las mismas
   17 peticiones (mismos parametros, mismo orden de resultado) ahora se ejecutan en tandas
   de maximo 5 a la vez en vez de las 17 de un solo golpe.
6. **El motor de exportacion standalone se caia por completo al arrancar**
   (`ReferenceError: process is not defined`, seguido de
   `TypeError: Cannot read properties of undefined (reading 'init')`), encontrado por el
   usuario al abrir un HTML exportado real. Causa raiz: el grafo de imports de
   `engine-entry.ts` arrastra `src/lib/config.ts` (via el store → `integrations/google/oauth.ts`),
   que lee `process.env.NEXT_PUBLIC_*`. Next.js reemplaza esas referencias por su valor real
   al compilar la app principal; **esbuild, al compilar `export-engine.js` por separado, no
   lo hacia**, dejando la referencia literal a `process` (global de Node inexistente en el
   navegador) en el bundle — el script entero reventaba antes de exponer
   `window.TerraExportEngine`, dejando sin funcionar TODO dentro del archivo exportado:
   filtros de fecha, expandir/contraer modulos, filtros de pais en Demografia, tooltips,
   menu movil. Corregido con `define` en `scripts/build-export-engine.mjs`, indicandole a
   esbuild que reemplace esas dos variables (y `NODE_ENV`) por texto vacio/literal en tiempo
   de build — el HTML exportado nunca las necesita de verdad (nunca vuelve a conectarse a
   Google ni a la IA). Verificado con Playwright: `window.TerraExportEngine` queda definido,
   y se probaron en vivo dentro del archivo exportado standalone: expandir/contraer modulos,
   tooltip al pasar el cursor, cero errores de consola.
7. **El menu lateral del HTML exportado se veia sin ningun estilo** (todos los nombres de
   modulo pegados en una sola linea, sin separacion ni color). Causa raiz: a diferencia del
   CSS del proyecto original (que estilizaba `.nav a` por selector de etiqueta, aplicandose
   automaticamente a cualquier `<a>` dentro de `.nav`), el nuevo enfoque de Tailwind puro
   exige la clase en cada elemento; `buildNavLinks()` en `src/lib/export/export-html.ts`
   generaba los `<a>` del menu exportado sin ninguna clase. Corregido agregando la misma
   cadena de clases que usa `src/components/layout/Sidebar.tsx` en la app en vivo.
   Verificado visualmente (ver captura en la conversacion) y por codigo (`class` del primer
   link del menu exportado coincide con el de Sidebar.tsx).
8. **"Generar diagnostico" (IA) fallaba con un mensaje enganoso** ("No se pudo contactar el
   servicio de IA. Revisa tu conexion a internet."), reportado por el usuario. Diagnostico
   confirmado con una peticion directa (`curl`, evitando el navegador) contra el Worker
   desplegado: el origen `http://localhost:3000` respondia **403** en el preflight CORS
   porque `ALLOWED_ORIGINS` en Cloudflare todavia tenia solo los puertos viejos de Vite
   (5173/4173) — el cambio local a `worker/wrangler.toml` (ver seccion 3) nunca se habia
   desplegado. El navegador no distingue "bloqueado por CORS" de "sin internet" a nivel de
   JS, por eso el mensaje generico era enganoso. Corregido en dos partes:
   - `src/lib/integrations/ai/client.ts`: el mensaje de error ahora lista las causas
     probables (origen no autorizado, URL mal configurada, Worker no desplegado, o sin
     conexion) en vez de asumir "sin internet".
   - **Se desplego** el Worker (`npx wrangler deploy`, con autorizacion explicita del
     usuario) para publicar el `ALLOWED_ORIGINS` actualizado. Verificado con `curl`:
     `http://localhost:3000` ahora recibe `204` con las cabeceras CORS correctas.

Todo lo demas (formulas de agregacion, sinonimos ES/EN, deteccion de encabezado CSV,
formato de numeros/fechas es-EC, que reportes se piden a la API de GA4/Search Console y como
se interpreta la respuesta) se comparo explicitamente contra el codigo original y **no
presenta diferencias**.

---

## 5. Integraciones externas

### 5.1 Google (GA4 + Search Console) — en vivo, client-side

Sin cambios de logica frente al proyecto original salvo dos correcciones reales (ver
seccion 4, puntos 4 y 5). Requiere `NEXT_PUBLIC_GOOGLE_CLIENT_ID` configurado en
`.env.local` (ya copiado desde el proyecto anterior) y las APIs habilitadas en Google Cloud
Console ("Google Analytics Data API", "Google Analytics Admin API", "Search Console API").

**Estado de la verificacion con cuenta real:** el propio usuario probo "Conectar con
Google" con su cuenta real (algo que no se pudo hacer durante la migracion, por no tener
credenciales ni sesion interactiva en este entorno) y encontro el error 429 de cuota
concurrente descrito en la seccion 4, punto 5 — ya corregido. **Queda pendiente confirmar
que, tras la correccion, la conexion completa (incluyendo "Traer datos de Google" con una
propiedad GA4 real) funciona de principio a fin.**

### 5.2 IA ("Toma de decisiones") — Cloudflare Worker

El Worker (`worker/`) es el mismo que ya estaba desplegado (`terra-dashboard-ai`, cuenta
`Wgallegos@maqmotores.com`), **copiado sin cambios de codigo**. El frontend nuevo le apunta
via `NEXT_PUBLIC_AI_WORKER_URL`.

**`ALLOWED_ORIGINS` ya desplegado con `http://localhost:3000` incluido** (ver seccion 4,
punto 8) — verificado con `curl` contra el Worker real: preflight CORS responde `204` con
las cabeceras correctas para ese origen. Version desplegada:
`f07bfb0c-ef87-4f93-8ffa-c713ae769697`.

**Bloqueador que ya existia en el proyecto original, sin cambios:** la cuenta de Anthropic
en `console.anthropic.com` necesita creditos/facturacion configurados para que "Generar
diagnostico" devuelva una respuesta real (si no, el Worker responde 402 con un mensaje
especifico al respecto, distinto del error de conexion).

---

## 6. Variables de entorno y secretos

| Variable/secreto | Donde vive | Notas |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `.env.local` (gitignored) | Mismo valor que el proyecto original (`VITE_GOOGLE_CLIENT_ID` renombrado), copiado directamente, nunca mostrado en el chat. |
| `NEXT_PUBLIC_AI_WORKER_URL` | `.env.local` (gitignored) | Idem, renombrado desde `VITE_AI_WORKER_URL`. |
| `ANTHROPIC_API_KEY` | Secreto de Cloudflare (Worker `terra-dashboard-ai`) | Sin cambios; el Worker no se toco. |
| `ALLOWED_ORIGINS`, `ANTHROPIC_MODEL` | `worker/wrangler.toml` (`[vars]`) | `ALLOWED_ORIGINS` incluye el puerto de Next.js (3000) y ya esta desplegado en Cloudflare. |

`.env.example` (sin valores reales) esta versionado; `.env.local` no.

---

## 7. Pendientes / proximos pasos

- [x] ~~Desplegar el cambio de `ALLOWED_ORIGINS` en el Worker~~ — hecho, ver seccion 4 punto 8.
- [ ] **Probar la conexion real con Google** (OAuth + traer datos de una propiedad GA4 real) — el usuario ya conecto su cuenta real y encontro/corrigio el bug de cuota concurrente (seccion 4, punto 5); falta confirmar una corrida completa sin errores.
- [ ] Agregar creditos/facturacion en `console.anthropic.com` para que "Generar diagnostico" funcione con una respuesta real (mismo bloqueador que el proyecto original).
- [ ] Decidir hosting de produccion para la carpeta `out/` (cualquier hosting estatico: Cloudflare Pages, Netlify, GitHub Pages, Vercel, etc.) y agregar ese dominio a `ALLOWED_ORIGINS` del Worker antes de publicar.
- [ ] Revisar/portar `SECURITY.md` del proyecto original (politica de seguridad, CSP recomendada) — no se copio en esta migracion.
- [ ] Rotar `NEXT_PUBLIC_GOOGLE_CLIENT_ID` y `ANTHROPIC_API_KEY` si aun no se hizo (recomendacion heredada del proyecto original: ambos se pegaron alguna vez en una conversacion de chat antes de guardarse como variable de entorno/secreto).
- [ ] Escalabilidad de mediano plazo (heredado del diagnostico original, aun vigente): mover el parseo de CSV a un Web Worker para archivos grandes; cache local (IndexedDB); tipado mas estricto donde hoy se uso `unknown`/casts puntuales.

---

## 8. Como correr todo localmente

```bash
cd "Dashboard Web Grupo TERRA"
npm install
# .env.local ya existe (copiado del proyecto original); si hace falta recrearlo:
cp .env.example .env.local   # completar NEXT_PUBLIC_GOOGLE_CLIENT_ID y NEXT_PUBLIC_AI_WORKER_URL

npm run dev                  # http://localhost:3000
npm run test                 # Vitest, una sola corrida (37 tests)
npm run lint                 # ESLint
npm run build                # build export-engine.js (esbuild) + next build (output: export) -> carpeta out/
npm run start                # sirve el build de produccion (next start)
```

**Worker** (solo si se necesita modificarlo/probarlo o desplegar el cambio de `ALLOWED_ORIGINS`):
```bash
cd "Dashboard Web Grupo TERRA/worker"
npm install
npx wrangler dev             # http://127.0.0.1:8787
npx wrangler deploy          # publica cambios (ALLOWED_ORIGINS, etc.)
```

---

## 9. Verificacion realizada durante la migracion

- **Tipos:** `npx tsc --noEmit` sin errores.
- **Lint:** `npx eslint .` sin errores ni warnings (sobre el codigo fuente propio; `public/export-engine.js` y `worker/` estan excluidos por ser artefacto generado / sub-proyecto aparte).
- **Tests:** `npx vitest run` — 37/37 pasando (mismos casos que el proyecto original, portados).
- **Build de produccion:** `npm run build` desde cero, sin errores, incluyendo el bundle del motor de exportacion.
- **Pruebas manuales en navegador (Playwright):**
  - Carga y procesamiento de CSV con datos calculados a mano de antemano, comparando cifra por cifra contra lo que muestra cada uno de los 10 modulos (KPIs, tablas, graficos, promedios ponderados) — sin discrepancias.
  - Exportacion a HTML: se descargo un informe real y se abrio directamente desde el disco (protocolo `file://`, sin servidor) confirmando que el grafico de tendencia y la interactividad siguen funcionando de forma standalone.
  - Menu movil, navegacion activa por scroll, acordeones — sin errores de consola en ningun caso.

---

## 10. Referencias

- `README.md` del proyecto original (dentro de `Dashboard Web Grupo TERRA.zip`) — contexto historico de la primera migracion (HTML unico → Vite).
- Este mismo repositorio, carpeta `worker/` — codigo del Worker de Cloudflare (sin cambios).
