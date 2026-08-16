# Estado del proyecto - Dashboard Tecnico Web Grupo TERRA

Documento de continuidad. Objetivo: que cualquier persona (o una nueva sesion de IA sin
memoria de esta conversacion) pueda entender que se hizo, por que, que queda pendiente y
como seguir escalando el proyecto, sin tener que releer todo el historial de chat.

Ultima actualizacion: ver fecha del ultimo commit relacionado a este archivo.

---

## 1. Resumen ejecutivo

El proyecto partio de **un unico archivo HTML** (`legacy/dashboard_agrota_v14_11_menu_exportacion.html`,
~1400 lineas, CSS+JS inline) que procesaba CSV de GA4/Search Console y opcionalmente se
conectaba en vivo a las APIs de Google. Se migro a un **proyecto Vite modular** con
JavaScript vanilla + modulos ES, sin frameworks ni TypeScript, manteniendo el mismo
comportamiento pero organizado, testeado y con CI.

Sobre esa base ya migrada, se agrego una **funcion nueva**: diagnostico de "Toma de
decisiones" generado por IA (Claude, via un backend minimo en Cloudflare Workers) en cada
modulo del dashboard, bajo demanda (boton, no automatico).

**Principio de arquitectura que se mantuvo hasta ahora:** la app es 100% estatica /
client-side. **Esto cambio deliberadamente una sola vez**, y solo para la funcion de IA: se
agrego el primer backend del proyecto (un Cloudflare Worker minimo) porque llamar a la API
de Anthropic directamente desde el navegador habria expuesto la API key a cualquiera que
inspeccionara el codigo fuente. El resto del dashboard (CSV, conexion con Google, export a
HTML) sigue siendo 100% estatico, sin backend.

---

## 2. Estructura de carpetas

```
Dashboard Web Grupo TERRA/
├── src/
│   ├── core/            Logica pura: parseo CSV, sinonimos ES/EN, motor de agregacion (testeada)
│   ├── charts/           Graficos de barras/donut/tendencia/heatmap (SVG y HTML a mano)
│   ├── sections/         Un modulo por seccion del dashboard (resumen, trafico, usuarios, ...)
│   ├── integrations/
│   │   ├── google/       OAuth + APIs de GA4 y Search Console (conexion en vivo, opcional)
│   │   └── ai/            Cliente del endpoint de IA (client.js) + resumen agregado por modulo (summarize.js)
│   ├── export/            Exportacion a HTML standalone (export-html.js + engine-entry.js)
│   ├── ui/                Tooltip, navegacion, disponibilidad de modulos, seleccion de exportacion, bloque de IA (ai-insight.js)
│   ├── styles/            CSS (tokens, layout, componentes)
│   ├── config.js          Variables de entorno del frontend (Client ID de Google, URL del Worker de IA)
│   ├── state.js           Estado global mutable + EXPORT_MODULES
│   └── main.js            Orquestacion: wiring de DOM, ACTIONS registry, renderAll()
├── worker/                 Backend minimo (Cloudflare Worker) — PROXY hacia la API de Claude. Ver seccion 5.
│   ├── src/index.js        Unico endpoint: POST /api/ai-insight
│   ├── wrangler.toml       Config del Worker (nombre, ordenes CORS permitidos, modelo)
│   └── package.json
├── tests/                  Tests unitarios (Vitest) del core y de charts/trend-chart.js
├── legacy/                 Version original de un solo archivo HTML (referencia, ya no se mantiene)
├── .github/ (a nivel de repo Mercadeo-Digital/) CI + Dependabot
├── README.md / SECURITY.md / ESTADO_PROYECTO.md (este archivo)
```

---

## 3. Decisiones de arquitectura clave (y el porque)

| Decision | Por que |
|---|---|
| Vanilla JS + modulos ES + Vite, sin framework, sin TypeScript | Elegido explicitamente por el usuario al iniciar la migracion, para mantener el stack simple. |
| 100% estatico salvo el proxy de IA | Minimiza superficie de ataque; sin backend no hay servidor propio que mantener/asegurar. El proxy de IA es la unica excepcion, y esta acotado a un solo endpoint sin estado. |
| Exportacion a HTML sin `Function.prototype.toString()` | El archivo legado reconstruia ~35 funciones vivas via `.toString()` para el HTML exportado: fragil bajo minificacion, no testeable. Ahora se compila un bundle IIFE aparte (`export-engine.js`, desde `src/export/engine-entry.js`) que se descarga y se embebe como texto, nunca se reconstruye codigo a partir de funciones en ejecucion. |
| HTML exportado "congela" el filtro de fechas y nunca conecta a Google | Requisito de seguridad explicito del usuario: el HTML exportado se comparte fuera de la organizacion, por lo que debe quedar integro segun la seleccion de modulos/fechas al momento de exportar, y **nunca** debe poder volver a conectarse a ninguna cuenta de Google. Ver seccion 4 (bug corregido). |
| Cliente Google ID via variable de entorno (`VITE_GOOGLE_CLIENT_ID`), no hardcodeado | Permite Client ID distinto por entorno; evita que quede expuesto en el codigo fuente del repo. |
| Modelo de IA: `claude-sonnet-5` con `effort: "low"`, sin streaming | Las recomendaciones son cortas (unas pocas oraciones), generadas bajo demanda por clic, volumen bajo. Sonnet a effort bajo da buena calidad a fraccion del costo/latencia de Opus; sin streaming porque una respuesta corta no lo necesita (un solo round-trip JSON es mas simple de manejar). |

---

## 4. Bugs reales encontrados y corregidos durante la migracion

1. **`headerScore` (deteccion de encabezado de CSV) confundia una fila de datos con "iOS"
   como si fuera el encabezado real.** "iOS" es subcadena de "usuarios", y sin un largo
   minimo para el match difuso, una fila con valor "iOS" (columna Sistema operativo) sumaba
   puntos de sinonimos de "usuarios" y le ganaba al encabezado real. Corregido en
   `src/core/csv/parse.js` con `MIN_FUZZY_MATCH_LENGTH = 4`. Bug preexistente en el archivo
   original, no introducido durante la migracion. Test de regresion en
   `tests/core/csv-parse.test.js`.
2. **El HTML exportado no respetaba el filtro de fechas global.** Causa raiz doble: (a)
   `state.filteredDatasets` nunca se poblaba porque `buildModel()` se volvio una funcion
   pura (no muta estado global) pero se olvido reasignar el resultado en los call sites; (b)
   `export-html.js` usaba `state.datasets` crudo en vez del ya filtrado. Corregido con
   `refreshModel()` centralizado en `main.js` y `state.filteredDatasets` en
   `export-html.js`. Verificado con Playwright: el HTML exportado, abierto en frio,
   mostraba correctamente el total ya filtrado (no el total sin filtrar).

---

## 5. Funcion de IA: "Toma de decisiones" (Fase A + B, completadas)

### 5.1 Arquitectura

```
Navegador (dashboard)  --POST /api/ai-insight-->  Cloudflare Worker  --POST /v1/messages-->  API de Anthropic (Claude)
  (solo datos agregados                              (unico lugar con
   del modulo, JSON)                                  la API key, como
                                                        secreto cifrado)
```

- El **Worker es el unico componente** que conoce la API key de Anthropic (guardada como
  secreto de Cloudflare via `wrangler secret put`, nunca en el repo ni en ningun archivo).
- El **frontend nunca ve ni envia la API key**. Solo envia `{ moduleLabel, summary }` donde
  `summary` es un objeto JSON **ya agregado** (totales, top-N canales/paginas/paises...),
  nunca CSV crudo ni filas individuales ni PII. Ver `src/integrations/ai/summarize.js` para
  ver exactamente que se envia por modulo.
- La llamada es **manual, bajo demanda**: boton "Generar diagnostico" por modulo, nunca
  automatica, para controlar el costo por uso.

### 5.2 Archivos relevantes

| Archivo | Rol |
|---|---|
| `worker/src/index.js` | Unico endpoint del Worker: `POST /api/ai-insight`. Valida CORS por origen (`ALLOWED_ORIGINS`), valida tamaño del body (max 20 KB), arma el prompt, llama a la API de Anthropic, traduce errores a mensajes en español (incluye deteccion especifica de "sin credito/facturacion" -> HTTP 402). |
| `worker/wrangler.toml` | Config del Worker: nombre (`terra-dashboard-ai`), `ALLOWED_ORIGINS` (lista blanca de origenes CORS), `ANTHROPIC_MODEL`. La API key **no** esta aqui. |
| `src/integrations/ai/client.js` | `requestModuleInsight(moduleLabel, summary)` — hace el `fetch` desde el navegador hacia el Worker. |
| `src/integrations/ai/summarize.js` | `buildModuleSummary(moduleId, model)` — construye el resumen agregado por modulo a partir de `state.model` (nunca datos crudos). |
| `src/ui/ai-insight.js` | Renderiza el bloque "Toma de decisiones (IA)" (boton + resultado) en cada uno de los 8 modulos principales, y maneja el clic (loading -> exito/error). |
| `src/config.js` | Lee `VITE_AI_WORKER_URL` (URL publica del Worker desplegado). |

### 5.3 Estado del despliegue (a la fecha de este documento)

- **Worker desplegado en:** `https://terra-dashboard-ai.dashboardterra.workers.dev`
- **Secreto `ANTHROPIC_API_KEY`:** configurado en Cloudflare (cuenta `Wgallegos@maqmotores.com`).
- **Modelo configurado:** `claude-sonnet-5`.
- **Origenes CORS permitidos:** `http://localhost:5173`, `http://127.0.0.1:5173` (dev),
  `http://localhost:4173`, `http://127.0.0.1:4173` (preview). **Falta agregar el dominio de
  produccion** cuando el dashboard se publique (ver seccion 7, pendientes).
- **`VITE_AI_WORKER_URL`** ya esta seteado en `.env.local` (no se sube a git) apuntando al
  Worker de arriba.
- **Bloqueador actual (unico):** la cuenta de Anthropic en `console.anthropic.com` no tiene
  creditos/facturacion configurada todavia. El Worker y el frontend estan verificados de
  punta a punta (CORS, validacion, manejo de errores, UI) — el unico paso que falta es que
  el usuario agregue saldo en **console.anthropic.com -> Billing**. Cuando eso se resuelva,
  el flujo deberia funcionar sin ningun cambio de codigo adicional.

### 5.4 Como desplegar cambios al Worker

```bash
cd "Dashboard Web Grupo TERRA/worker"
npx wrangler deploy
```

Requiere estar autenticado (`npx wrangler login`, una vez por maquina/cuenta). Para
rotar o cambiar la API key: `npx wrangler secret put ANTHROPIC_API_KEY` (pide el valor de
forma interactiva en la terminal; **nunca** pegarla en un chat o archivo).

### 5.5 Fases C y D (NO implementadas todavia)

Definidas y acordadas con el usuario, pendientes de desarrollo:

- **Fase C:** agregar `/api/competitors` al mismo Worker, usando un servicio de terceros
  para descubrir competidores potenciales (recomendado: **SEMrush**, por su reporte
  "Organic Competitors" y API pay-as-you-go). Requiere que el usuario cree una cuenta de
  SEMrush y obtenga su API key (mismo patron de seguridad que Anthropic: como secreto de
  Cloudflare, nunca en el repo ni en el chat).
- **Fase D:** modulo nuevo "Competidores" en el frontend, **acotado a Ecuador**, consumiendo
  el endpoint de la Fase C.

---

## 6. Variables de entorno y secretos (donde vive cada cosa)

| Variable/secreto | Donde vive | Como se configura |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | `.env.local` (frontend, gitignored) | Client ID de OAuth de Google Cloud Console (tipo "Aplicacion web"). Reutilizado del archivo legado; **pendiente evaluar rotarlo** (ver seccion 7). |
| `VITE_AI_WORKER_URL` | `.env.local` (frontend, gitignored) | URL publica del Worker desplegado (no es secreta, pero se mantiene en `.env.local` por conveniencia de configuracion). |
| `ANTHROPIC_API_KEY` | Secreto de Cloudflare (Worker `terra-dashboard-ai`) | `npx wrangler secret put ANTHROPIC_API_KEY` desde `worker/`. **Nunca** en el repo, en `wrangler.toml`, ni pegada en un chat. |
| `ALLOWED_ORIGINS`, `ANTHROPIC_MODEL` | `worker/wrangler.toml` (`[vars]`, va al repo) | No son secretos: son configuracion publica del Worker. |

`.env.example` (frontend) documenta las variables sin valores reales — copiar a `.env.local`
y completar.

---

## 7. Pendientes / proximos pasos

**Bloqueante inmediato:**
- [ ] Agregar creditos/facturacion en `console.anthropic.com -> Billing` para que
      "Generar diagnostico" funcione con una respuesta real (todo lo demas ya esta
      verificado end-to-end).

**Seguridad (no urgente, pero recomendado):**
- [ ] Rotar el `VITE_GOOGLE_CLIENT_ID` actual — circulo dentro de una conversacion de chat
      antes de migrarlo a variable de entorno. Revisar tambien que los "Authorized
      JavaScript origins" en Google Cloud Console sean estrictos (dominios exactos, no
      wildcard).
- [ ] La API key de Anthropic usada actualmente tambien fue pegada una vez en un chat antes
      de guardarse como secreto de Cloudflare. Se recomienda revocarla en
      `console.anthropic.com -> API Keys` y generar una nueva de uso exclusivo, por buena
      practica (no hay evidencia de exposicion real, pero es el procedimiento correcto).

**Antes de publicar el dashboard en un dominio real:**
- [ ] Agregar el dominio de produccion a `ALLOWED_ORIGINS` en `worker/wrangler.toml` y
      redesplegar (`npx wrangler deploy`).
- [ ] Definir el hosting del frontend (todavia no decidido — ver diagnostico original: debe
      ser agnostico de plataforma, cualquier host estatico sirve: GitHub Pages, Netlify,
      Vercel, etc.).
- [ ] Aplicar la CSP recomendada en `SECURITY.md`, agregando el dominio del Worker
      (`https://terra-dashboard-ai.dashboardterra.workers.dev` o el que corresponda) a
      `connect-src`.

**Funcionalidad (Fases C y D, ver seccion 5.5):**
- [ ] Cuenta de SEMrush + endpoint `/api/competitors` en el Worker.
- [ ] Modulo "Competidores" en el frontend (Ecuador).

**Escalabilidad de mediano plazo (del diagnostico original, aun vigentes):**
- [ ] Mover el parseo de CSV a un Web Worker para archivos grandes (>15 MB hoy puede
      congelar la pestaña).
- [ ] Cache local (IndexedDB) de datasets procesados.
- [ ] Evaluar reemplazar los graficos hechos a mano (SVG manual, `conic-gradient`) por una
      libreria liviana si crece la necesidad de interactividad.
- [ ] Tipado gradual (TypeScript) empezando por `core/model/*`.
- [ ] Resolver la vulnerabilidad conocida de `esbuild` (transitiva via Vite/Vitest) — hoy
      documentada mas que corregida, porque arreglarla implica un salto de version mayor de
      Vitest sin validar todavia. Afecta solo al servidor de desarrollo local, no a
      produccion.

---

## 8. Como correr todo localmente

**Frontend:**
```bash
cd "Dashboard Web Grupo TERRA"
npm install
cp .env.example .env.local   # completar VITE_GOOGLE_CLIENT_ID y VITE_AI_WORKER_URL
npm run dev                  # http://localhost:5173
```

**Worker (solo si se necesita modificarlo/probarlo localmente):**
```bash
cd "Dashboard Web Grupo TERRA/worker"
npm install
npx wrangler dev             # http://127.0.0.1:8787, usa .dev.vars para secretos locales (gitignored)
```

**Tests, lint, build:** ver `README.md` (seccion "Tests y lint" / "Build de produccion").

---

## 9. Referencias

- `README.md` — instalacion, estructura, build.
- `SECURITY.md` — politica de seguridad, CSP recomendada, dependencias. **Nota:** este
  archivo todavia describe la app como "sin backend, sin secretos de servidor" — desde la
  Fase A de IA eso ya no es 100% exacto (existe el Worker). Actualizar al tocar seguridad la
  proxima vez.
- `legacy/dashboard_agrota_v14_11_menu_exportacion.html` — version original de un solo
  archivo, ya no se mantiene, solo como referencia historica.
