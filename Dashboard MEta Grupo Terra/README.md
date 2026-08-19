# AGROTA Ads Intelligence

Dashboard para analizar campañas de Meta Ads (Facebook/Instagram) de AGROTA y sus marcas.
Next.js 16 + TypeScript + Tailwind CSS v4.

**Para entender el estado del proyecto, decisiones de arquitectura, bugs corregidos y
pendientes, ver [`ESTADO_PROYECTO.md`](./ESTADO_PROYECTO.md)** — ese documento es la fuente
de verdad, no este README.

## Arranque rápido

```bash
npm install
npm run dev   # http://localhost:4200
```

Requiere `META_SYSTEM_USER_TOKEN` configurado en `.env.local` para ver datos reales de Meta
(ver sección 6 y 5.1 de `ESTADO_PROYECTO.md`). Sin esa variable, el dashboard funciona igual
con datos de ejemplo.
