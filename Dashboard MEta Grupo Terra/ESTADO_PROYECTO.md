# Estado del proyecto - AGROTA Ads Intelligence (Dashboard de Meta Ads)

Documento de continuidad. Objetivo: que cualquier persona (o una nueva sesión de IA sin
memoria de esta conversación) pueda entender qué se hizo, por qué, qué queda pendiente y
cómo seguir escalando el proyecto, sin tener que releer todo el historial de chat.

Última actualización: ver fecha del último commit relacionado a este archivo (aún sin
inicializar como repositorio propio — ver sección 3).

---

## 1. Resumen ejecutivo

Dashboard para analizar campañas de Meta Ads (Facebook/Instagram) de AGROTA y sus marcas,
construido desde cero en **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**. El
sistema de diseño (tema oscuro, tarjetas, sidebar, tipografía) está inspirado visualmente en
`Dashboard Web Grupo TERRA` (carpeta hermana en este mismo repositorio) — ver sección 10.

**Alcance completado:**
- 6 módulos: Resumen Ejecutivo, Campañas, Marcas, Creativos, Audiencias, Análisis
  Comparativo — todos leyendo datos **reales** de la API de Meta cuando hay una conexión
  activa, con datos de ejemplo (mock) como respaldo automático si no la hay.
- Conexión con Meta vía **Token de Usuario del Sistema** (Business Manager), no login
  interactivo — ver sección 3 y 5 para el porqué.
- Soporte **multi-cuenta**: cualquier cuenta publicitaria a la que el token tenga acceso se
  incluye automáticamente en el dashboard, cada una como su propia "marca" con color propio.
- 4 métricas adicionales sobre el conjunto base: frecuencia/fatiga de anuncios, presupuesto
  vs. gasto, embudo de conversión, calidad del anuncio (ranking de Meta).
- Una cuenta real conectada y verificada de punta a punta: **Sistec** (`act_3431422347076008`,
  marca dentro del grupo AGROTA).

---

## 2. Estructura de carpetas

```
Dashboard MEta Grupo Terra/          (el espacio en "MEta" es intencional, no corregir)
├── src/
│   ├── app/
│   │   ├── layout.tsx                 Root layout: fuente Inter, tema oscuro, <DashboardShell>
│   │   ├── page.tsx                   Módulo "Resumen ejecutivo" ("/")
│   │   ├── campanas/page.tsx          Módulo "Campañas"
│   │   ├── marcas/page.tsx            Módulo "Marcas"
│   │   ├── creativos/page.tsx         Módulo "Creativos"
│   │   ├── audiencias/page.tsx        Módulo "Audiencias"
│   │   ├── comparativo/page.tsx       Módulo "Análisis comparativo"
│   │   ├── conexiones/page.tsx        Estado de la conexión con Meta + cuentas detectadas (fuera del menú de 6 módulos)
│   │   └── api/
│   │       ├── auth/meta/{login,callback,logout}/route.ts   Flujo OAuth (alternativo, no es el método principal)
│   │       └── meta/
│   │           ├── accounts/route.ts        Lista cuentas publicitarias del token activo
│   │           └── dashboard-data/route.ts  Endpoint principal: trae campañas/insights/creativos/audiencias de TODAS las cuentas
│   ├── components/
│   │   ├── layout/                    Sidebar, TopBar, nav-config.ts (los 6 módulos)
│   │   ├── dashboard/                 DashboardShell, FilterBar (filtros globales)
│   │   ├── charts/                    Un componente Recharts por tipo de gráfico
│   │   └── ui/                        KpiCard, ChartCard, DataTable, StatusPill, ErrorBanner, etc.
│   ├── lib/
│   │   ├── types.ts                   Todos los tipos compartidos (Campaign, DailyInsight, Creative, etc.)
│   │   ├── metrics.ts                 Cálculos: CTR, CPC, CPM, frecuencia, costo/resultado, comparativos
│   │   ├── format.ts                  Formateo de moneda/números/fechas (es-EC)
│   │   ├── selectors.ts               Filtrado de campañas/insights por los filtros globales
│   │   ├── chart-colors.ts            Paleta y estilos compartidos de Recharts
│   │   ├── mock/
│   │   │   ├── random.ts              RNG determinista (mulberry32) + shuffle() — ver sección 4, punto 6
│   │   │   └── dataset.ts             Generador completo de datos de ejemplo (cuentas, marcas, campañas, creativos, audiencias)
│   │   └── meta/
│   │       ├── config.ts              Lee variables de entorno (META_APP_ID, META_SYSTEM_USER_TOKEN, etc.)
│   │       ├── session.ts             Resuelve el token activo (sistema > cookie OAuth) — getActiveAccessToken()
│   │       ├── graph-client.ts        Llamadas de bajo nivel a la Graph API de Meta (fetch + paginación)
│   │       └── live-data.ts           Mapea las respuestas de Meta a los tipos internos del dashboard (lo más importante de esta carpeta)
│   └── store/
│       ├── filters-store.ts           Zustand: fecha, cuenta, marca, objetivo, estado, campaña (filtros globales)
│       └── dashboard-data-context.tsx Contexto de React: pide /api/meta/dashboard-data y expone el resultado (o el mock) a todas las páginas
├── .env.local                          Credenciales reales (gitignored, ver sección 6)
├── .env.example                        Plantilla sin secretos (versionado)
└── package.json                        Script "dev" corre en el puerto 4200, no el 3000 por defecto
```

---

## 3. Decisiones de arquitectura clave (y el porqué)

| Decisión | Por qué |
|---|---|
| Next.js 16 + TypeScript + Tailwind v4, mismo sistema de diseño que `Dashboard Web Grupo TERRA` | Pedido explícito del usuario: reutilizar la estética/arquitectura de ese proyecto como plantilla para uno nuevo. |
| Proyecto ubicado dentro de `Mercadeo-Digital/`, que es un repositorio git de **otra organización** (`grupoterra-mercadeo/Mercadeo-Digital` en GitHub) | El usuario pidió mover el proyecto ahí explícitamente. **Importante:** nunca hacer `git add`/commit/push en este repo sin confirmación explícita de alcance — sería fácil subir por error el proyecto de AGROTA al repositorio compartido de Grupo TERRA. Este proyecto todavía no tiene su propio control de versiones. |
| Datos de ejemplo (mock) como **respaldo automático**, no como fase descartada | `DashboardDataProvider` intenta `/api/meta/dashboard-data`; si no hay conexión activa (`connected:false`), usa el `DATASET` mock completo sin que el usuario tenga que hacer nada. Así el dashboard nunca se ve "roto" si el token vence o no hay internet. |
| **Token de Usuario del Sistema** (Business Manager) como método principal de conexión, no login interactivo de Facebook | La app de Meta usada (tipo "Negocio") no ofrece "Facebook Login" como caso de uso agregable — se confirmó revisando las 14 opciones disponibles en el panel de Meta. El flujo OAuth (`/api/auth/meta/login`, etc.) se dejó construido como alternativa (gated por `isOAuthConfigured()`), pero **no es el camino que se usa hoy**. Ventaja adicional: el token de sistema no expira cada ~60 días como el de OAuth. |
| 1 cuenta publicitaria conectada = 1 "marca" en el modelo de datos | Meta no tiene concepto de "marca"; cada cuenta publicitaria de Meta se trata como su propia marca (mismo `id`), con un color propio de una paleta fija. Encaja con cómo trabaja AGROTA (una cuenta por marca/línea de negocio). |
| `/api/meta/dashboard-data` trae **todas** las cuentas del token en paralelo (`Promise.all`), no solo la primera | Corrección hecha en la fase de soporte multi-cuenta (sección 4). Si una cuenta falla, las demás igual se muestran; el error de la que falló se junta en un solo mensaje. |
| `selectors.ts` recibe `campaigns`/`dailyInsights` como parámetros explícitos, nunca importa el dataset directamente | Así el mismo código de cada página sirve tanto para datos mock como reales — es la pieza que permite que "conectar Meta" no haya requerido reescribir las 6 páginas. |
| Presupuesto (`daily_budget`/`lifetime_budget`/`budget_remaining`) se divide entre 100 al leerlo de Meta | Meta devuelve esos tres campos en **centavos** de la moneda de la cuenta; `spend` de Insights, en cambio, ya viene en la unidad principal (dólares). Fácil de confundir — ver `centsToAmount()` en `live-data.ts`. |
| "Resultados" se calcula con una lista de prioridad de `action_type` por objetivo (`RESULT_ACTION_PRIORITY`), no con el evento exacto de optimización de cada campaña | Conocer el evento exacto de optimización de cada campaña requeriría una llamada adicional por campaña. Es una heurística razonable, documentada como ajustable en el código — revisar si algún número no calza con lo que muestra Meta Ads Manager. |
| Miniaturas de creativos con `<img>` normal, no `next/image` | El CDN de Meta usa subdominios que cambian constantemente (`scontent.fcue8-1.fna.fbcdn.net`, etc.), incompatibles con la lista fija `remotePatterns` que exige `next/image`. |
| "Ubicación del anuncio" agrupa por `publisher_platform` (Facebook/Instagram/Messenger/Audience Network), no por `platform_position` (más fino: Feed/Reels/Historias/...) | Más legible para un tablero de marketing. Meta sí ofrece el desglose más fino si se necesita más adelante (ver sección 7). |

---

## 4. Bugs y mejoras encontrados/agregados durante el desarrollo

1. **Carpeta `ads-inteligence/` ajena y desordenada, encontrada al iniciar el proyecto.**
   Sin `package.json` en la raíz, con el proyecto real anidado en `ads-inteligence/Taller IA/`,
   conectado al repositorio de GitHub de otra persona (`WebMasterEsteban/Taller-IA` — parece
   material de un taller). **No se tocó ni se reutilizó.**
2. **La app de Meta usada no ofrece "Facebook Login" como caso de uso.** Confirmado revisando
   las 14 opciones disponibles en el panel de casos de uso de developers.facebook.com — ninguna
   es autenticación de usuarios (las apps tipo "Negocio" están orientadas a activos de Business
   Manager). Corregido pivotando a Token de Usuario del Sistema (ver sección 3).
3. **Generar el token fallaba con "No hay permisos disponibles"** aunque el usuario del sistema
   ya tenía los scopes `ads_read`/`business_management` configurados en el caso de uso de la
   app. Causa raíz: al usuario del sistema le faltaba un **rol sobre la app en sí** (activo
   separado del scope). Corregido en Configuración del negocio → Cuentas → Apps → (app) →
   "Asignar personas" → cambiar a "Usuarios del sistema".
4. **El token funcionaba pero `/me/adaccounts` devolvía una lista vacía.** Los permisos
   aparecían "granted" en `/me/permissions`, pero al usuario del sistema le faltaba el
   **segundo** activo separado: la cuenta publicitaria en sí (Usuarios del sistema → "Añadir
   activos" → Cuentas publicitarias). Diagnosticado llamando directo a `/me`,
   `/me/permissions` y `/me/adaccounts` con el token crudo — la forma más rápida de distinguir
   "token inválido" de "token válido sin acceso a activos" si esto se repite con una cuenta
   nueva.
5. **Meta dejó de aceptar el parámetro `ids` en lote a partir de v26.0** (`getCampaignStatuses`
   original fallaba con *"The ids query parameter is deprecated"*). Corregido pidiendo el
   detalle de cada campaña/anuncio **uno por uno** (`Promise.all` de fetches individuales) —
   ver `getCampaignDetails`/`getAdCreatives` en `graph-client.ts`.
6. **`META_GRAPH_API_VERSION=v21.0` (valor inicial) ya estaba obsoleto**; las respuestas de
   Meta redirigían solas a `v26.0` en la paginación. Corregido fijando `v26.0` como valor por
   defecto en `config.ts` — revisar el changelog de la Graph API si esto vuelve a quedar viejo.
7. **Bug real de hidratación de React, encontrado con Playwright, no con `curl`:** el generador
   de datos mock usaba `array.sort(() => rng() - 0.5)` para "barajar" — ese patrón invoca al
   comparador un número de veces que depende del motor de JavaScript (Node/V8 del servidor vs.
   Chromium del navegador no siempre coinciden), lo que desincroniza el generador aleatorio con
   semilla fija y produce nombres de campaña distintos entre servidor y cliente. Corregido con
   un Fisher-Yates propio (`shuffle()` en `lib/mock/random.ts`) que consume siempre
   `length - 1` llamadas, sin importar el motor. **Regla para el futuro: nunca usar el truco
   `sort(() => random() - 0.5)` en el generador mock — siempre `shuffle()`.**
8. **El gráfico de embudo de conversión (Recharts `Funnel`, forma de triángulo) se veía roto**
   con datos reales: las campañas de mensajería/interacción de Sistec no usan página de
   destino real, así que "Vistas de página" queda en 0 mientras "Resultados" (interacciones)
   puede superar a "Clics" — los pasos del embudo no son estrictamente decrecientes, algo que
   el componente `Funnel` de Recharts asume. Corregido cambiando a un gráfico de **barras
   horizontales** (`ConversionFunnelChart.tsx`), que renderiza bien sin importar la mezcla de
   objetivos. Se agregó además una nota bajo el gráfico cuando "Vistas de página" es 0,
   aclarando que es normal, no un error.
9. **Los rankings de calidad del anuncio (`quality_ranking`, etc.) devuelven "UNKNOWN"** para
   la cuenta Sistec — esto **no es un bug**: Meta necesita más volumen de impresiones/
   interacciones por anuncio para calcularlos. El dashboard lo muestra correctamente como "Sin
   datos suficientes"; debería empezar a poblarse solo con más actividad real.
10. **Todos los montos en dinero estaban fijos a "USD"**, sin importar la moneda real de
    cada cuenta publicitaria (`lib/format.ts` ignoraba el campo `currency` de `AdAccount`).
    Encontrado en una revisión general del sistema pedida por el usuario, antes de que
    causara un error real conectando una cuenta en otra moneda (COP/PEN, dado que AGROTA
    opera en Ecuador/Colombia/Perú). Corregido: `formatCurrency`/`formatCurrencyPrecise`
    ahora reciben el código de moneda como parámetro (con caché de `Intl.NumberFormat` por
    moneda); se agregó `resolveCurrency(accounts, campaigns)` en `selectors.ts`, que detecta
    si las campañas visibles pertenecen a una sola moneda o a varias. Cada **fila** de tabla
    (Campañas, Marcas, Creativos, comparativo por marca) usa la moneda de **su propia** cuenta
    — siempre precisa. Los **totales agregados** (KPIs y gráficos de Resumen/Comparativo/
    Marcas) usan la moneda dominante y muestran un banner de advertencia (amarillo, no rojo)
    cuando de verdad se están mezclando monedas distintas, en vez de sumarlas calladamente
    como si fueran la misma. **No se implementó conversión real entre monedas** (exchange
    rates) — decisión deliberada para no añadir una dependencia externa sin que el usuario lo
    pida; si se conectan cuentas de distinta moneda, lo correcto para comparar cifras es
    filtrar por Cuenta/Marca, no sumar todo junto.
11. **`/api/meta/dashboard-data` solo traía la primera cuenta publicitaria del token**
    (`accounts[0]`), aunque `/conexiones` ya listaba todas las disponibles. Corregido trayendo
    todas en paralelo y uniendo los resultados — ver sección 3. **Sin verificar visualmente
    con una segunda cuenta real todavía** (solo hay una conectada hoy) — ver sección 7.
12. **Una pestaña del navegador que ya estaba abierta se quedaba mostrando datos de ejemplo**
    después de que el servidor de desarrollo se reiniciara (por ejemplo, entre sesiones de
    trabajo) y la conexión con Meta volviera a estar disponible — `DashboardDataProvider`
    solo vuelve a pedir datos cuando cambian los filtros de fecha, no solo. El usuario lo
    reportó pensando que era un bug de datos ("¿por qué me muestra campañas que no son de esa
    cuenta?"), cuando en realidad la API ya respondía bien — confirmado pidiendo la API
    directo con `curl` mientras la pestaña seguía mostrando datos viejos. Corregido agregando
    un botón **"Actualizar datos"** en `FilterBar.tsx` que vuelve a pedir los datos sin
    esperar a un cambio de filtro. Detalle técnico: la primera implementación (una función
    `refresh` con `useCallback` invocada directo dentro de un `useEffect`) violaba la regla de
    ESLint `react-hooks/set-state-in-effect`; se resolvió con un contador `refreshTick` en el
    estado — `refresh()` solo incrementa ese contador (desde el `onClick`, no desde un efecto,
    así que la regla no aplica), y el mismo `useEffect` de carga original (que sí pasa esa
    regla) lo tiene como dependencia adicional.
13. **Soporte para conectar cuentas de un segundo negocio de Meta distinto (multi-token).**
    Hasta ahora el dashboard solo podía usar **un** token a la vez (`META_SYSTEM_USER_TOKEN`),
    lo que bastaba mientras todas las cuentas vivían bajo el mismo Business Manager (Sistec
    Market). Al querer conectar "Agrota Maquinaria" (un Business Manager completamente
    distinto) se probaron tres caminos: (a) **"Asignar socios"** para compartir la cuenta hacia
    el negocio de Sistec — descartado, el usuario no tiene ese permiso habilitado en Agrota
    Maquinaria; (b) **Token de Usuario del Sistema propio** de Agrota Maquinaria — descartado,
    la sección "Usuarios del sistema" no está disponible en ese negocio (posible causa: falta
    de Verificación de Empresa de Meta, sin confirmar del todo); (c) **token personal de corta
    duración**, generado manualmente desde developers.facebook.com → app "Agrota Reportes BI"
    → API de marketing → Herramientas — **la opción elegida**, aceptando que expira (horas o
    pocos días) y habrá que regenerarlo a mano cuando deje de funcionar. Se generalizó la capa
    de tokens para soportar cualquier combinación de los tres métodos: `getSystemUserTokens()`
    en `config.ts` ahora devuelve un arreglo (lee `META_SYSTEM_USER_TOKEN`, luego
    `META_SYSTEM_USER_TOKEN_2`, `_3`, ... mientras existan) y `getActiveAccessTokens()` en
    `session.ts` devuelve `ActiveToken[]` en vez de un solo token. `/api/meta/dashboard-data`
    ahora descubre las cuentas de **todos** los tokens en paralelo, tolera que uno falle sin
    tumbar a los demás (importante porque el token corto de Agrota Maquinaria puede vencer en
    cualquier momento) y reporta el error de ese token específico sin perder los datos de los
    demás. El índice de color de marca (`CHART_PALETTE`) es global a través de todos los
    tokens, no se reinicia por negocio. `/conexiones` ahora agrupa las cuentas visualmente por
    "Negocio 1 / Negocio 2 / ..." con el nombre real del Business Manager de cada una.
    **Verificado con datos reales**: la cuenta de Sistec y las 4 cuentas visibles del token de
    Agrota Maquinaria (incluye cuentas compartidas con ese usuario, no solo "Agrota
    Maquinaria") aparecen juntas en los 6 módulos, cada una con su propio color — confirmado
    con `curl` a `/api/meta/dashboard-data` y capturas de Playwright sin errores de consola en
    las 7 páginas. **Pendiente real**: el token de Agrota Maquinaria (`META_SYSTEM_USER_TOKEN_2`
    en `.env.local`) va a vencer — ver sección 7.
14. **Lista blanca de cuentas publicitarias (`META_AD_ACCOUNT_ALLOWLIST`), para poder elegir
    "Sistec" o "Agrota Maquinaria" de forma limpia.** Al conectar el token personal de Agrota
    Maquinaria (punto 13), el selector "Cuenta" del filtro pasó a mostrar **5** cuentas en vez
    de 2: además de Sistec y Agrota Maquinaria aparecían "Sebas Segarra", "Diego Paolo Pazan
    Maldonado" y "Agrota Maquinaria (Read-Only)" — cuentas ajenas a AGROTA que ese token
    personal también puede ver (a diferencia de un Token de Usuario del Sistema, un token
    personal hereda acceso a todo lo que esa persona puede ver, no solo al negocio buscado). El
    usuario pidió poder elegir Sistec o Agrota de forma independiente; se resolvió con una
    lista blanca configurable: `getAccountAllowlist()` en `config.ts` lee
    `META_AD_ACCOUNT_ALLOWLIST` (IDs de cuenta separados por coma) y `getAdAccounts()` en
    `graph-client.ts` filtra por ella — como es el único punto de entrada para leer cuentas, el
    filtro aplica automáticamente en `/api/meta/dashboard-data`, `/conexiones` y
    `/api/meta/accounts` sin tocar esos archivos. Hoy `.env.local` tiene
    `META_AD_ACCOUNT_ALLOWLIST=act_3431422347076008,act_277424209872033` (Sistec + Agrota
    Maquinaria); si no se define esta variable, se muestran todas las cuentas (comportamiento
    anterior, por si se necesita depurar o agregar una cuenta nueva más adelante). El selector
    "Cuenta" que ya existía en `FilterBar.tsx` no necesitó cambios — el usuario prefirió
    mantenerlo tal cual (menú desplegable) en vez de agregar botones tipo pestaña. **Bug menor
    encontrado y corregido de paso**: el texto "Rendimiento agregado de X campañas de N cuentas
    publicitarias" en Resumen Ejecutivo (`app/page.tsx`) usaba siempre el total de cuentas
    conectadas (`accounts.length`, sin filtrar) en vez de contar cuántas cuentas distintas
    quedaban realmente visibles tras aplicar el filtro — al elegir "Sistec" seguía diciendo "de
    2 cuentas publicitarias" en vez de "de 1". Corregido calculando el conteo real a partir de
    las campañas ya filtradas (`visibleAccountCount`). Verificado con Playwright: el selector
    "Cuenta" ahora solo lista "Todas las cuentas / Sistec / Agrota Maquinaria", y elegir cada
    una filtra correctamente todos los gráficos, KPIs y tablas de las 6 páginas (2 campañas de
    1 cuenta con Sistec, 10 campañas de 1 cuenta con Agrota Maquinaria) — tsc/lint limpios,
    cero errores de consola.

---

## 5. Integraciones externas

### 5.1 Meta Marketing API (Graph API v26.0)

**Autenticación:** Token de Usuario del Sistema generado en Business Manager, permanente
(no expira), guardado en `META_SYSTEM_USER_TOKEN`. Scopes: `ads_read`, `business_management`.

**Llamadas usadas** (todas en `src/lib/meta/graph-client.ts` + `live-data.ts`):
- `GET /me/adaccounts` — cuentas publicitarias visibles para el token.
- `GET /{account_id}/insights?level=campaign&time_increment=1` — métricas diarias por
  campaña (spend, impresiones, clics, reach, `actions[]`) para Resumen/Campañas/Marcas/
  Comparativo.
- `GET /{campaign_id}?fields=status,daily_budget,lifetime_budget,budget_remaining` — una
  por campaña, para estado y presupuesto.
- `GET /{account_id}/insights?level=ad` (sin `time_increment`, agregado por rango) — para
  Creativos, incluye `quality_ranking`/`engagement_rate_ranking`/`conversion_rate_ranking`.
- `GET /{ad_id}?fields=creative{...}` — una por anuncio, para miniatura/texto del creativo.
- `GET /{account_id}/insights?breakdowns=age,gender|publisher_platform|impression_device` —
  para Audiencias (3 llamadas, Meta exige age+gender juntos en una sola).

**Cuentas reales conectadas (2 negocios de Meta, 2 tokens — ver sección 4, punto 13):**
- Sistec (`act_3431422347076008`, negocio "SYSTEMMT MALDONADO Y TORAL CIA LTDA"), bajo el
  Business Manager "Sistec Market", app "Dashboard_Sistec" (id `1035429669489842`). Token
  de Usuario del Sistema, permanente (`META_SYSTEM_USER_TOKEN`).
- Agrota Maquinaria y 3 cuentas más visibles para ese usuario (`act_277424209872033`,
  `act_1380350067361153`, `act_127222230688863` "Sebas Segarra", `act_964307957092806`
  "Diego Paolo Pazan Maldonado"), negocio "Doble S", vía la app "Agrota Reportes BI"
  (id `946392530252084`). **Token personal de corta duración** (`META_SYSTEM_USER_TOKEN_2`)
  — no es permanente, va a vencer y hay que regenerarlo a mano.

### 5.2 Flujo OAuth (construido, no es el método activo)

`/api/auth/meta/{login,callback,logout}` implementan un login interactivo con Facebook
(intercambio de código → token corto → token largo, guardado en cookie httpOnly). Queda
como alternativa si en algún momento se necesita que un usuario distinto autorice su propia
cuenta sin acceso al Business Manager de Sistec — hoy no se usa porque el token de sistema
cubre el caso real.

---

## 6. Variables de entorno y secretos

| Variable | Dónde vive | Notas |
|---|---|---|
| `META_SYSTEM_USER_TOKEN` | `.env.local` (gitignored) | Cuenta Sistec. Generada en Business Manager, permanente. Nunca se mostró completa en el chat más de lo necesario para configurarla. |
| `META_SYSTEM_USER_TOKEN_2` | `.env.local` (gitignored) | Cuenta Agrota Maquinaria (negocio "Doble S"). **No es permanente** — token personal de corta duración, va a vencer (ver sección 4, punto 13, y sección 7). Se pueden agregar `_3`, `_4`, ... para más negocios. |
| `META_AD_ACCOUNT_ALLOWLIST` | `.env.local` | IDs de cuenta (separados por coma) a mostrar en el dashboard — hoy `act_3431422347076008,act_277424209872033` (Sistec + Agrota Maquinaria), para ocultar 3 cuentas ajenas visibles por el token personal de arriba (ver sección 4, punto 14). Vacía = mostrar todas. |
| `META_GRAPH_API_VERSION` | `.env.local` | `v26.0`. Revisar el changelog de Meta si vuelve a quedar obsoleta (ver sección 4, punto 6). |
| `META_APP_ID` / `META_APP_SECRET` | `.env.local` | Solo necesarias si se activa el flujo OAuth alternativo (sección 5.2). Vacías hoy — el token de sistema no las requiere. |
| `META_REDIRECT_URI` | `.env.local` | Idem, solo para OAuth. Por defecto `http://localhost:4200/api/auth/meta/callback`. |

`.env.example` (sin valores reales) está versionado; `.env.local` no (`.gitignore` ya cubre
`.env*`).

---

## 7. Pendientes / próximos pasos

- [ ] **El token de Agrota Maquinaria (`META_SYSTEM_USER_TOKEN_2`) va a vencer** (es personal,
      de corta duración — ver sección 4, punto 13). Cuando deje de funcionar, el dashboard
      seguirá mostrando bien la cuenta de Sistec pero Agrota Maquinaria desaparecerá con un
      error visible en `/conexiones`. Para renovarlo: developers.facebook.com → "Agrota
      Reportes BI" → API de marketing → Herramientas → generar un token nuevo con `ads_read`
      marcado → reemplazar el valor de `META_SYSTEM_USER_TOKEN_2` en `.env.local` → reiniciar
      el servidor. Mejor solución a futuro si se completa la Verificación de Empresa en Meta:
      revisar si ya aparece "Usuarios del sistema" en el Business Manager de Agrota Maquinaria
      y migrar a un Token de Usuario del Sistema permanente (mismo procedimiento que Sistec,
      sección 3).
- [ ] **Revisar la heurística de "Resultados"** (`RESULT_ACTION_PRIORITY` en `live-data.ts`)
      contra el Administrador de anuncios real cuando haya más volumen de datos, por si algún
      objetivo necesita otro `action_type` prioritario.
- [ ] **Revisar los rankings de calidad del anuncio** cuando la cuenta tenga más actividad —
      hoy muestran "Sin datos suficientes" correctamente (sección 4, punto 9), debería
      empezar a poblarse solo.
- [ ] **Decidir qué hacer con `ads-inteligence/`** (carpeta ajena encontrada al inicio, sección
      4, punto 1) — sigue sin tocar, a la espera de que el usuario decida si eliminarla,
      archivarla o dejarla como está.
- [ ] **Decidir si este proyecto necesita su propio repositorio git**, en vez de vivir sin
      versionar dentro de `Mercadeo-Digital/` (repo de otra organización) — ver advertencia en
      sección 3.
- [ ] Si se necesita el desglose de ubicación más fino (Feed/Reels/Historias en vez de solo
      Facebook/Instagram), cambiar el breakdown de `publisher_platform` a
      `publisher_platform,platform_position` en `getLiveAudienceShares`.
- [ ] Vigilar tiempos de carga si se conectan varias cuentas con muchas campañas activas a la
      vez: varias llamadas de detalle van una por una (campañas, anuncios) para evitar el
      parámetro `ids` en lote deprecado (sección 4, punto 5) — funciona bien con el volumen
      actual (pocas campañas activas), pero podría necesitar limitar concurrencia si crece
      mucho.

**Encontrado en la revisión general del sistema del 2026-08-21** (el problema de moneda —el
más importante— ya se corrigió, ver sección 4, punto 10; estos otros quedan pendientes):

- [ ] **Sin reintentos automáticos si Meta limita las peticiones** (rate limiting/429). Las
      llamadas de detalle una por una (sección 4, punto 5) hacen esto más probable si crece el
      volumen de campañas/anuncios activos. Hoy, si Meta rechaza una petición, esa sección
      simplemente muestra un error sin reintentar.
- [ ] **Desfase de zona horaria**: las fechas se calculan en UTC (en el navegador y al armar
      `since`/`until` para Meta), pero Meta interpreta esas fechas según la zona horaria
      configurada en cada cuenta publicitaria — para una cuenta en Ecuador (UTC-5) esto puede
      causar hasta ~5 horas de diferencia en qué cuenta como "un día". No afecta mucho los
      totales de varios días, pero el último día del rango puede no coincidir exactamente con
      el Administrador de anuncios.
- [ ] **El token no avisa si está por vencer o si fue revocado.** Ya existe `debugToken()` en
      `graph-client.ts` (consulta `/debug_token`, devuelve validez y fecha de expiración) pero
      no se usa en ningún lado. Se podría mostrar en `/conexiones` para detectar el problema
      antes de que el dashboard vuelva a datos de ejemplo sin explicación (mismo síntoma que
      la sección 4, punto 12) — **ahora más relevante**, porque el token de Agrota Maquinaria
      (`META_SYSTEM_USER_TOKEN_2`) sí va a vencer pronto (sección 4, punto 13).
- [ ] **La tabla de Campañas no tiene paginación** — no se nota con 2 campañas, pero crecerá.
- [ ] **No hay pruebas automatizadas** (Vitest/Jest) — un cambio futuro podría romper un
      cálculo (CTR, costo por resultado, frecuencia, etc.) sin que nadie lo note hasta verlo
      en pantalla.

---

## 8. Cómo correr todo localmente

```bash
cd "Dashboard MEta Grupo Terra"
npm install

# .env.local ya existe con META_SYSTEM_USER_TOKEN configurado.
# Si hace falta recrearlo desde cero:
cp .env.example .env.local
# completar META_SYSTEM_USER_TOKEN (ver sección 6 y sección 5.1 para cómo generarlo)

npm run dev          # http://localhost:4200
npx tsc --noEmit      # chequeo de tipos
npm run lint          # ESLint
npm run build          # build de producción
```

No hay suite de tests automatizados todavía (Vitest/Jest) — la verificación se hizo con
`tsc`/`eslint` en cada cambio y con Playwright para render real en navegador (ver sección 9).

---

## 9. Verificación realizada durante el desarrollo

- **Tipos:** `npx tsc --noEmit` sin errores, repetido después de cada cambio de tipos
  (presupuesto, `landingPageViews`, rankings de calidad, soporte multi-cuenta, etc.).
- **Lint:** `npm run lint` (ESLint) sin errores en cada fase.
- **Datos reales verificados directamente contra la API:** antes de programar cada
  integración (campañas, creativos, desgloses de audiencia, presupuesto), se probó primero
  con `curl` contra la Graph API real para confirmar la forma exacta de la respuesta, evitando
  adivinar nombres de campo.
- **Pruebas en navegador real con Playwright** (`npx playwright`, ya que `chromium-cli` no
  está instalado en esta máquina): capturas de pantalla + revisión de errores de consola en
  las 6 páginas + `/conexiones` después de cada fase importante. Esto encontró el bug real de
  hidratación del punto 7 (sección 4) que `curl` no podía detectar, porque `curl` solo ve el
  HTML previo a que el navegador ejecute JavaScript y traiga los datos reales.
- **Chequeo de salud completo** corrido a pedido del usuario: tsc + lint + las 7 páginas en
  navegador, sin errores de servidor ni de consola en ninguna.

---

## 10. Referencias

- `Dashboard Web Grupo TERRA/` (carpeta hermana en este mismo repositorio) — plantilla visual
  y de arquitectura para este proyecto, incluyendo el propio patrón de este archivo
  (`ESTADO_PROYECTO.md`).
- [Meta Marketing API — Insights](https://developers.facebook.com/docs/marketing-api/insights) —
  documentación de referencia para los campos/breakdowns usados.
- `agrota-dash-spark.lovable.app` — ejemplo original que definió la lista de 6 módulos del
  dashboard.