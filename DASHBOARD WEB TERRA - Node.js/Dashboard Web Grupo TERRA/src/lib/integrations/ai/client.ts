// Cliente del endpoint /api/ai-insight del Worker (ver worker/src/index.js). El Worker es
// el unico lugar con la API key de Anthropic; este modulo nunca la toca ni la ve.
import { AI_WORKER_URL } from "../../config";

export async function requestModuleInsight(moduleLabel: string, summary: Record<string, unknown>): Promise<string> {
  if (!AI_WORKER_URL) {
    throw new Error("Falta configurar NEXT_PUBLIC_AI_WORKER_URL (.env.local) con la URL del Worker de IA.");
  }

  let res: Response;
  try {
    res = await fetch(`${AI_WORKER_URL}/api/ai-insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleLabel, summary }),
    });
  } catch {
    // El navegador nunca revela POR QUE fallo un fetch entre origenes (bloqueo CORS, DNS,
    // Worker caido, o realmente sin conexion son indistinguibles a nivel de JS) — por eso el
    // mensaje lista las causas probables en vez de asumir "sin internet". En desarrollo, la
    // causa mas comun con diferencia es que este origen todavia no este en ALLOWED_ORIGINS
    // del Worker desplegado (ver worker/wrangler.toml).
    throw new Error(
      "No se pudo contactar el Worker de IA. Causas probables: este origen no esta autorizado en ALLOWED_ORIGINS del Worker desplegado (worker/wrangler.toml necesita `npx wrangler deploy` tras cambiarlo), la URL en NEXT_PUBLIC_AI_WORKER_URL es incorrecta, el Worker no esta desplegado, o no hay conexion a internet."
    );
  }

  let data: { error?: string; insight?: string } = {};
  try {
    data = await res.json();
  } catch {
    // Se ignora: se usa el mensaje generico de abajo si el cuerpo no es JSON valido.
  }

  if (!res.ok) {
    throw new Error(data.error || `El servicio de IA respondio con error ${res.status}.`);
  }
  return data.insight || "";
}

export interface AiStatus {
  configured: boolean;
  ready: boolean;
  message: string;
}

// Verificacion manual ("Verificar conexion" en el dashboard, nunca automatica al cargar la
// pagina): el Worker intenta una generacion minima real contra Anthropic para confirmar que
// la API key y el credito/facturacion estan activos. Tiene un costo minimo (no es gratis),
// por eso el frontend nunca la llama por si solo.
export async function checkAiStatus(): Promise<AiStatus> {
  if (!AI_WORKER_URL) {
    return { configured: false, ready: false, message: "Falta configurar NEXT_PUBLIC_AI_WORKER_URL (.env.local) con la URL del Worker de IA." };
  }
  let res: Response;
  try {
    res = await fetch(`${AI_WORKER_URL}/api/ai-status`);
  } catch {
    return {
      configured: false,
      ready: false,
      message:
        "No se pudo contactar el Worker de IA. Causas probables: este origen no esta autorizado en ALLOWED_ORIGINS del Worker desplegado, la URL en NEXT_PUBLIC_AI_WORKER_URL es incorrecta, el Worker no esta desplegado, o no hay conexion a internet.",
    };
  }
  try {
    const data = (await res.json()) as AiStatus;
    return { configured: !!data.configured, ready: !!data.ready, message: data.message || "Estado desconocido." };
  } catch {
    return { configured: false, ready: false, message: `El Worker respondio con un formato inesperado (${res.status}).` };
  }
}
